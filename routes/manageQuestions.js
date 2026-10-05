const router = require("express").Router();
const prisma = require("../db/prisma");
const admin = require("../middleWare/admin");
const { body, validationResult } = require("express-validator");
const upload = require("../middleWare/uploadAudio");
const fs = require("fs");
const path = require("path");

const formatAudioUrl = (req, filename) =>
    `${req.protocol}://${req.get("host")}/${filename}`;

// DISPLAY ALL QUESTIONS
router.get("/", async (req, res) => {
    try {
        const questions = await prisma.question.findMany({
            include: { answers: true }
        });

        const formatted = questions.map((question) => ({
            ...question,
            audio_file: formatAudioUrl(req, question.audio_file)
        }));

        return res.status(200).json(formatted);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DISPLAY SPECIFIC QUESTION
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ msg: "invalid question id" });
        }

        const question = await prisma.question.findUnique({
            where: { id },
            include: { answers: true }
        });

        if (!question) {
            return res.status(404).json({ msg: "question not found !" });
        }

        return res.status(200).json({
            ...question,
            audio_file: formatAudioUrl(req, question.audio_file)
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// CREATE NEW QUESTION
router.post("/", admin, upload.single("audio"), body("name").isString().withMessage("name is required"), async (req, res) => {
    try {
        // 1- VALIDATION REQUEST
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ errors: errors.array() });
        }

        // 2- VALIDATE THE AUDIO FILE
        if (!req.file) {
            return res.status(400).json({
                errors: [{ msg: "audio file is required" }]
            });
        }

        // 3- SAVING INTO DB VIA PRISMA
        const newQuestion = await prisma.question.create({
            data: {
                name: req.body.name,
                audio_file: req.file.filename,
                status: req.body.status !== undefined ? parseInt(req.body.status, 10) : 1
            }
        });

        return res.status(201).json({
            msg: "question added",
            question: {
                ...newQuestion,
                audio_file: formatAudioUrl(req, newQuestion.audio_file)
            }
        });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ error: err.message });
    }
}
);

// UPDATE QUESTION DATA
router.put("/:id", admin, upload.single("audio"), body("name").optional().isString(), async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ msg: "invalid question id" });
        }

        // 1- VALIDATION REQUEST
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ errors: errors.array() });
        }

        // 2- CHECK IF QUESTION EXISTS
        const existing = await prisma.question.findUnique({
            where: { id }
        });

        if (!existing) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ msg: "question not found!" });
        }

        // 3- PREPARE QUESTION UPDATE DATA
        const updateData = {};
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.status !== undefined) {
            updateData.status = parseInt(req.body.status, 10);
        }

        if (req.file) {
            updateData.audio_file = req.file.filename;
            const oldFilePath = path.join("./upload", existing.audio_file);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // 4- UPDATE IN DB VIA PRISMA
        const updated = await prisma.question.update({
            where: { id },
            data: updateData
        });

        return res.status(200).json({
            msg: "question updated successfully",
            question: {
                ...updated,
                audio_file: formatAudioUrl(req, updated.audio_file)
            }
        });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ error: err.message });
    }
}
);

// DELETE QUESTION
router.delete("/:id", admin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ msg: "invalid question id" });
        }

        // 1- CHECK IF QUESTION EXISTS
        const existing = await prisma.question.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ msg: "question not found !" });
        }

        // 2- REMOVE QUESTION AUDIO FILE IF PRESENT
        const filePath = path.join("./upload", existing.audio_file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // 3- DELETE QUESTION (Cascades to related answers in database)
        await prisma.question.delete({
            where: { id }
        });

        return res.status(200).json({
            msg: "question deleted successfully"
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
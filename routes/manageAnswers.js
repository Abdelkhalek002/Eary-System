const router = require("express").Router();
const prisma = require("../db/prisma");
const admin = require("../middleWare/admin");

// DISPLAY ALL ANSWERS
router.get("/answers", async (req, res) => {
    try {
        const answers = await prisma.answer.findMany({
            include: { question: true }
        });

        return res.status(200).json(answers);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DISPLAY ANSWERS FOR A SPECIFIC QUESTION
router.get("/:id/answers", async (req, res) => {
    try {
        const questionId = parseInt(req.params.id, 10);
        if (isNaN(questionId)) {
            return res.status(400).json({ msg: "invalid question id" });
        }

        // Check if the question exists
        const question = await prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            return res.status(404).json({ msg: "question not found !" });
        }

        const answers = await prisma.answer.findMany({
            where: { question_id: questionId }
        });

        return res.status(200).json(answers);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// CREATE ANSWER FOR A SPECIFIC QUESTION
router.post("/:id/answers", admin, async (req, res) => {
    try {
        const questionId = parseInt(req.params.id, 10);
        if (isNaN(questionId)) {
            return res.status(400).json({ msg: "invalid question id" });
        }

        // Check if the question exists
        const question = await prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            return res.status(404).json({ msg: "question not found !" });
        }

        const newAnswer = await prisma.answer.create({
            data: {
                description: req.body.description,
                priority: req.body.priority !== undefined ? parseInt(req.body.priority, 10) : 0,
                question_id: questionId
            }
        });

        return res.status(201).json({
            msg: "answer added",
            answer: newAnswer
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE A SPECIFIC ANSWER
router.delete("/answers/:id", admin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ msg: "invalid answer id" });
        }

        const existing = await prisma.answer.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ msg: "answer not found !" });
        }

        await prisma.answer.delete({
            where: { id }
        });

        return res.status(200).json({
            msg: "answer deleted successfully"
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
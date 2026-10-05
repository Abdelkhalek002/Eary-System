const router = require("express").Router();
const prisma = require("../db/prisma");
const authorized = require("../middleWare/authorize");

// DISPLAY SPECIFIC USER RESULTS
router.get("/history/:id", authorized, async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ msg: "invalid user id" });
        }

        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ msg: "user not found !" });
        }

        const results = await prisma.result.findMany({
            where: { user_id: userId },
            orderBy: { date: "desc" }
        });

        return res.status(200).json(results);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// CREATE RESULT FOR SPECIFIC USER
router.post("/saveAnswers/:id", authorized, async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ msg: "invalid user id" });
        }

        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ msg: "user not found !" });
        }

        const score = parseFloat(req.body.score);
        if (isNaN(score)) {
            return res.status(400).json({ msg: "score is required and must be a number" });
        }

        const newResult = await prisma.result.create({
            data: {
                score,
                user_id: userId
            }
        });

        return res.status(201).json({
            msg: "new result added successfully",
            result: newResult
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
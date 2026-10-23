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

        let score = 0;
        if (req.body.answers) {
            let answerIds = [];
            if (Array.isArray(req.body.answers)) {
                answerIds = req.body.answers.map(a => (typeof a === "object" ? a.answer_id || a.id : a));
            } else if (typeof req.body.answers === "object") {
                answerIds = Object.values(req.body.answers);
            }
            const numericAnswerIds = answerIds
                .map(ansId => parseInt(ansId, 10))
                .filter(ansId => !isNaN(ansId));

            if (numericAnswerIds.length > 0) {
                const correctCount = await prisma.answer.count({
                    where: {
                        id: { in: numericAnswerIds },
                        priority: 99
                    }
                });
                score = correctCount;
            }
        } else if (req.body.score !== undefined) {
            score = parseFloat(req.body.score);
            if (isNaN(score)) {
                return res.status(400).json({ msg: "score is required and must be a number" });
            }
        } else {
            return res.status(400).json({ msg: "answers or score is required" });
        }

        const newResult = await prisma.result.create({
            data: {
                score,
                user_id: userId
            }
        });

        return res.status(201).json({
            msg: "new result added successfully",
            result: newResult,
            score: newResult.score
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;

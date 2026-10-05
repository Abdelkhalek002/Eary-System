const prisma = require("../db/prisma");

const admin = async (req, res, next) => {
    try {
        let token = req.headers.token;
        const authHeader = req.headers.authorization;

        // Extract from "Authorization: Bearer <token>"
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                msg: "Authentication token missing! Please send a Bearer token in the Authorization header."
            });
        }

        const user = await prisma.user.findFirst({
            where: { token }
        });

        if (user && user.role === 1) {
            req.user = user;
            next();
        } else {
            return res.status(403).json({
                msg: "you are not authorized to access this route !"
            });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

module.exports = admin;
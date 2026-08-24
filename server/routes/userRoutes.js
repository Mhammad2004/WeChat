const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", authMiddleware, (req, res) => {
    res.json({
        message: "Authentication successful",
        user: req.user
    });
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, username, email
             FROM users
             WHERE id != ?`,
            [req.user.id]
        );

        res.json(users);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch users"
        });
    }
});

module.exports = router;
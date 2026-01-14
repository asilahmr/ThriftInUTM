const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Fetch students information
router.get('/students', async (req, res) => {
    const query = "SELECT user_id, name FROM users WHERE role = 'student'";
    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
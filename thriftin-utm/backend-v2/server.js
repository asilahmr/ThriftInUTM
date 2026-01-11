const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Test Endpoint
app.get('/ping', (req, res) => {
    res.json({ message: 'pong v2' });
});

// ----------------- ROUTES ------------------
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/buying', require('./routes/buyerRoutes'));
app.use('/api/users', require('./routes/userRoutes'));


// ----------------- OTHER DIRECT ROUTES (Ported) ------------------

// 1. Analytics Activity (Ported)
app.get('/api/analytics/activity', async (req, res) => {
    try {
        // 1. Total Registered Users (Students only)
        const [usersCountResult] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
        const totalUsers = usersCountResult[0].count;

        // 2. Activities (Using Orders as proxy)
        // Join with students table to get degree info
        const [activitiesResult] = await db.query(`
      SELECT
        o.created_at as date,
        o.buyer_id as userId,
        1 as sessions,
        5 as duration, -- hardcoded avg duration
        s.degree_type,
        s.enrollment_year
      FROM orders o
      LEFT JOIN users u ON o.buyer_id = u.user_id
      LEFT JOIN students s ON u.user_id = s.user_id
      ORDER BY o.created_at DESC
    `);

        // 3. All Users Demographics (for Pie/Bar charts to show population, not just activity)
        const [demographicsResult] = await db.query(`
            SELECT degree_type, enrollment_year 
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            WHERE u.role = 'student'
        `);

        res.json({
            totalUsers,
            activities: activitiesResult,
            userDemographics: demographicsResult
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Server V2 running on http://0.0.0.0:${port}`);
});

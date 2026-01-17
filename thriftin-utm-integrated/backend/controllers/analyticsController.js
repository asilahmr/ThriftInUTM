const db = require('../config/db');


exports.getActivityAnalytics = async (req, res) => {
  console.log('GET /api/analytics/activity hit');
  try {
    // 1. Total registered students
    const usersCountResult = await db.query(
      "SELECT COUNT(*) AS count FROM user WHERE user_type = 'student'"
    );
    const totalUsers = (usersCountResult && usersCountResult[0]) ? usersCountResult[0].count : 0;
    console.log('Analytics Loaded. Total Users:', totalUsers);

    // 2. Activity data (using orders as activity)
    const activitiesResult = await db.query(`
      SELECT
        o.order_date AS date,
        o.buyer_id AS userId,
        1 AS sessions,
        5 AS duration,
        s.degree_type,
        s.enrollment_year
      FROM orders o
      LEFT JOIN user u ON o.buyer_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      ORDER BY o.order_date DESC
    `);

    // 3. Demographics
    const demographicsResult = await db.query(`
      SELECT s.degree_type, s.enrollment_year
      FROM students s
      JOIN user u ON s.user_id = u.id
      WHERE u.user_type = 'student'
    `);

    res.json({
      totalUsers,
      activities: activitiesResult,
      userDemographics: demographicsResult
    });

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to load analytics data' });
  }
};

const db = require('../config/db'); 


exports.getActivityAnalytics = async (req, res) => {
  try {
    // 1. Total registered students
    const [usersCountResult] = await db.query(
      "SELECT COUNT(*) AS count FROM user WHERE user_type = 'student'"
    );
    const totalUsers = usersCountResult[0].count;

    // 2. Activity data (using orders as activity)
    const [activitiesResult] = await db.query(`
      SELECT
        o.created_at AS date,
        o.buyer_id AS userId,
        1 AS sessions,
        5 AS duration,
        s.degree_type,
        s.enrollment_year
      FROM orders o
      LEFT JOIN user u ON o.buyer_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      ORDER BY o.created_at DESC
    `);

    // 3. Demographics
    const [demographicsResult] = await db.query(`
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

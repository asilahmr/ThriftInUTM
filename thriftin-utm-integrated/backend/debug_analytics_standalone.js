
const db = require('./config/db');

async function testAnalytics() {
    console.log('Starting standalone analytics test...');
    try {
        console.log('Test 1: Total Users Query');
        const countSql = "SELECT COUNT(*) AS count FROM user WHERE user_type = 'student'";
        const usersCountResult = await db.query(countSql);
        console.log('Users Count Result:', JSON.stringify(usersCountResult));

        const totalUsers = (usersCountResult && usersCountResult[0]) ? usersCountResult[0].count : 'undefined';
        console.log('Total Users Value:', totalUsers);

        console.log('Test 2: Activities Query');
        const activitySql = `
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
        `;
        const activitiesResult = await db.query(activitySql);
        console.log('Activities Result Length:', activitiesResult ? activitiesResult.length : 'null');
        if (activitiesResult && activitiesResult.length > 0) {
            console.log('First Activity:', JSON.stringify(activitiesResult[0]));
        }

        console.log('Test 3: Demographics Query');
        const demoSql = `
          SELECT s.degree_type, s.enrollment_year
          FROM students s
          JOIN user u ON s.user_id = u.id
          WHERE u.user_type = 'student'
        `;
        const demographicsResult = await db.query(demoSql);
        console.log('Demographics Result Length:', demographicsResult ? demographicsResult.length : 'null');

        console.log('Test Complete. Success.');
        process.exit(0);

    } catch (error) {
        console.error('Test Failed with Error:', error);
        process.exit(1);
    }
}

testAnalytics();



const fs = require('fs');
const logFile = 'standalone_log.txt';
fs.writeFileSync(logFile, 'Init...\n');

try {
    const db = require('./config/db');
    fs.appendFileSync(logFile, 'DB Imported\n');

    async function testAnalytics() {
        fs.appendFileSync(logFile, 'Starting Test\n');
        try {
            const countSql = "SELECT COUNT(*) AS count FROM user WHERE user_type = 'student'";
            const usersCountResult = await db.query(countSql);
            fs.appendFileSync(logFile, 'Users Count Result: ' + JSON.stringify(usersCountResult) + '\n');

            const totalUsers = (usersCountResult && usersCountResult[0]) ? usersCountResult[0].count : 'undefined';
            fs.appendFileSync(logFile, 'Total Users: ' + totalUsers + '\n');

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
            fs.appendFileSync(logFile, 'Activities Length: ' + (activitiesResult ? activitiesResult.length : 'null') + '\n');

            const demoSql = `
              SELECT s.degree_type, s.enrollment_year
              FROM students s
              JOIN user u ON s.user_id = u.id
              WHERE u.user_type = 'student'
            `;
            const demographicsResult = await db.query(demoSql);
            fs.appendFileSync(logFile, 'Demographics Length: ' + (demographicsResult ? demographicsResult.length : 'null') + '\n');

            fs.appendFileSync(logFile, 'Success\n');
            process.exit(0);

        } catch (error) {
            fs.appendFileSync(logFile, 'Error: ' + error.message + '\n');
            process.exit(1);
        }
    }
    testAnalytics();

} catch (e) {
    fs.appendFileSync(logFile, 'Top Level Error: ' + e.message + '\n');
}

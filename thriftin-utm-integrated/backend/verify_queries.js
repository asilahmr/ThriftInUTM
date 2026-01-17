require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'admin123',
    database: process.env.DB_NAME || 'thriftin_utm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

async function verifyQueries() {
    const pool = mysql.createPool(dbConfig);
    console.log('Verifying Fixed Queries...');

    try {
        // 1. Test Admin Sales Query (from salesRoutes.js)
        console.log('\n--- Testing Admin Sales Query ---');
        const salesQuery = `
            SELECT SUM(total_amount) AS total_revenue 
            FROM orders 
            WHERE order_status = 'completed'
        `;
        const [salesResult] = await pool.query(salesQuery);
        console.log('Sales Query Result:', salesResult[0]);


        // 2. Test Admin Buyer Query (from buyerRoutes.js - Top Buyers)
        console.log('\n--- Testing Admin Buyer Query (Top Buyers) ---');
        // Note: simplified filter for test
        const buyerQuery = `
            SELECT s.name, SUM(oi.product_price) AS totalSpent, COUNT(*) AS itemsBought
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN user u ON o.buyer_id = u.id
            LEFT JOIN students s ON u.id = s.user_id
            WHERE o.order_status = 'completed'
            GROUP BY o.buyer_id
            ORDER BY totalSpent DESC
            LIMIT 5
        `;
        // Use 'user' table instead of 'users' per schema? 
        // Wait! salesRoutes used 'users u'. buyerRoutes uses 'users u'.
        // Let's check if 'users' view/table exists or if it should be 'user'.
        // 'user' table is confirmed (from analyticsController).
        // Let's check if there is a 'users' table or alias.

        try {
            const [buyerResult] = await pool.query(buyerQuery);
            console.log('Buyer Query Result:', buyerResult);
        } catch (e) {
            console.error('Buyer Query Failed:', e.message);
        }

        // 3. Test Analytics Query (from analyticsController.js)
        console.log('\n--- Testing Analytics Query ---');
        const analyticsQuery = `
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
          LIMIT 5
        `;
        const [analyticsResult] = await pool.query(analyticsQuery);
        console.log('Analytics Query Result:', analyticsResult);

    } catch (error) {
        console.error('General Error:', error);
    } finally {
        await pool.end();
    }
}

verifyQueries();

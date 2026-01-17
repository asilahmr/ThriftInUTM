
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

const dbConfig = {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'admin123',
    database: process.env.DB_NAME || 'thriftin_utm'
};

async function checkBuyerSummary() {
    const pool = mysql.createPool(dbConfig);
    const userId = 13; // Aina

    console.log(`Checking buyer summary for User ID: ${userId}`);
    let logOutput = `Checking buyer summary for User ID: ${userId}\n`;

    try {
        // 1. Check Orders
        const [orders] = await pool.query(
            "SELECT * FROM orders WHERE buyer_id = ? AND order_status = 'completed'",
            [userId]
        );
        console.log(`Found ${orders.length} completed orders for user.`);
        logOutput += `Found ${orders.length} completed orders for user.\n`;

        if (orders.length > 0) {
            logOutput += 'Sample Order: ' + JSON.stringify(orders[0]) + '\n';
        }

        // 2. Check Order Items
        const [items] = await pool.query(`
            SELECT oi.*, p.category, oi.product_price
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.buyer_id = ? AND o.order_status = 'completed'
        `, [userId]);
        console.log(`Found ${items.length} order items via join.`);
        logOutput += `Found ${items.length} order items via join.\n`;

        // 3. Run the Summary Query from buyerRoutes.js
        const catQuery = `
            SELECT p.category, SUM(oi.product_price) AS totalSpent, COUNT(*) AS itemsBought
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.buyer_id = ? AND o.order_status = 'completed'
            GROUP BY p.category
            ORDER BY totalSpent DESC
        `;
        const [summary] = await pool.query(catQuery, [userId]);
        console.log('Summary Result:', summary);
        logOutput += 'Summary Result: ' + JSON.stringify(summary, null, 2) + '\n';

        fs.writeFileSync('buyer_debug_log.txt', logOutput);
        console.log('Log written to buyer_debug_log.txt');

    } catch (error) {
        console.error('Error:', error);
        fs.writeFileSync('buyer_debug_log.txt', 'Error: ' + error.message + '\n' + error.stack);
    } finally {
        await pool.end();
    }
}

checkBuyerSummary();


require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD, // Uses .env or fallback in catch
    database: process.env.DB_NAME || 'thriftin_utm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function checkBuyerStatus() {
    let pool = mysql.createPool(dbConfig);
    try {
        await pool.query('SELECT 1');
    } catch (e) {
        dbConfig.password = 'admin123';
        pool = mysql.createPool(dbConfig);
    }

    try {
        const userId = 13;
        console.log(`\n=== CHECKING PURCHASES FOR USER ${userId} ===`);

        // 1. Check Orders Table
        const [orders] = await pool.query(`
            SELECT order_id, total_amount, order_status, order_date
            FROM orders 
            WHERE buyer_id = ?
        `, [userId]);

        console.log(`Found ${orders.length} orders directly in 'orders' table.`);
        console.table(orders);

        if (orders.length === 0) {
            console.log("No orders found. Stop.");
            return;
        }

        const completedOrders = orders.filter(o => o.order_status === 'completed');
        console.log(`Completed Orders: ${completedOrders.length}`);

        // 2. Check Order Items with basic join
        const [items] = await pool.query(`
            SELECT oi.order_id, oi.product_name, oi.product_price
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.buyer_id = ? AND o.order_status = 'completed'
        `, [userId]);
        console.log(`\nFound ${items.length} items in 'order_items' for completed orders.`);
        console.table(items);

        // 3. Check the "Total Spending" query from buyerRoutes.js
        const totalQuery = `SELECT IFNULL(SUM(total_amount),0) AS total_spending, COUNT(*) AS total_orders FROM orders WHERE buyer_id = ? AND order_status = 'completed'`;
        const [totalResult] = await pool.query(totalQuery, [userId]);
        console.log('\n--- Route Query 1: Total Spending ---');
        console.log(totalResult[0]);

        // 4. Check the "Top Categories" query from buyerRoutes.js (Fixed version)
        const catQuery = `
            SELECT p.category, SUM(oi.product_price) AS totalSpent, COUNT(*) AS itemsBought
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.buyer_id = ? AND o.order_status = 'completed'
            GROUP BY p.category
            ORDER BY totalSpent DESC
        `;
        const [catResult] = await pool.query(catQuery, [userId]);
        console.log('\n--- Route Query 2: Top Categories ---');
        console.table(catResult);

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

checkBuyerStatus();

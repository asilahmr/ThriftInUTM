require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'thriftin_utm'
};

async function checkSchema() {
    let pool = mysql.createPool(dbConfig);
    try {
        await pool.query('SELECT 1');
    } catch {
        dbConfig.password = 'admin123';
        pool = mysql.createPool(dbConfig);
    }

    try {
        console.log('\n=== SCHEMA CHECK ===');
        const [orderItemsCols] = await pool.query('DESCRIBE order_items');
        console.log('--- order_items ---');
        orderItemsCols.forEach(c => console.log(`${c.Field}: ${c.Type}`));

        const [ordersCols] = await pool.query('DESCRIBE orders');
        console.log('\n--- orders ---');
        ordersCols.forEach(c => console.log(`${c.Field}: ${c.Type}`));

        console.log('\n=== SUM CHECK ===');
        const query = `
            SELECT SUM(oi.product_price) AS total_revenue, COUNT(*) AS total_items_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE oi.seller_id = 13 AND o.order_status = 'completed'
        `;
        const [rows] = await pool.query(query);
        console.log("SUM Result:", rows);

    } catch (e) {
        console.error(e.message);
    } finally {
        await pool.end();
    }
}

checkSchema();

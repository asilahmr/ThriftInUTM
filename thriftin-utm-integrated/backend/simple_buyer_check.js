
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'admin123',
    database: process.env.DB_NAME || 'thriftin_utm'
};

async function check() {
    console.log('STARTING CHECK');
    const pool = mysql.createPool(dbConfig);
    const userId = 13;

    try {
        const [orders] = await pool.query("SELECT * FROM orders WHERE buyer_id = ?", [userId]);
        console.log('Orders found:', orders.length);
        if (orders.length > 0) {
            console.log('First Order Status:', orders[0].order_status);
        }

        const [items] = await pool.query("SELECT * FROM order_items oi JOIN orders o ON oi.order_id = o.order_id WHERE o.buyer_id = ?", [userId]);
        console.log('Items found:', items.length);

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await pool.end();
        console.log('DONE');
    }
}

check();

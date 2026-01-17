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

async function checkOrderData() {
    const pool = mysql.createPool(dbConfig);
    console.log('Checking Order Data...');

    try {
        const [orders] = await pool.query('SELECT order_id, buyer_id, total_amount, order_status, created_at FROM orders');

        if (orders.length === 0) {
            console.log('No orders found in database.');
        } else {
            console.log(`Found ${orders.length} orders.`);
            orders.forEach(o => {
                console.log(`Order ID: ${o.order_id}, Status: '${o.order_status}', Amount: ${o.total_amount}, Date: ${o.created_at}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkOrderData();


const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'admin123',
    database: process.env.DB_NAME || 'thriftin_utm'
};

async function check() {
    try {
        fs.writeFileSync('status.txt', 'Starting DB Check...\n');
        const pool = mysql.createPool(dbConfig);
        const [rows] = await pool.query('SELECT 1');
        fs.appendFileSync('status.txt', 'DB Connected! Result: ' + JSON.stringify(rows) + '\n');

        // Also run the logic test here
        const userId = 13;
        const [orders] = await pool.query("SELECT COUNT(*) as c FROM orders WHERE buyer_id = ?", [userId]);
        fs.appendFileSync('status.txt', `Orders for User 13: ${orders[0].c}\n`);

        await pool.end();
        fs.appendFileSync('status.txt', 'Done.\n');
    } catch (e) {
        fs.writeFileSync('status.txt', 'Error: ' + e.message);
    }
}

check();

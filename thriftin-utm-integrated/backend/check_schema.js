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

async function checkSchema() {
    const pool = mysql.createPool(dbConfig);
    console.log('Checking Schema...');

    try {
        const [columns] = await pool.query('DESCRIBE orders');
        console.log('--- ORDERS TABLE COLUMNS ---');
        columns.forEach(col => {
            console.log(`${col.Field} (${col.Type})`);
        });

        const [itemColumns] = await pool.query('DESCRIBE order_items');
        console.log('\n--- ORDER_ITEMS TABLE COLUMNS ---');
        itemColumns.forEach(col => {
            console.log(`${col.Field} (${col.Type})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkSchema();

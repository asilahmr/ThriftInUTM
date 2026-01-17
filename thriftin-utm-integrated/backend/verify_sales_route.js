
require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifySalesRoute() {
    const dbConfig = {
        host: '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'admin123',
        database: process.env.DB_NAME || 'thriftin_utm'
    };

    let pool = mysql.createPool(dbConfig);
    console.log('Verifying Sales Route Queries...');

    try {
        const category = 'Books';
        const query = `
            SELECT p.name, oi.product_price AS revenue, o.order_date as sold_at
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE p.category = ?
            ORDER BY o.order_date DESC;
        `;

        console.log(`Executing query for category: ${category}`);
        const [rows] = await pool.query(query, [category]);
        console.log('Query successful! Rows:', rows.length);
        if (rows.length > 0) {
            console.log('Sample data:', rows[0]);
        }

    } catch (error) {
        console.error('VERIFICATION FAILED:', error.message);
    } finally {
        await pool.end();
    }
}

verifySalesRoute();

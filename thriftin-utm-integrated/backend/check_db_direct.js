
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'admin123',
    database: process.env.DB_NAME || 'thriftin_utm'
};

async function checkDirectly() {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Connected. Checking orders for user 13...");

    try {
        const [rows] = await connection.execute(
            'SELECT order_id, buyer_id, total_amount, order_status FROM orders WHERE buyer_id = 13'
        );
        console.log("Orders found:", rows);

        if (rows.length > 0) {
            console.log("Checking order_items for first order...");
            const [items] = await connection.execute(
                'SELECT * FROM order_items WHERE order_id = ?',
                [rows[0].order_id]
            );
            console.log("Order items:", items);
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await connection.end();
    }
}

checkDirectly();

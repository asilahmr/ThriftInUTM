require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'thriftin_utm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function checkStatus() {
    let pool = mysql.createPool(dbConfig);

    // Connection check
    try {
        await pool.query('SELECT 1');
    } catch (e) {
        dbConfig.password = 'admin123';
        pool = mysql.createPool(dbConfig);
    }

    try {
        const userId = 13;
        console.log(`\n=== CHECKING SALES FOR USER ${userId} ===`);

        // Get all items sold by this user and their order status
        const [rows] = await pool.query(`
            SELECT 
                oi.order_id, 
                oi.product_name, 
                oi.product_price,
                o.order_status,
                o.order_date
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE oi.seller_id = ?
        `, [userId]);

        if (rows.length === 0) {
            console.log("No sales found for this user.");
        } else {
            console.table(rows);

            const completedCount = rows.filter(r => r.order_status === 'completed').length;
            console.log(`\nTotal Sales: ${rows.length}`);
            console.log(`Completed Sales: ${completedCount}`);
            console.log(`Pending/Other: ${rows.length - completedCount}`);

            if (completedCount === 0) {
                console.log("\n⚠️  WARNING: No 'completed' sales found. Dashboard only shows completed sales.");
            }
        }

    } catch (err) {
        console.error(err.message);
    } finally {
        await pool.end();
    }
}

checkStatus();

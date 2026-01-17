require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'sales_debug_log.txt');

function log(message) {
    console.log(message);
    fs.appendFileSync(logFile, message + '\n');
}

// Clear previous log
fs.writeFileSync(logFile, '');

const dbConfig = {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'thriftin_utm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function debugSales() {
    let pool = mysql.createPool(dbConfig);

    // Fallback password logic
    try {
        await pool.query('SELECT 1');
        log('✅ Connected with ENV password');
    } catch (e) {
        log('Using fallback password: admin123');
        await pool.end();
        dbConfig.password = 'admin123';
        pool = mysql.createPool(dbConfig);
    }

    try {
        log('\n=== 1. FINDING USERS WITH SALES ===');
        const [sellers] = await pool.query(`
            SELECT oi.seller_id, COUNT(*) as items_sold_count
            FROM order_items oi
            GROUP BY oi.seller_id
        `);

        if (sellers.length === 0) {
            log('❌ No sellers found in order_items table.');
        } else {
            log(`Found ${sellers.length} sellers.`);
            sellers.forEach(s => log(`- User ID: ${s.seller_id}, Items Sold: ${s.items_sold_count}`));
        }

        log('\n=== 2. ANALYZING ORDERS FOR TOP SELLER ===');
        if (sellers.length > 0) {
            const topSellerId = sellers[0].seller_id;
            log(`Checking details for Seller ID: ${topSellerId}`);

            // Check raw order items
            const [items] = await pool.query(`
                SELECT oi.order_id, oi.product_price, o.order_status, o.created_at
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.order_id
                WHERE oi.seller_id = ?
            `, [topSellerId]);

            items.forEach(item => {
                log(`Order #${item.order_id}: RM${item.product_price} - Status: '${item.order_status}'`);
            });

            // Simulate the dashboard query
            log('\n=== 3. SIMULATING DASHBOARD QUERY ===');
            const revenueQuery = `
                SELECT SUM(oi.product_price) AS total_revenue, COUNT(*) AS total_items_sold
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.order_id
                WHERE oi.seller_id = ? AND o.order_status = 'completed'
            `;

            const [dashboardResult] = await pool.query(revenueQuery, [topSellerId]);
            log('Dashboard Query Result:');
            log(JSON.stringify(dashboardResult[0], null, 2));

            if (dashboardResult[0].total_revenue === null) {
                log('⚠️ RESULT IS NULL. Likely because no orders have status "completed".');
            }
        }

    } catch (err) {
        log(`ERROR: ${err.message}`);
    } finally {
        await pool.end();
        process.exit();
    }
}

debugSales();

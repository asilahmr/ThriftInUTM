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

async function findVerifiedUser() {
    const pool = mysql.createPool(dbConfig);
    console.log('Checking database for verified users with history...');

    try {
        // 1. Find verified users
        const [users] = await pool.query(`
            SELECT u.id, u.email, s.name, s.matric, s.verification_status, s.email_verified
            FROM user u
            JOIN students s ON u.id = s.user_id
            WHERE s.verification_status = 'verified' OR s.email_verified = 1
        `);

        if (users.length === 0) {
            console.log('No verified users found.');
        } else {
            console.log(`Found ${users.length} verified users (verified status OR email verified).`);

            for (const user of users) {
                console.log(`\nChecking User: ${user.email} (ID: ${user.id})`);
                console.log(`  - Verification Status: ${user.verification_status}`);
                console.log(`  - Email Verified: ${user.email_verified}`);

                // Check Buying History
                const [buyOrders] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE buyer_id = ?', [user.id]);
                const buyCount = buyOrders[0].count;

                // Check Sales History (via order_items seller_id)
                const [salesOrders] = await pool.query('SELECT COUNT(*) as count FROM order_items WHERE seller_id = ?', [user.id]);
                const salesCount = salesOrders[0].count;

                // Check Products Listed (active or sold)
                const [products] = await pool.query('SELECT COUNT(*) as count FROM products WHERE seller_id = ?', [user.id]);
                const productCount = products[0].count;

                console.log(`  - Buying History: ${buyCount} orders`);
                console.log(`  - Sales History: ${salesCount} sales`);
                console.log(`  - Products Listed: ${productCount}`);

                if (buyCount > 0 || salesCount > 0) {
                    console.log('  >>> MATCH: This user has history!');
                }
            }
        }

        // 2. Check global product count
        console.log('\n-----------------------------------');
        console.log('Checking global product statistics...');
        const [totalProducts] = await pool.query('SELECT COUNT(*) as count FROM products');
        console.log(`Total products in database: ${totalProducts[0].count}`);

        if (totalProducts[0].count > 0) {
            const [sampleProduct] = await pool.query('SELECT * FROM products LIMIT 1');
            console.log('Sample product:', {
                id: sampleProduct[0].product_id,
                name: sampleProduct[0].name,
                seller_id: sampleProduct[0].seller_id,
                status: sampleProduct[0].status
            });

            // Find who owns this product
            const [seller] = await pool.query('SELECT email FROM user WHERE id = ?', [sampleProduct[0].seller_id]);
            if (seller.length > 0) {
                console.log(`Product Owner: ${seller[0].email}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

findVerifiedUser();

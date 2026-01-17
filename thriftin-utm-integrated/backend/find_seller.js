const db = require('./config/db').pool;

async function findSellerWithSales() {
    try {
        const query = `
            SELECT u.email, u.password, u.id, COUNT(oi.order_item_id) as sales_count
            FROM user u
            JOIN order_items oi ON u.id = oi.seller_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.order_status = 'completed'
            GROUP BY u.id
            ORDER BY sales_count DESC
            LIMIT 1
        `;
        const [rows] = await db.execute(query);

        if (rows.length > 0) {
            console.log('Found seller with sales:');
            console.log('Email:', rows[0].email);
            // Password might be hashed, but we can at least point to the user
            console.log('User ID:', rows[0].id);
            console.log('Sales Count:', rows[0].sales_count);
        } else {
            console.log('No sellers found with completed sales.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

findSellerWithSales();

const db = require('./config/db').pool;

async function activateProducts() {
    console.log('=== ACTIVATING PRODUCTS ===');
    try {
        const [result] = await db.execute("UPDATE products SET status = 'active' WHERE status IS NULL OR status != 'active'");
        console.log(`✅ Updated ${result.affectedRows} products to 'active' status.`);

        const [rows] = await db.execute("SELECT product_id, name, status FROM products LIMIT 5");
        console.log('Sample verified products:', rows);

    } catch (err) {
        console.error('❌ Error updating products:', err);
    } finally {
        process.exit();
    }
}

activateProducts();

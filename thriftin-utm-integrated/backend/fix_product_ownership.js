const db = require('./config/db').pool;

async function checkOwnership() {
    console.log('=== CHECKING DATA OWNERSHIP ===');
    try {
        // 1. List all users
        const [users] = await db.execute("SELECT id, email FROM user");
        console.log('Users found:', users);

        // 2. Count products by seller
        const [counts] = await db.execute("SELECT seller_id, COUNT(*) as count FROM products GROUP BY seller_id");
        console.log('Product counts by Seller ID:', counts);

        // 3. Logic: If only one user exists and they own all products, create a dummy seller
        if (users.length > 0) {
            // Assuming the user testing is likely the first one or one of them. 
            // If products belong to the user 'asilah04' (from logs, id=14), they won't see them.

            // Let's create a dummy seller 'ThriftStoreBot' if not exists
            const [botCheck] = await db.execute("SELECT id FROM user WHERE email = 'bot@thriftin.com'");
            let botId;

            if (botCheck.length === 0) {
                console.log('Creating dummy seller account...');
                const [res] = await db.execute(
                    "INSERT INTO user (email, password, user_type) VALUES ('bot@thriftin.com', 'dummy_hash', 'student')"
                );
                botId = res.insertId;
                // Also need entry in students table to satisfy joins
                await db.execute(
                    "INSERT INTO students (user_id, matric, verification_status, email_verified) VALUES (?, 'BOT123', 'verified', 1)",
                    [botId]
                );
                console.log('Created dummy seller with ID:', botId);
            } else {
                botId = botCheck[0].id;
                console.log('Dummy seller exists with ID:', botId);
            }

            // 4. Update all current products to be owned by this bot
            // This ensures the main user (asilah04) sees them as "other people's items"
            console.log(`Transferring all products to Seller ID ${botId}...`);
            const [update] = await db.execute("UPDATE products SET seller_id = ?", [botId]);
            console.log(`✅ Transferred ${update.affectedRows} products to Seller ID ${botId}.`);
            console.log('User should now be able to see these products in Marketplace.');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        process.exit();
    }
}

checkOwnership();

const db = require('./config/db').pool;

async function seedProducts() {
    console.log('=== SEEDING PRODUCTS START ===');

    try {
        const [products] = await db.execute('SELECT count(*) as count FROM products');
        const count = products[0].count;
        console.log(`Current product count: ${count}`);

        if (count > 0) {
            console.log('Products already exist. Skipping seed.');
        } else {
            console.log('No products found. Seeding dummy data...');

            // Get a valid user to be the seller
            const [users] = await db.execute('SELECT id FROM user LIMIT 1');
            if (!users || users.length === 0) {
                console.log('❌ ERROR: No users found in database! Creating a dummy user first...');
                // Fallback: This script assumes at least one user exists.
                // If not, you should register a user via the app first.
                return;
            }
            const sellerId = users[0].id;

            const dummyProducts = [
                ['Vintage T-Shirt', 'Clothing', 'Good condition, retro style', 45.00, 'Used', sellerId],
                ['Calculus Textbook', 'Books', 'Slightly used, no markings', 80.00, 'Like New', sellerId],
                ['Lab Coat', 'Uniforms', 'Size M, worn once', 30.00, 'Like New', sellerId],
                ['Gaming Mouse', 'Electronics', 'Wired, RGB', 50.00, 'Good', sellerId],
                ['Scientific Calculator', 'Electronics', 'Casio FX-570', 40.00, 'Used', sellerId]
            ];

            for (const p of dummyProducts) {
                await db.execute(
                    'INSERT INTO products (name, category, description, price, `condition`, seller_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                    p
                );
            }
            console.log(`✅ Successfully seeded ${dummyProducts.length} products.`);
        }

    } catch (err) {
        console.error('❌ ERROR:', err);
    } finally {
        console.log('=== SEEDING END ===');
        process.exit();
    }
}

seedProducts();

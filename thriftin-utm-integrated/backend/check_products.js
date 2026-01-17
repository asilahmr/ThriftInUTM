const db = require('./config/db').pool;
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'check_products_log.txt');
function log(msg) {
    if (typeof msg === 'object') msg = JSON.stringify(msg, null, 2);
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

async function checkAndSeedProducts() {
    log('=== PRODUCT CHECK START ===');

    try {
        // 1. Check existing products
        const [products] = await db.execute('SELECT count(*) as count FROM products');
        const count = products[0].count;
        log(`Current product count: ${count}`);

        if (count > 0) {
            log('Products exist. Listing first 5...');
            const [list] = await db.execute('SELECT product_id, name, category, price, seller_id FROM products LIMIT 5');
            log(list);
        } else {
            log('No products found. Seeding dummy data...');

            // Get a valid user to be the seller
            const [users] = await db.execute('SELECT id FROM user LIMIT 1');
            if (users.length === 0) {
                log('No users found! Cannot seed products without a seller.');
                return;
            }
            const sellerId = users[0].id;
            log(`Seeding products for Seller ID: ${sellerId}`);

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
            log(`✅ Seeded ${dummyProducts.length} products.`);
        }

    } catch (err) {
        log('❌ ERROR: ' + err.message);
    } finally {
        log('=== PRODUCT CHECK END ===');
        process.exit();
    }
}

checkAndSeedProducts();

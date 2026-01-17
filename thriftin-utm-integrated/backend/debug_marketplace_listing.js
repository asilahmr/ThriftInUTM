const db = require('./config/db').pool;

async function debugMarketplace() {
    console.log('=== MARKETPLACE QUERY DEBUG ===');

    // Hardcoded User ID 14 (asilah04)
    const userId = 14;
    console.log(`Testing as User ID: ${userId}`);

    try {
        // 1. Check Total Products
        console.log('1. Checking Total Products Status...');
        const [all] = await db.execute("SELECT count(*) as total, status FROM products GROUP BY status");
        console.log('Product Status Distribution: ' + JSON.stringify(all));

        // 2. Check Seller Distribution
        console.log('2. Checking Seller Distribution...');
        const [sellers] = await db.execute("SELECT seller_id, name, email FROM user JOIN products ON user.id = products.seller_id GROUP BY seller_id");
        console.log('Active Sellers: ' + JSON.stringify(sellers));

        // 3. Simulate The Exact Model Query
        console.log('3. Simulating MarketplaceModel Query...');
        const query = `
          SELECT 
            p.product_id, p.name, p.status, p.seller_id
          FROM products p
          JOIN user u ON p.seller_id = u.id
          LEFT JOIN students s ON u.id = s.user_id
          WHERE p.status = 'active' AND p.seller_id != ?
          LIMIT 10
        `;
        const [rows] = await db.execute(query, [userId]);
        console.log(`Filtered Query Results Count: ${rows.length}`);
        console.log('Results: ' + JSON.stringify(rows));

        // 4. If empty, check why
        if (rows.length === 0) {
            console.log('\n--- DIAGNOSIS ---');

            // Check status for distinct seller products
            const [others] = await db.execute("SELECT * FROM products WHERE seller_id != ?", [userId]);
            if (others.length === 0) {
                console.log("❌ CRITICAL: All products belong to User ID 14! The ownership fix script might have failed or assigned to ID 14.");
                // Fetch sample to see who owns them
                const [sample] = await db.execute("SELECT * FROM products LIMIT 1");
                console.log("Sample product: " + JSON.stringify(sample));
            } else {
                console.log(`Found ${others.length} products from other sellers (not ID 14).`);
                const first = others[0];
                console.log('Sample product from another seller: ' + JSON.stringify(first));

                if (first.status !== 'active') {
                    console.log(`❌ STATUS MISMATCH: Product status is '${first.status}', expected 'active'.`);
                }

                // Check if JOIN user u ON p.seller_id = u.id is failing
                const [userCheck] = await db.execute("SELECT * FROM user WHERE id = ?", [first.seller_id]);
                if (userCheck.length === 0) {
                    console.log(`❌ JOIN FAILURE: Seller ID ${first.seller_id} does not exist in 'user' table.`);
                } else {
                    console.log(`✅ Seller ID ${first.seller_id} exists in 'user' table.`);

                    // Check students table join if necessary (it's a LEFT JOIN so shouldn't block, but verify)
                    const [studentCheck] = await db.execute("SELECT * FROM students WHERE user_id = ?", [first.seller_id]);
                    console.log(`Student check for Seller ID ${first.seller_id}: Found ${studentCheck.length} records.`);
                }
            }
        } else {
            console.log('✅ Query returns data! The issue is likely frontend integration or pagination params.');
        }

    } catch (err) {
        console.error('❌ DB Error:', err);
    } finally {
        console.log('=== END DEBUG ===');
        process.exit();
    }
}

debugMarketplace();

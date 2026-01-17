
const MarketplaceModel = require('./models/marketplaceModel');
const db = require('./config/db');

async function testCategoryFetch() {
    try {
        console.log('Testing categories fetch...');
        // Using User ID 13 which exists in the dump
        const userId = 13;
        const category = 'Books';

        console.log(`Fetching products for category: ${category}, User: ${userId}`);

        const products = await MarketplaceModel.getProductsByCategory(userId, category);

        console.log('Successfully fetched products:');
        console.log(JSON.stringify(products, null, 2));

    } catch (error) {
        console.error('CRITICAL ERROR in getProductsByCategory:');
        console.error(error);
        const fs = require('fs');
        fs.writeFileSync('error_log.txt', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } finally {
        if (db.pool) {
            await db.pool.end();
        }
    }
}

testCategoryFetch();

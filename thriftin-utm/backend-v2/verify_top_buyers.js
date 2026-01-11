
console.log("Starting verify_top_buyers.js...");
const db = require('./config/db');

async function testTopBuyers() {
    console.log("Querying database...");
    try {
        const [topBuyersResult] = await db.query(
            `SELECT u.name, SUM(oi.snapshot_price) AS totalSpent, COUNT(oi.order_item_id) AS itemsBought
          FROM orders o
          JOIN order_items oi ON o.order_id = oi.order_id
          JOIN users u ON o.buyer_id = u.user_id
          WHERE o.order_status = 'completed'
          GROUP BY o.buyer_id
          ORDER BY totalSpent DESC
          LIMIT 5`
        );
        console.log("Top Buyers Result:", JSON.stringify(topBuyersResult, null, 2));
        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

testTopBuyers();

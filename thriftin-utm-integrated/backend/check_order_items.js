const db = require('./config/db').pool;

async function checkSchema() {
    try {
        const [rows] = await db.execute("DESCRIBE order_items");
        console.log('Table Schema: order_items');
        console.log(rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkSchema();

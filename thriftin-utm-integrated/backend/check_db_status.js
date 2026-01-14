require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "admin123",
    database: process.env.DB_NAME || "thriftin_utm"
});

console.log('Connecting to database...');
connection.connect(err => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected.');

    connection.query('SELECT COUNT(*) as count FROM products', (err, results) => {
        if (err) {
            console.error('❌ Query failed:', err.message);
        } else {
            console.log('✅ Products count:', results[0].count);

            if (results[0].count > 0) {
                connection.query('SELECT * FROM products LIMIT 1', (err, rows) => {
                    console.log('Sample product:', rows[0]);
                    connection.end();
                });
            } else {
                connection.end();
            }
        }
    });
});

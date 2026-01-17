require('dotenv').config();
const mysql = require('mysql2'); // NOT promise version, to match server.js

const db = mysql.createPool({
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'admin123',
    database: process.env.DB_NAME || 'thriftin_utm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

function testInsert() {
    console.log('Testing Insert into login_attempts without callback...');
    const logSql = "INSERT INTO login_attempts (email, user_id, success, ip_address) VALUES (?, ?, true, ?)";

    try {
        // user_id 13 exists (Ainazafirah)
        db.query(logSql, ['test@debug.com', 13, '::1']);
        console.log('Insert initiated (no callback). Waiting...');

        setTimeout(() => {
            console.log('Timeout reached. Application did not crash yet.');
            db.end();
        }, 2000);

    } catch (e) {
        console.error('Synchronous error caught:', e);
    }
}

testInsert();

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'admin123',
    database: process.env.DB_NAME || 'thriftin_utm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

async function createTable() {
    const pool = mysql.createPool(dbConfig);
    console.log('Creating login_attempts table...');

    const createTableSql = `
        CREATE TABLE IF NOT EXISTS login_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            user_id INT,
            success BOOLEAN DEFAULT FALSE,
            ip_address VARCHAR(45),
            attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
        )
    `;

    try {
        await pool.query(createTableSql);
        console.log('✅ login_attempts table created successfully OR already exists.');

        // Verify
        const [cols] = await pool.query('DESCRIBE login_attempts');
        console.log('--- Table Schema ---');
        cols.forEach(col => console.log(`${col.Field} (${col.Type})`));

    } catch (error) {
        console.error('❌ Error creating table:', error);
    } finally {
        await pool.end();
    }
}

createTable();

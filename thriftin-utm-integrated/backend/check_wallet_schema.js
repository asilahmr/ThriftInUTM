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

async function checkWalletSchema() {
    const pool = mysql.createPool(dbConfig);
    console.log('Checking Wallet Schema...');

    try {
        const [walletCols] = await pool.query('DESCRIBE wallets');
        console.log('--- WALLETS TABLE COLUMNS ---');
        walletCols.forEach(col => {
            console.log(`${col.Field} (${col.Type})`);
        });

        const [transCols] = await pool.query('DESCRIBE wallet_transactions');
        console.log('\n--- WALLET_TRANSACTIONS TABLE COLUMNS ---');
        transCols.forEach(col => {
            console.log(`${col.Field} (${col.Type})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkWalletSchema();

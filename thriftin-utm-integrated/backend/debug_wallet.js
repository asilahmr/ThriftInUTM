const db = require('./config/db').pool;
const WalletModel = require('./models/walletModel');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'debug_wallet_log.txt');
function log(msg) {
    if (typeof msg === 'object') msg = JSON.stringify(msg, null, 2);
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

async function debugWallet() {
    log('=== WALLET DEBUG START ===');

    // Test with the user ID from previous steps or a known ID
    const userId = 1;

    try {
        log(`Checking user ID: ${userId}`);

        // 1. Check direct DB stats
        log('1. SQL Direct Check...');
        const [rows] = await db.execute(`
            SELECT 
                COALESCE(SUM(CASE WHEN transaction_type = 'top_up' THEN amount ELSE 0 END), 0) as total_topped_up,
                COUNT(*) as count
            FROM wallet_transactions
            WHERE user_id = ?
        `, [userId]);
        log('SQL Result: ' + JSON.stringify(rows));

        // 2. Call Model Method
        log('\n2. Model.getTransactionStats...');
        const stats = await WalletModel.getTransactionStats(userId);
        log('Stats Result: ' + JSON.stringify(stats));

        // 3. Call Summary Method (The one failing)
        log('\n3. Model.getWalletSummary...');
        const summary = await WalletModel.getWalletSummary(userId);
        log('Summary Result: ' + JSON.stringify(summary));

    } catch (err) {
        log('❌ ERROR CAUGHT: ' + err.message);
        if (err.stack) log(err.stack);
    } finally {
        log('=== WALLET DEBUG END ===');
        process.exit();
    }
}

debugWallet();

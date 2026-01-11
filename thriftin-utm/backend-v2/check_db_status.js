const fs = require('fs');
const db = require('./config/db');

async function check() {
    let log = '';
    try {
        log += 'Connecting...\n';
        const [tables] = await db.query('SHOW TABLES');
        log += 'Tables:\n' + JSON.stringify(tables, null, 2) + '\n';

        const [users] = await db.query('SELECT * FROM users LIMIT 1');
        log += 'Users sample:\n' + JSON.stringify(users, null, 2) + '\n';

        log += 'Connection successful.\n';
    } catch (err) {
        log += 'Error:\n' + err.stack + '\n';
    }

    fs.writeFileSync('db_status.txt', log);
    process.exit();
}

check();

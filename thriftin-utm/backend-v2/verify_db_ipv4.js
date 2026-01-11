const mysql = require('mysql2');

// Force IPv4 loopback
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'thriftinutm'
});

console.log('Attempting to connect to 127.0.0.1...');

connection.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected successfully!');
    process.exit(0);
});

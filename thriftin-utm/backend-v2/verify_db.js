const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'thriftinutm'
});

console.log('Attempting to connect...');

connection.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected.');

    // Check tables
    connection.query('SHOW TABLES', (err, results) => {
        if (err) {
            console.error('Show tables failed:', err);
        } else {
            console.log('Tables:', results.map(r => Object.values(r)[0]));
        }

        // Check order columns
        connection.query('DESCRIBE orders', (err, results) => {
            if (err) console.error('Desc orders failed:', err);
            else console.log('Orders columns:', results.map(r => r.Field));

            process.exit(0);
        });
    });
});

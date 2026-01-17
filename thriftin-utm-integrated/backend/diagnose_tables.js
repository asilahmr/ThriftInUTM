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

async function checkTables() {
    const pool = mysql.createPool(dbConfig);
    console.log('Checking Student and Login Schemas...');

    try {
        console.log('\n--- STUDENTS TABLE ---');
        try {
            const [cols] = await pool.query('DESCRIBE students');
            cols.forEach(col => console.log(`${col.Field} (${col.Type})`));
        } catch (e) { console.log('Error describing students:', e.message); }

        console.log('\n--- LOGIN_ATTEMPTS TABLE ---');
        try {
            const [cols] = await pool.query('DESCRIBE login_attempts');
            cols.forEach(col => console.log(`${col.Field} (${col.Type})`));
        } catch (e) { console.log('Error describing login_attempts:', e.message); }

        console.log('\n--- TESTING LOGIN QUERY ---');
        try {
            const email = 'ainazafirah@graduate.utm.my'; // Known valid user
            const sql = `
                SELECT 
                  u.*,
                  s.matric,
                  s.degree_type,
                  s.faculty_code,
                  s.enrollment_year,
                  s.estimated_graduation_year,
                  s.email_verified
                FROM user u
                LEFT JOIN students s ON u.id = s.user_id
                WHERE u.email = ?
            `;
            const [rows] = await pool.query(sql, [email]);
            console.log('Login query success. Rows found:', rows.length);
            if (rows.length > 0) console.log('User ID:', rows[0].id);
        } catch (e) { console.log('Login query failed:', e.message); }

    } catch (error) {
        console.error('General Error:', error);
    } finally {
        await pool.end();
    }
}

checkTables();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const sqlFilePath = path.join(__dirname, '../thriftin_utm (12).sql');

async function setupDatabase() {
    console.log('Starting database setup...');

    // Create connection without database to create it
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'admin123',
        multipleStatements: true // Keep this true just in case
    });

    try {
        console.log('Connected to MySQL server.');

        // Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS thriftin_utm`);
        console.log('Database thriftin_utm created or already exists.');

        // Select database
        await connection.query(`USE thriftin_utm`);

        // Read SQL file
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`SQL file not found at: ${sqlFilePath}`);
        }

        console.log(`Reading SQL file from: ${sqlFilePath}`);
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Parsing and importing schema...');

        // Custom Splitter for Delimiters
        const statements = [];
        let currentDelimiter = ';';
        let buffer = '';
        const lines = sqlContent.split(/\r?\n/);

        for (let line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.toUpperCase().startsWith('DELIMITER ')) {
                currentDelimiter = trimmedLine.split(' ')[1].trim();
                continue;
            }

            // Skip comments if needed, but keeping them is usually safe unless they contain delimiters
            // Simple check to skip empty lines
            if (trimmedLine === '' && buffer.trim() === '') continue;

            buffer += line + '\n';

            // Checks if buffer ends with delimiter
            // We check trimmed buffer end, but careful about multi-character delimiters like $$
            const trimmedBuffer = buffer.trim();

            if (trimmedBuffer.endsWith(currentDelimiter)) {
                // Remove delimiter from the end
                let statement = trimmedBuffer.substring(0, trimmedBuffer.length - currentDelimiter.length).trim();

                // Remove DEFINER clauses to avoid permission errors if user is different
                // Regex to remove DEFINER=`root`@`localhost` or similar
                statement = statement.replace(/DEFINER=`[^`]+`@`[^`]+`/gi, '');

                if (statement) {
                    statements.push(statement);
                }
                buffer = '';
            }
        }

        // Execute queries sequentially
        console.log(`Found ${statements.length} statements to execute.`);

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            try {
                await connection.query(stmt);
                // process.stdout.write('.'); // Progress indicator
            } catch (err) {
                console.error(`\n❌ Error executing statement #${i + 1}:`);
                console.error(stmt.substring(0, 100) + '...');
                console.error(err.message);
                // Don't exit, try to continue? or fail? Fails usually mean dependency missing or syntax error. 
                // For this user, better to see the error but finish what can be finished.
            }
        }
        console.log('\n✅ Database setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

setupDatabase();

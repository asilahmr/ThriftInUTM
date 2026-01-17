
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'admin123',
    database: process.env.DB_NAME || 'thriftin_utm'
};

const buildDateFilter = (query, dateColumn = 'order_date') => {
    const { month, year, type } = query;
    let clause = '';
    const params = [];

    if (type === 'today') {
        clause = ` AND DATE(${dateColumn}) = CURRENT_DATE()`;
    }
    else if (type === 'thisMonth') {
        clause = ` AND MONTH(${dateColumn}) = MONTH(CURRENT_DATE()) AND YEAR(${dateColumn}) = YEAR(CURRENT_DATE())`;
    }
    else if (type === 'lastMonth') {
        clause = ` AND MONTH(${dateColumn}) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(${dateColumn}) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))`;
    }
    else if (month && year) {
        clause = ` AND MONTH(${dateColumn}) = ? AND YEAR(${dateColumn}) = ?`;
        params.push(month, year);
    }
    return { clause, params };
};

async function testLogic() {
    const pool = mysql.createPool(dbConfig);
    const userId = 13;

    try {
        console.log('--- Testing NO Filters ---');
        let filter = buildDateFilter({}, 'order_date');
        let query = `SELECT COUNT(*) as count FROM orders WHERE buyer_id = ? AND order_status = 'completed' ${filter.clause}`;
        let [rows] = await pool.query(query, [userId, ...filter.params]);
        console.log('No Filter Count:', rows[0].count);

        console.log('--- Testing "today" Filter ---');
        filter = buildDateFilter({ type: 'today' }, 'order_date');
        query = `SELECT COUNT(*) as count FROM orders WHERE buyer_id = ? AND order_status = 'completed' ${filter.clause}`;
        [rows] = await pool.query(query, [userId, ...filter.params]);
        console.log('Today Filter Count:', rows[0].count);

        console.log('--- Testing "thisMonth" Filter ---');
        filter = buildDateFilter({ type: 'thisMonth' }, 'order_date');
        query = `SELECT COUNT(*) as count FROM orders WHERE buyer_id = ? AND order_status = 'completed' ${filter.clause}`;
        [rows] = await pool.query(query, [userId, ...filter.params]);
        console.log('This Month Filter Count:', rows[0].count);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

testLogic();

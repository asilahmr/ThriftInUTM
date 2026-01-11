const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper to build date filter clause
const buildDateFilter = (req, dateColumn = 'created_at') => {
    const { month, year, type } = req.query;
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

// User sales dashboard
router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    // const { month, year } = req.query; // Used in buildDateFilter

    // Filter logic
    // revenueQuery originally: FROM order_items WHERE seller_id = ?
    let revenueQuery = `
        SELECT SUM(oi.snapshot_price) AS total_revenue, COUNT(*) AS total_items_sold
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.seller_id = ? AND o.order_status = 'completed'
    `;

    let categoriesQuery = `
        SELECT p.category, COUNT(oi.order_item_id) AS items_sold, SUM(oi.snapshot_price) AS revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.seller_id = ? AND o.order_status = 'completed'
    `;

    const filter = buildDateFilter(req, 'o.created_at');

    revenueQuery += filter.clause;
    categoriesQuery += filter.clause + ` GROUP BY p.category ORDER BY items_sold DESC`;

    // Combine params
    const queryParams = [userId, ...filter.params];

    try {
        const [revenueResult] = await db.query(revenueQuery, queryParams);
        const [categoriesResult] = await db.query(categoriesQuery, queryParams);

        res.json({
            total_revenue: revenueResult[0].total_revenue || 0,
            total_items_sold: revenueResult[0].total_items_sold || 0,
            top_categories: categoriesResult
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin sales dashboard
router.get('/admin', async (req, res) => {
    console.log('Admin Sales Dashboard requested', req.query);

    const filter = buildDateFilter(req, 'o.created_at'); // joined
    const singleTableFilter = buildDateFilter(req, 'created_at'); // direct

    // Admin sees total platform stats
    let totalRevenueQuery = `SELECT SUM(total_amount) AS total_revenue FROM orders WHERE order_status = 'completed' ${singleTableFilter.clause}`;

    let totalItemsQuery = `
        SELECT COUNT(*) AS total_items_sold 
        FROM order_items oi 
        JOIN orders o ON oi.order_id = o.order_id 
        WHERE o.order_status = 'completed' ${filter.clause}
    `;

    let topCategoriesQuery = `
      SELECT p.category, COUNT(oi.order_item_id) AS items_sold, SUM(oi.snapshot_price) AS revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_status = 'completed' ${filter.clause}
      GROUP BY p.category
      ORDER BY items_sold DESC
    `;

    let topSellersQuery = `
      SELECT u.name, COUNT(oi.order_item_id) AS sold_count, SUM(oi.snapshot_price) AS revenue
      FROM order_items oi
      JOIN users u ON oi.seller_id = u.user_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_status = 'completed' ${filter.clause}
      GROUP BY oi.seller_id
      ORDER BY revenue DESC
      LIMIT 5
    `;

    try {
        const [revResult] = await db.query(totalRevenueQuery, singleTableFilter.params);
        const [itemsResult] = await db.query(totalItemsQuery, filter.params);
        const [catResult] = await db.query(topCategoriesQuery, filter.params);
        const [sellerResult] = await db.query(topSellersQuery, filter.params);

        res.json({
            total_revenue: revResult[0].total_revenue || 0,
            total_items_sold: itemsResult[0].total_items_sold || 0,
            top_categories: catResult,
            top_sellers: sellerResult
        });
    } catch (err) {
        console.error('Admin Sales Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Sales trends for a user parameters
router.get('/trends/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { month, year, type } = req.query;

    try {
        let whereClause = `WHERE oi.seller_id = ? AND o.order_status = 'completed'`;
        let params = [userId];

        // Append filter
        const filter = buildDateFilter(req, 'o.created_at');
        whereClause += filter.clause;
        params = [...params, ...filter.params];

        let dateFormat = '%Y-%m-%d';

        // Dynamic Aggregation Logic
        if (type === 'thisMonth' || type === 'lastMonth' || (month && year)) {
            dateFormat = '%Y-%m-%d';
        } else {
            // "All Time" - check data range
            const [rangeResult] = await db.query(
                `SELECT DATEDIFF(MAX(o.created_at), MIN(o.created_at)) as diff_days 
                 FROM order_items oi
                 JOIN orders o ON oi.order_id = o.order_id
                 WHERE oi.seller_id = ? AND o.order_status = 'completed'`,
                [userId]
            );
            const diffDays = rangeResult[0].diff_days || 0;

            if (diffDays > 365) dateFormat = '%Y';
            else if (diffDays > 180) dateFormat = '%Y-%m';
            else dateFormat = '%Y-%m-%d';
        }

        const query = `
            SELECT DATE_FORMAT(o.created_at, '${dateFormat}') AS date, SUM(oi.snapshot_price) AS daily_revenue, COUNT(*) AS items_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            ${whereClause}
            GROUP BY date
            ORDER BY date;
        `;

        const [results] = await db.query(query, params);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Global sales trends for admin
router.get('/trends', async (req, res) => {
    const { month, year, type } = req.query; // extract for logic check

    try {
        let whereClause = `WHERE order_status = 'completed'`;
        const filter = buildDateFilter(req, 'created_at');
        whereClause += filter.clause;
        const params = [...filter.params];

        let dateFormat = '%Y-%m-%d';

        if (type === 'thisMonth' || type === 'lastMonth' || (month && year)) {
            dateFormat = '%Y-%m-%d';
        } else {
            const [rangeResult] = await db.query(
                `SELECT DATEDIFF(MAX(created_at), MIN(created_at)) as diff_days FROM orders WHERE order_status = 'completed'`
            );
            const diffDays = rangeResult[0].diff_days || 0;

            if (diffDays > 365) dateFormat = '%Y';
            else if (diffDays > 180) dateFormat = '%Y-%m';
            else dateFormat = '%Y-%m-%d';
        }

        const query = `
            SELECT DATE_FORMAT(created_at, '${dateFormat}') AS date, SUM(total_amount) AS daily_revenue, COUNT(*) AS items_sold
            FROM orders
            ${whereClause}
            GROUP BY date
            ORDER BY date;
        `;
        const [results] = await db.query(query, params);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User sales by category
router.get('/user/:userId/category/:category', async (req, res) => {
    const { userId, category } = req.params;

    const query = `
        SELECT p.name, oi.snapshot_price AS revenue, o.created_at as sold_at
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.seller_id = ? AND p.category = ?
        ORDER BY o.created_at DESC;
      `;

    try {
        const [results] = await db.query(query, [userId, category]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Global products by category for admin
router.get('/category/:category', async (req, res) => {
    const { category } = req.params;
    const query = `
        SELECT p.name, oi.snapshot_price AS revenue, o.created_at as sold_at
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE p.category = ?
        ORDER BY o.created_at DESC;
      `;

    try {
        const [results] = await db.query(query, [category]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper to build date filter clause
// Now accepts { month, year, type } object directly for clarity
const buildDateFilter = (query, dateColumn = 'created_at') => {
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

// Student buyer summary
router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { month, year, type } = req.query;

    const filter = buildDateFilter(req.query, 'created_at'); // for orders table
    const itemFilter = buildDateFilter(req.query, 'o.created_at'); // for joined tables

    try {
        // Total spending
        const totalQuery = `SELECT IFNULL(SUM(total_amount),0) AS total_spending, COUNT(*) AS total_items FROM orders WHERE buyer_id = ? AND order_status = 'completed' ${filter.clause}`;
        const [totalResult] = await db.query(totalQuery, [userId, ...filter.params]);

        // Top categories
        const catQuery = `
            SELECT p.category, SUM(oi.snapshot_price) AS totalSpent, COUNT(*) AS itemsBought
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.buyer_id = ? AND o.order_status = 'completed' ${itemFilter.clause}
            GROUP BY p.category
            ORDER BY totalSpent DESC
        `;
        const [categoriesResult] = await db.query(catQuery, [userId, ...itemFilter.params]);

        // Buying trend - Dynamic Aggregation
        let dateFormat = '%Y-%m-%d';

        if (type === 'thisMonth' || type === 'lastMonth' || (month && year)) {
            dateFormat = '%Y-%m-%d';
        } else {
            const [rangeResult] = await db.query(
                `SELECT DATEDIFF(MAX(created_at), MIN(created_at)) as diff_days 
                 FROM orders
                 WHERE buyer_id = ? AND order_status = 'completed'`,
                [userId]
            );
            const diffDays = rangeResult[0].diff_days || 0;
            if (diffDays > 365) dateFormat = '%Y';
            else if (diffDays > 180) dateFormat = '%Y-%m';
            else dateFormat = '%Y-%m-%d';
        }

        const trendQuery = `
            SELECT DATE_FORMAT(created_at, '${dateFormat}') AS date, SUM(total_amount) AS total
            FROM orders
            WHERE buyer_id = ? AND order_status = 'completed' ${filter.clause}
            GROUP BY date
            ORDER BY date
        `;
        const [trendResult] = await db.query(trendQuery, [userId, ...filter.params]);

        res.json({
            totalSpending: totalResult[0].total_spending,
            totalItems: totalResult[0].total_items,
            topCategories: categoriesResult,
            trend: trendResult
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin buyer summary (global)
router.get('/admin', async (req, res) => {
    const { month, year, type } = req.query;
    console.log('Admin Buyer Query Params:', { month, year, type });

    const filter = buildDateFilter(req.query, 'created_at');
    const itemFilter = buildDateFilter(req.query, 'o.created_at');
    console.log('Admin Buyer Clauses:', { filter: filter.clause, itemFilter: itemFilter.clause });

    try {
        // Total spending
        const totalQuery = `SELECT IFNULL(SUM(total_amount),0) AS total_spending, COUNT(*) AS total_orders FROM orders WHERE order_status = 'completed' ${filter.clause}`;
        const [totalResult] = await db.query(totalQuery, filter.params);

        const itemsQuery = `
            SELECT COUNT(*) AS total_items 
            FROM order_items oi 
            JOIN orders o ON oi.order_id = o.order_id 
            WHERE o.order_status = 'completed' ${itemFilter.clause}
        `;
        const [totalItemsResult] = await db.query(itemsQuery, itemFilter.params);

        // Top categories
        const catQuery = `
            SELECT p.category, SUM(oi.snapshot_price) AS totalSpent, COUNT(*) AS itemsBought
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.order_status = 'completed' ${itemFilter.clause}
            GROUP BY p.category
            ORDER BY totalSpent DESC
        `;
        const [categoriesResult] = await db.query(catQuery, itemFilter.params);

        // Buying trend - Dynamic Aggregation
        let dateFormat = '%Y-%m-%d';
        if (type === 'thisMonth' || type === 'lastMonth' || (month && year)) {
            dateFormat = '%Y-%m-%d';
        } else {
            const [rangeResult] = await db.query(
                `SELECT DATEDIFF(MAX(created_at), MIN(created_at)) as diff_days 
                 FROM orders
                 WHERE order_status = 'completed'`
            );
            const diffDays = rangeResult[0].diff_days || 0;
            if (diffDays > 365) dateFormat = '%Y';
            else if (diffDays > 180) dateFormat = '%Y-%m';
            else dateFormat = '%Y-%m-%d';
        }

        const trendQuery = `
            SELECT DATE_FORMAT(created_at, '${dateFormat}') AS date, SUM(total_amount) AS total
            FROM orders
            WHERE order_status = 'completed' ${filter.clause}
            GROUP BY date
            ORDER BY date
        `;
        const [trendResult] = await db.query(trendQuery, filter.params);

        // Top buyers - THIS IS THE REPORTED ISSUE
        // Explicitly check logic here.
        // itemFilter uses o.created_at.
        const buyersQuery = `
            SELECT u.name, SUM(oi.snapshot_price) AS totalSpent, COUNT(*) AS itemsBought
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN users u ON o.buyer_id = u.user_id
            WHERE o.order_status = 'completed' ${itemFilter.clause}
            GROUP BY o.buyer_id
            ORDER BY totalSpent DESC
            LIMIT 5
        `;
        const [topBuyersResult] = await db.query(buyersQuery, itemFilter.params);

        res.json({
            totalSpending: totalResult[0].total_spending,
            totalItems: totalItemsResult[0].total_items,
            topCategories: categoriesResult,
            trend: trendResult,
            topBuyers: topBuyersResult
        });
    } catch (err) {
        console.error('Admin Buyer Route Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Buyer items by category (student)
router.get('/user/:userId/category/:category', async (req, res) => {
    const { userId, category } = req.params;

    try {
        const [results] = await db.query(
            `SELECT p.name, oi.snapshot_price AS amount, o.created_at AS sold_at
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.order_id
          JOIN products p ON oi.product_id = p.product_id
          WHERE o.buyer_id = ? AND p.category = ? AND o.order_status = 'completed'
          ORDER BY o.created_at DESC`,
            [userId, category]
        );

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

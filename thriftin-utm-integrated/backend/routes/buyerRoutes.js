const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/authMiddleWare');

// Helper to build date filter clause
// Now accepts { month, year, type } object directly for clarity
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

// Apply authentication to all routes
router.use(authenticate);

// Student buyer summary
router.get('/user/:userId', async (req, res) => {
    const requestedUserId = parseInt(req.params.userId);
    const authenticatedUserId = req.user.id;
    const isAdmin = req.user.userType === 'admin';

    // Security check
    if (!isAdmin && requestedUserId !== authenticatedUserId) {
        return res.status(403).json({ message: "Unauthorized access to other user's data" });
    }

    const userId = requestedUserId;
    const { month, year, type } = req.query;

    const filter = buildDateFilter(req.query, 'order_date'); // for orders table
    const itemFilter = buildDateFilter(req.query, 'o.order_date'); // for joined tables

    try {
        // Total spending
        const totalQuery = `SELECT IFNULL(SUM(total_amount),0) AS total_spending, COUNT(*) AS total_items FROM orders WHERE buyer_id = ? AND order_status = 'completed' ${filter.clause}`;
        const totalResult = await db.query(totalQuery, [userId, ...filter.params]);

        // Top categories
        const catQuery = `
            SELECT p.category, SUM(oi.product_price) AS totalSpent, COUNT(*) AS itemsBought
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.buyer_id = ? AND o.order_status = 'completed' ${itemFilter.clause}
            GROUP BY p.category
            ORDER BY totalSpent DESC
        `;
        const categoriesResult = await db.query(catQuery, [userId, ...itemFilter.params]);

        // Buying trend - Dynamic Aggregation
        let dateFormat = '%Y-%m-%d';

        if (type === 'thisMonth' || type === 'lastMonth' || (month && year)) {
            dateFormat = '%Y-%m-%d';
        } else {
            const rangeResult = await db.query(
                `SELECT DATEDIFF(MAX(order_date), MIN(order_date)) as diff_days 
                 FROM orders
                 WHERE buyer_id = ? AND order_status = 'completed'`,
                [userId]
            );
            const diffDays = rangeResult[0]?.diff_days || 0;
            if (diffDays > 365) dateFormat = '%Y';
            else if (diffDays > 180) dateFormat = '%Y-%m';
            else dateFormat = '%Y-%m-%d';
        }

        const trendQuery = `
            SELECT DATE_FORMAT(order_date, '${dateFormat}') AS date, SUM(total_amount) AS total
            FROM orders
            WHERE buyer_id = ? AND order_status = 'completed' ${filter.clause}
            GROUP BY date
            ORDER BY date
        `;
        const trendResult = await db.query(trendQuery, [userId, ...filter.params]);

        res.json({
            totalSpending: totalResult[0]?.total_spending || 0,
            totalItems: totalResult[0]?.total_items || 0,
            topCategories: categoriesResult,
            trend: trendResult
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin buyer summary (global)
router.get('/admin', requireAdmin, async (req, res) => {
    const { month, year, type } = req.query;
    console.log('Admin Buyer Query Params:', { month, year, type });

    const filter = buildDateFilter(req.query, 'order_date');
    const itemFilter = buildDateFilter(req.query, 'o.order_date');

    try {
        // Total spending
        const totalQuery = `SELECT IFNULL(SUM(total_amount),0) AS total_spending, COUNT(*) AS total_orders FROM orders WHERE order_status = 'completed' ${filter.clause}`;
        const totalResult = await db.query(totalQuery, filter.params);

        const itemsQuery = `
            SELECT COUNT(*) AS total_items 
            FROM order_items oi 
            JOIN orders o ON oi.order_id = o.order_id 
            WHERE o.order_status = 'completed' ${itemFilter.clause}
        `;
        const totalItemsResult = await db.query(itemsQuery, itemFilter.params);

        // Top categories
        const catQuery = `
            SELECT p.category, SUM(oi.product_price) AS totalSpent, COUNT(*) AS itemsBought
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.order_status = 'completed' ${itemFilter.clause}
            GROUP BY p.category
            ORDER BY totalSpent DESC
        `;
        const categoriesResult = await db.query(catQuery, itemFilter.params);

        // Buying trend - Dynamic Aggregation
        let dateFormat = '%Y-%m-%d';
        if (type === 'thisMonth' || type === 'lastMonth' || (month && year)) {
            dateFormat = '%Y-%m-%d';
        } else {
            const rangeResult = await db.query(
                `SELECT DATEDIFF(MAX(order_date), MIN(order_date)) as diff_days 
                 FROM orders
                 WHERE order_status = 'completed'`
            );
            const diffDays = rangeResult[0]?.diff_days || 0;
            if (diffDays > 365) dateFormat = '%Y';
            else if (diffDays > 180) dateFormat = '%Y-%m';
            else dateFormat = '%Y-%m-%d';
        }

        const trendQuery = `
            SELECT DATE_FORMAT(order_date, '${dateFormat}') AS date, SUM(total_amount) AS total
            FROM orders
            WHERE order_status = 'completed' ${filter.clause}
            GROUP BY date
            ORDER BY date
        `;
        const trendResult = await db.query(trendQuery, filter.params);

        // Top buyers
        const buyersQuery = `
            SELECT s.name, SUM(oi.product_price) AS totalSpent, COUNT(*) AS itemsBought
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN user u ON o.buyer_id = u.id
            LEFT JOIN students s ON u.id = s.user_id
            WHERE o.order_status = 'completed' ${itemFilter.clause}
            GROUP BY o.buyer_id
            ORDER BY totalSpent DESC
            LIMIT 5
        `;
        const topBuyersResult = await db.query(buyersQuery, itemFilter.params);

        res.json({
            totalSpending: totalResult[0]?.total_spending || 0,
            totalItems: totalItemsResult[0]?.total_items || 0,
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
    const requestedUserId = parseInt(req.params.userId);
    const authenticatedUserId = req.user.id;
    const isAdmin = req.user.userType === 'admin';

    // Security check
    if (!isAdmin && requestedUserId !== authenticatedUserId) {
        return res.status(403).json({ message: "Unauthorized access to other user's data" });
    }

    const { category } = req.params;
    const userId = requestedUserId;

    try {
        const results = await db.query(
            `SELECT o.order_id, p.name, oi.product_price AS amount, o.order_date AS sold_at
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.order_id
          JOIN products p ON oi.product_id = p.product_id
          WHERE o.buyer_id = ? AND p.category = ? AND o.order_status = 'completed'
          ORDER BY o.order_date DESC`,
            [userId, category]
        );
        console.log(`[BuyerRoutes] Category ${category} items for user ${userId}:`, results.length > 0 ? results[0] : 'No items');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
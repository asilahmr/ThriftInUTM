const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/authMiddleWare');

const DEBUG_LOG = process.env.NODE_ENV !== 'production';

// Helper to build date filter clause
const buildDateFilter = (req, dateColumn = 'order_date') => {
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

// Apply authentication to all routes
router.use(authenticate);

// User sales dashboard
// Secured: Uses req.user.id if not admin, or validates param
router.get('/user/:userId', async (req, res) => {
    const requestedUserId = parseInt(req.params.userId);
    const authenticatedUserId = req.user.id;
    const isAdmin = req.user.userType === 'admin';

    // Security check: Only allow users to view their own data, unless admin
    if (!isAdmin && requestedUserId !== authenticatedUserId) {
        return res.status(403).json({ message: "Unauthorized access to other user's data" });
    }

    const userId = requestedUserId;

    // Filter logic
    let revenueQuery = `
        SELECT SUM(oi.product_price) AS total_revenue, COUNT(*) AS total_items_sold
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.seller_id = ? AND o.order_status = 'completed'
    `;

    let categoriesQuery = `
        SELECT p.category, COUNT(oi.order_item_id) AS items_sold, SUM(oi.product_price) AS revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.seller_id = ? AND o.order_status = 'completed'
    `;

    const filter = buildDateFilter(req, 'o.order_date');

    revenueQuery += filter.clause;
    categoriesQuery += filter.clause + ` GROUP BY p.category ORDER BY items_sold DESC`;

    // Combine params
    const queryParams = [userId, ...filter.params];

    try {
        const revenueResult = await db.query(revenueQuery, queryParams);
        const categoriesResult = await db.query(categoriesQuery, queryParams);

        if (DEBUG_LOG) console.log(`Sales dashboard data fetched for user ${userId}`);

        res.json({
            total_revenue: revenueResult[0]?.total_revenue || 0,
            total_items_sold: revenueResult[0]?.total_items_sold || 0,
            top_categories: categoriesResult
        });
    } catch (err) {
        console.error("Sales dashboard error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Admin sales dashboard
router.get('/admin', requireAdmin, async (req, res) => {
    if (DEBUG_LOG) console.log('Admin Sales Dashboard requested', req.query);

    const filter = buildDateFilter(req, 'o.order_date'); // joined
    const singleTableFilter = buildDateFilter(req, 'order_date'); // direct

    // Admin sees total platform stats
    let totalRevenueQuery = `SELECT SUM(total_amount) AS total_revenue FROM orders WHERE order_status = 'completed' ${singleTableFilter.clause}`;

    let totalItemsQuery = `
        SELECT COUNT(*) AS total_items_sold 
        FROM order_items oi 
        JOIN orders o ON oi.order_id = o.order_id 
        WHERE o.order_status = 'completed' ${filter.clause}
    `;

    let topCategoriesQuery = `
      SELECT p.category, COUNT(oi.order_item_id) AS items_sold, SUM(oi.product_price) AS revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_status = 'completed' ${filter.clause}
      GROUP BY p.category
      ORDER BY items_sold DESC
    `;

    let topSellersQuery = `
      SELECT s.name, COUNT(oi.order_item_id) AS sold_count, SUM(oi.product_price) AS revenue
      FROM order_items oi
      JOIN user u ON oi.seller_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_status = 'completed' ${filter.clause}
      GROUP BY oi.seller_id
      ORDER BY revenue DESC
      LIMIT 5
    `;

    try {
        const revResult = await db.query(totalRevenueQuery, singleTableFilter.params);
        const itemsResult = await db.query(totalItemsQuery, filter.params);
        const catResult = await db.query(topCategoriesQuery, filter.params);
        const sellerResult = await db.query(topSellersQuery, filter.params);

        res.json({
            total_revenue: revResult[0]?.total_revenue || 0,
            total_items_sold: itemsResult[0]?.total_items_sold || 0,
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
    const requestedUserId = parseInt(req.params.userId);
    const authenticatedUserId = req.user.id;
    const isAdmin = req.user.userType === 'admin';

    if (!isAdmin && requestedUserId !== authenticatedUserId) {
        return res.status(403).json({ message: "Unauthorized access to other user's data" });
    }

    const userId = requestedUserId;
    const { month, year, type } = req.query;

    try {
        let whereClause = `WHERE oi.seller_id = ? AND o.order_status = 'completed'`;
        let params = [userId];

        // Append filter
        const filter = buildDateFilter(req, 'o.order_date');
        whereClause += filter.clause;
        params = [...params, ...filter.params];

        let dateFormat = '%Y-%m-%d';

        // Dynamic Aggregation Logic
        if (type === 'thisMonth' || type === 'lastMonth' || (month && year)) {
            dateFormat = '%Y-%m-%d';
        } else {
            // "All Time" - check data range
            const rangeResult = await db.query(
                `SELECT DATEDIFF(MAX(o.order_date), MIN(o.order_date)) as diff_days 
                 FROM order_items oi
                 JOIN orders o ON oi.order_id = o.order_id
                 WHERE oi.seller_id = ? AND o.order_status = 'completed'`,
                [userId]
            );
            const diffDays = rangeResult[0]?.diff_days || 0;

            if (diffDays > 365) dateFormat = '%Y';
            else if (diffDays > 180) dateFormat = '%Y-%m';
            else dateFormat = '%Y-%m-%d';
        }

        const query = `
            SELECT DATE_FORMAT(o.order_date, '${dateFormat}') AS date, SUM(oi.product_price) AS daily_revenue, COUNT(*) AS items_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            ${whereClause}
            GROUP BY date
            ORDER BY date;
        `;

        const results = await db.query(query, params);
        res.json(results);
    } catch (err) {
        console.error("Sales trends error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Global sales trends for admin
router.get('/trends', requireAdmin, async (req, res) => {
    const { month, year, type } = req.query; // extract for logic check

    try {
        let whereClause = `WHERE order_status = 'completed'`;
        const filter = buildDateFilter(req, 'order_date');
        whereClause += filter.clause;
        const params = [...filter.params];

        let dateFormat = '%Y-%m-%d';

        if (type === 'thisMonth' || type === 'lastMonth' || (month && year)) {
            dateFormat = '%Y-%m-%d';
        } else {
            const rangeResult = await db.query(
                `SELECT DATEDIFF(MAX(order_date), MIN(order_date)) as diff_days FROM orders WHERE order_status = 'completed'`
            );
            const diffDays = rangeResult[0]?.diff_days || 0;

            if (diffDays > 365) dateFormat = '%Y';
            else if (diffDays > 180) dateFormat = '%Y-%m';
            else dateFormat = '%Y-%m-%d';
        }

        const query = `
            SELECT DATE_FORMAT(order_date, '${dateFormat}') AS date, SUM(total_amount) AS daily_revenue, COUNT(*) AS items_sold
            FROM orders
            ${whereClause}
            GROUP BY date
            ORDER BY date;
        `;
        const results = await db.query(query, params);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User sales by category
router.get('/user/:userId/category/:category', async (req, res) => {
    const requestedUserId = parseInt(req.params.userId);
    const authenticatedUserId = req.user.id;
    const isAdmin = req.user.userType === 'admin';

    if (!isAdmin && requestedUserId !== authenticatedUserId) {
        return res.status(403).json({ message: "Unauthorized access to other user's data" });
    }

    const { category } = req.params;

    const query = `
        SELECT o.order_id, p.name, oi.product_price AS revenue, o.order_date as sold_at
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.seller_id = ? AND p.category = ?
        ORDER BY o.order_date DESC;
      `;

    try {
        const results = await db.query(query, [requestedUserId, category]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Global products by category for admin
router.get('/category/:category', requireAdmin, async (req, res) => {
    const { category } = req.params;
    const query = `
        SELECT o.order_id, p.name, oi.product_price AS revenue, o.order_date as sold_at
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE p.category = ?
        ORDER BY o.order_date DESC;
      `;

    try {
        const results = await db.query(query, [category]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get sold item details (with buyer info)
router.get('/sold/:orderId', async (req, res) => {
    const { orderId } = req.params;
    const authenticatedUserId = req.user.id;
    const isAdmin = req.user.userType === 'admin';

    try {
        const query = `
            SELECT 
                o.order_id, o.order_date, o.total_amount, o.payment_method,
                oi.product_name, oi.product_price, oi.product_category, oi.product_condition,
                oi.seller_id,
                s.name AS buyer_name, u.email AS buyer_email,
                s.matric AS buyer_matric
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN user u ON o.buyer_id = u.id
            LEFT JOIN students s ON u.id = s.user_id
            WHERE o.order_id = ?
        `;

        const rows = await db.query(query, [orderId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const sale = rows[0];

        // Security check: Ensure requester is the seller or admin
        if (!isAdmin && sale.seller_id !== authenticatedUserId) {
            return res.status(403).json({ message: "Unauthorized: You are not the seller of this item" });
        }

        // Get product image
        const [images] = await db.query(
            `SELECT image_url FROM product_images 
             WHERE product_id = (SELECT product_id FROM order_items WHERE order_id = ?) 
             ORDER BY is_primary DESC LIMIT 1`,
            [orderId]
        );

        sale.product_image = images.length > 0 ? images[0].image_url : null;

        // Calculate sales rank (how many items sold by this seller up to this date/order)
        const rankResult = await db.query(
            `SELECT COUNT(*) AS count
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.order_id
             WHERE oi.seller_id = ? 
             AND o.order_status = 'completed'
             AND (o.order_date < ? OR (o.order_date = ? AND o.order_id <= ?))`,
            [sale.seller_id, sale.order_date, sale.order_date, orderId]
        );

        sale.sales_rank = rankResult[0].count;

        res.json(sale);
    } catch (err) {
        console.error('Get sold item details error:', err);
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
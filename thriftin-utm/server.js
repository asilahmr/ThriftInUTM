const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const port = 3000;

// try
app.get('/ping', (req, res) => {
  console.log('Ping request received from', req.ip);
  res.json({ message: 'pong' });
});

app.use(cors());
app.use(express.json());

// Simple request logger to help debug network/timeouts
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - from ${req.ip}`);
  next();
});

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test'
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('Connected to MySQL database!');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});

// ----------------- ENDPOINTS ------------------

// User sales dashboard
app.get('/api/sales/user/:userId', async (req, res) => {
  const userId = req.params.userId;

  const revenueQuery = `
    SELECT SUM(amount) AS total_revenue, COUNT(*) AS total_items_sold
    FROM transactions
    WHERE seller_id = ?;
  `;

  const topCategoriesQuery = `
  SELECT p.category, COUNT(t.transaction_id) AS items_sold, SUM(t.amount) AS revenue
  FROM transactions t
  JOIN products p ON t.product_id = p.product_id
  WHERE t.seller_id = ?
  GROUP BY p.category
  ORDER BY items_sold DESC;
`;

  try {
    const [revenueResult] = await db.promise().query(revenueQuery, [userId]);
    const [categoriesResult] = await db.promise().query(topCategoriesQuery, [userId]);

    res.json({
      total_revenue: revenueResult[0].total_revenue || 0,
      total_items_sold: revenueResult[0].total_items_sold || 0,
      top_categories: categoriesResult
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Admin sales dashboard
app.get('/api/sales/admin', async (req, res) => {
  const totalRevenueQuery = `SELECT SUM(amount) AS total_revenue, COUNT(*) AS total_items_sold FROM transactions;`;

  const topCategoriesQuery = `
  SELECT p.category, COUNT(t.transaction_id) AS items_sold, SUM(t.amount) AS revenue
  FROM transactions t
  JOIN products p ON t.product_id = p.product_id
  GROUP BY p.category
  ORDER BY items_sold DESC;
`;

  const topSellersQuery = `
    SELECT u.name, COUNT(t.transaction_id) AS sold_count, SUM(t.amount) AS revenue
    FROM transactions t
    JOIN users u ON t.seller_id = u.user_id
    GROUP BY t.seller_id
    ORDER BY revenue DESC
    LIMIT 5;
  `;

  try {
    const [statsResult, categoriesResult, sellersResult] = await Promise.all([
      db.promise().query(totalRevenueQuery),
      db.promise().query(topCategoriesQuery),
      db.promise().query(topSellersQuery)
    ]);

    res.json({
      total_revenue: statsResult[0][0].total_revenue || 0,
      total_items_sold: statsResult[0][0].total_items_sold || 0,
      top_categories: categoriesResult[0],
      top_sellers: sellersResult[0]
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Sales trends for a user
app.get('/api/sales/trends/:userId', (req, res) => {
  const userId = req.params.userId;

  const trendsQuery = `
    SELECT DATE_FORMAT(sold_at, '%Y-%m-%d') AS date, SUM(amount) AS daily_revenue, COUNT(*) AS items_sold
    FROM transactions
    WHERE seller_id = ?
    GROUP BY date
    ORDER BY date;
  `;

  db.query(trendsQuery, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});
// Global sales trends for admin
app.get('/api/sales/trends', async (req, res) => {
  const query = `
        SELECT DATE_FORMAT(sold_at, '%Y-%m-%d') AS date, SUM(amount) AS daily_revenue, COUNT(*) AS items_sold
        FROM transactions
        GROUP BY date
        ORDER BY date;
      `;
  try {
    const [results] = await db.promise().query(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Fetch students information
app.get('/api/users/students', (req, res) => {
  const query = "SELECT user_id, name FROM users WHERE role = 'student'";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// User sales by category
app.get('/api/sales/user/:userId/category/:category', async (req, res) => {
  const { userId, category } = req.params;

  const query = `
        SELECT p.name, t.amount AS revenue, t.sold_at
        FROM transactions t
        JOIN products p ON t.product_id = p.product_id
        WHERE t.seller_id = ? AND p.category = ?
        ORDER BY t.sold_at DESC;
      `;

  try {
    const [results] = await db.promise().query(query, [userId, category]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Global products by category for admin
app.get('/api/sales/category/:category', async (req, res) => {
  const { category } = req.params;
  const query = `
        SELECT p.name, t.amount AS revenue, t.sold_at
        FROM transactions t
        JOIN products p ON t.product_id = p.product_id
        WHERE p.category = ?
        ORDER BY t.sold_at DESC;
      `;

  try {
    const [results] = await db.promise().query(query, [category]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// ----------------- Buyer Spending Summary ------------------

// Student buyer summary
app.get('/api/buying/user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Total spending
    const [totalResult] = await db.promise().query(
      'SELECT IFNULL(SUM(amount),0) AS total_spending, COUNT(*) AS total_items FROM transactions WHERE buyer_id = ?',
      [userId]
    );

    // Top categories
    const [categoriesResult] = await db.promise().query(
      `SELECT p.category, SUM(t.amount) AS totalSpent, COUNT(*) AS itemsBought
          FROM transactions t
          JOIN products p ON t.product_id = p.product_id
          WHERE t.buyer_id = ?
          GROUP BY p.category
          ORDER BY totalSpent DESC`,
      [userId]
    );

    // Buying trend (monthly)
    const [trendResult] = await db.promise().query(
      `SELECT DATE_FORMAT(sold_at, '%Y-%m-%d') AS date, SUM(amount) AS total
          FROM transactions
          WHERE buyer_id = ?
          GROUP BY date
          ORDER BY date`,
      [userId]
    );

    res.json({
      totalSpending: totalResult[0].total_spending,
      totalItems: totalResult[0].total_items,
      topCategories: categoriesResult,
      trend: trendResult
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Admin buyer summary (global)
app.get('/api/buying/admin', async (req, res) => {
  try {
    // Total spending
    const [totalResult] = await db.promise().query(
      'SELECT IFNULL(SUM(amount),0) AS total_spending, COUNT(*) AS total_items FROM transactions'
    );

    // Top categories
    const [categoriesResult] = await db.promise().query(
      `SELECT p.category, SUM(t.amount) AS totalSpent, COUNT(*) AS itemsBought
          FROM transactions t
          JOIN products p ON t.product_id = p.product_id
          GROUP BY p.category
          ORDER BY totalSpent DESC`
    );

    // Buying trend (monthly)
    const [trendResult] = await db.promise().query(
      `SELECT DATE_FORMAT(sold_at,'%Y-%m') AS month, SUM(amount) AS total
          FROM transactions
          GROUP BY month
          ORDER BY month`
    );

    // Top buyers
    const [topBuyersResult] = await db.promise().query(
      `SELECT u.name, SUM(t.amount) AS totalSpent, COUNT(*) AS itemsBought
          FROM transactions t
          JOIN users u ON t.buyer_id = u.user_id
          GROUP BY t.buyer_id
          ORDER BY totalSpent DESC
          LIMIT 5`
    );

    res.json({
      totalSpending: totalResult[0].total_spending,
      totalItems: totalResult[0].total_items,
      topCategories: categoriesResult,
      trend: trendResult,
      topBuyers: topBuyersResult
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Buyer trend - THIS MONTH (daily)
app.get('/api/buying/user/:userId/trend/this-month', async (req, res) => {
  const { userId } = req.params;

  try {
    const [results] = await db.promise().query(
      `
          SELECT DATE_FORMAT(sold_at, '%Y-%m-%d') AS date, SUM(amount) AS total
          FROM transactions
          WHERE buyer_id = ?
            AND MONTH(sold_at) = MONTH(CURRENT_DATE())
            AND YEAR(sold_at) = YEAR(CURRENT_DATE())
          GROUP BY date
          ORDER BY date`,
      [userId]
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Buyer trend - LAST 6 MONTHS (monthly)
app.get('/api/buying/user/:userId/trend/last-6-months', async (req, res) => {
  const { userId } = req.params;

  try {
    const [results] = await db.promise().query(
      `
          SELECT DATE_FORMAT(sold_at, '%Y-%m') AS month, SUM(amount) AS total
          FROM transactions
          WHERE buyer_id = ?
            AND sold_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
          GROUP BY month
          ORDER BY month`,
      [userId]
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Buyer trend - OVERALL (adaptive)
app.get('/api/buying/user/:userId/trend/overall', async (req, res) => {
  const { userId } = req.params;

  try {
    // Check date span
    const [[range]] = await db.promise().query(
      `
          SELECT 
            MIN(sold_at) AS first_date,
            MAX(sold_at) AS last_date
          FROM transactions
          WHERE buyer_id = ?`,
      [userId]
    );

    if (!range.first_date) {
      return res.json({ type: 'monthly', data: [] });
    }

    const monthsDiff =
      (new Date(range.last_date).getFullYear() - new Date(range.first_date).getFullYear()) * 12 +
      (new Date(range.last_date).getMonth() - new Date(range.first_date).getMonth());

    // If more than 18 months → yearly
    if (monthsDiff > 18) {
      const [yearly] = await db.promise().query(
        `
            SELECT YEAR(sold_at) AS label, SUM(amount) AS total
            FROM transactions
            WHERE buyer_id = ?
            GROUP BY YEAR(sold_at)
            ORDER BY label`,
        [userId]
      );

      return res.json({ type: 'yearly', data: yearly });
    }

    // Else → monthly
    const [monthly] = await db.promise().query(
      `
          SELECT DATE_FORMAT(sold_at, '%Y-%m') AS label, SUM(amount) AS total
          FROM transactions
          WHERE buyer_id = ?
          GROUP BY label
          ORDER BY label`,
      [userId]
    );

    res.json({ type: 'monthly', data: monthly });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Buyer trend - MONTH DETAIL (daily)
app.get('/api/buying/user/:userId/trend/month-detail', async (req, res) => {
  const { userId } = req.params;
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'month and year are required' });
  }

  try {
    const [results] = await db.promise().query(
      `
          SELECT DATE_FORMAT(sold_at, '%Y-%m-%d') AS date, SUM(amount) AS total
          FROM transactions
          WHERE buyer_id = ?
            AND MONTH(sold_at) = ?
            AND YEAR(sold_at) = ?
          GROUP BY date
          ORDER BY date`,
      [userId, month, year]
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Buyer items by category (student)
app.get('/api/buying/user/:userId/category/:category', async (req, res) => {
  const { userId, category } = req.params;

  try {
    const [results] = await db.promise().query(
      `SELECT p.name, t.amount, t.sold_at
          FROM transactions t
          JOIN products p ON t.product_id = p.product_id
          WHERE t.buyer_id = ? AND p.category = ?
          ORDER BY t.sold_at DESC`,
      [userId, category]
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// ----------------- Analytics (User Activity) ------------------
app.get('/api/analytics/activity', async (req, res) => {
  try {
    // 1. Total Registered Users (Students only)
    const [usersCountResult] = await db.promise().query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const totalUsers = usersCountResult[0].count;

    // 2. Activities (Transactions as proxy)
    // We map each transaction to an "activity session"
    const [activitiesResult] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(sold_at, '%Y-%m-%d') as date,
        buyer_id as userId,
        1 as sessions,
        5 as duration -- hardcoded avg duration
      FROM transactions
      ORDER BY sold_at DESC
    `);

    res.json({
      totalUsers,
      activities: activitiesResult
    });
  } catch (err) {
    console.error('Analytics Fetch Error:', err);
    res.status(500).json({ error: err.message });
  }
});
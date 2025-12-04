const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'product_listing',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function mapRowToProduct(row) {
  return {
    id: row.product_id,
    name: row.product_name,
    category: row.category,
    description: row.description,
    price: parseFloat(row.price),
    condition: row.condition,
    images: (() => {
      try {
        return row.images ? JSON.parse(row.images) : [];
      } catch (e) {
        return [];
      }
    })(),
    sellerId: row.seller_id,
    sellerName: row.sellerName || null,
    createdAt: row.createdAt,
  };
}

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.product_id, p.seller_id, p.name AS product_name, p.category, p.description, p.price, p.condition, p.images, p.createdAt, u.name AS sellerName
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       ORDER BY p.createdAt DESC`
    );
    const products = rows.map(mapRowToProduct);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get products by seller
app.get('/api/products/seller/:sellerId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.product_id, p.seller_id, p.name AS product_name, p.category, p.description, p.price, p.condition, p.images, p.createdAt, u.name AS sellerName
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.seller_id = ?
       ORDER BY p.createdAt DESC`,
      [req.params.sellerId]
    );
    res.json(rows.map(mapRowToProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch seller products' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.product_id, p.seller_id, p.name AS product_name, p.category, p.description, p.price, p.condition, p.images, p.createdAt, u.name AS sellerName
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.product_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(mapRowToProduct(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  const { name, category, description, price, condition, sellerId, images } = req.body;
  try {
    const conn = await pool.getConnection();
    const [result] = await conn.query(
      `INSERT INTO products (seller_id, name, category, description, price, condition, images) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sellerId, name, category, description, price, condition, JSON.stringify(images || [])]
    );
    const insertId = result.insertId;
    const [rows] = await conn.query(
      `SELECT p.product_id, p.seller_id, p.name AS product_name, p.category, p.description, p.price, p.condition, p.images, p.createdAt, u.name AS sellerName
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.product_id = ?`,
      [insertId]
    );
    conn.release();
    res.json(mapRowToProduct(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  const { name, category, description, price, condition, images } = req.body;
  try {
    const conn = await pool.getConnection();
    await conn.query(
      `UPDATE products SET name = ?, category = ?, description = ?, price = ?, condition = ?, images = ? WHERE product_id = ?`,
      [name, category, description, price, condition, JSON.stringify(images || []), req.params.id]
    );
    const [rows] = await conn.query(
      `SELECT p.product_id, p.seller_id, p.name AS product_name, p.category, p.description, p.price, p.condition, p.images, p.createdAt, u.name AS sellerName
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.product_id = ?`,
      [req.params.id]
    );
    conn.release();
    if (!rows.length) return res.status(404).json({ error: 'Product not found after update' });
    res.json(mapRowToProduct(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.query(`DELETE FROM products WHERE product_id = ?`, [req.params.id]);
    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
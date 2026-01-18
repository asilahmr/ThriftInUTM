// models/orderModel.js - UPDATED WITH WALLET INTEGRATION
const db = require('../config/db').pool;
const WalletModel = require('./walletModel'); // NEW: Import WalletModel

class OrderModel {

  // Check if product is still available for purchase
  static async checkProductAvailability(productId, buyerId) {
    const query = `
      SELECT product_id, seller_id, name, price, category, \`condition\`, description, status
      FROM products
      WHERE product_id = ? AND status = 'active' AND seller_id != ?
    `;

    const [rows] = await db.execute(query, [productId, buyerId]);
    return rows.length > 0 ? rows[0] : null;
  }

  // Get seller information for a product
  static async getSellerInfo(sellerId) {
    const query = `
      SELECT user_id, name, email
      FROM user
      WHERE id = ?
    `;

    const [rows] = await db.execute(query, [sellerId]);
    return rows.length > 0 ? rows[0] : null;
  }

  // Create order with wallet payment (atomic transaction)
  static async createOrder(buyerId, productId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Check product is still available (with row lock)
      const [productRows] = await connection.execute(
        `SELECT p.*, u.name as seller_name, u.email as seller_email 
         FROM products p
         JOIN user u ON p.seller_id = u.id
         WHERE p.product_id = ? AND p.status = 'active' AND p.seller_id != ?
         FOR UPDATE`,
        [productId, buyerId]
      );

      if (productRows.length === 0) {
        throw new Error('Product is no longer available');
      }

      const product = productRows[0];
      const orderAmount = parseFloat(product.price);

      // 2. Check wallet balance and deduct
      const hasSufficient = await WalletModel.hasSufficientBalance(buyerId, orderAmount);

      if (!hasSufficient) {
        const wallet = await WalletModel.getWalletBalance(buyerId);
        const shortage = orderAmount - parseFloat(wallet.balance);
        throw new Error(`Insufficient wallet balance. You need RM ${shortage.toFixed(2)} more.`);
      }

      // 3. Create order record (payment_method is now 'wallet')
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (buyer_id, total_amount, payment_method, order_status)
         VALUES (?, ?, 'wallet', 'completed')`,
        [buyerId, orderAmount]
      );

      const orderId = orderResult.insertId;

      // 4. Create order item (snapshot of product)
      await connection.execute(
        `INSERT INTO order_items 
         (order_id, product_id, product_name, product_price, product_category, 
          product_condition, product_description, seller_id, seller_name, seller_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          product.product_id,
          product.name,
          product.price,
          product.category,
          product.condition,
          product.description,
          product.seller_id,
          product.seller_name,
          product.seller_email
        ]
      );

      // 5. Update product status to 'sold'
      await connection.execute(
        `UPDATE products SET status = 'sold', updated_at = NOW() WHERE product_id = ?`,
        [productId]
      );

      // 6. Deduct from wallet (pass the existing connection to avoid deadlock)
      const walletResult = await WalletModel.deductFromWallet(
        buyerId,
        orderAmount,
        orderId,
        product.name,
        connection  // IMPORTANT: Pass the existing connection
      );

      // Commit transaction
      await connection.commit();

      return {
        orderId,
        walletTransaction: walletResult
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get buyer's order history
  static async getBuyerOrders(buyerId) {
    const query = `
      SELECT 
        o.order_id,
        o.total_amount,
        o.payment_method,
        o.order_status,
        o.order_date,
        o.cancelled_at,
        oi.product_name,
        oi.product_price,
        oi.product_category,
        oi.product_condition,
        oi.seller_name,
        oi.seller_email,
        oi.product_id
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.buyer_id = ?
      ORDER BY o.order_date DESC
    `;

    const [rows] = await db.execute(query, [buyerId]);

    // Get first product image for each order
    const ordersWithImages = await Promise.all(rows.map(async (order) => {
      if (order.product_id) {
        const [images] = await db.execute(
          `SELECT image_url FROM product_images 
           WHERE product_id = ? AND is_primary = TRUE LIMIT 1`,
          [order.product_id]
        );
        order.product_image = images.length > 0 ? images[0].image_url : null;
      } else {
        order.product_image = null;
      }
      return order;
    }));

    return ordersWithImages;
  }

  // Get order details with receipt
  static async getOrderById(orderId, buyerId) {
    const query = `
      SELECT 
        o.order_id,
        o.buyer_id,
        o.total_amount,
        o.payment_method,
        o.order_status,
        o.order_date,
        o.cancelled_at,
        oi.order_item_id,
        oi.product_id,
        oi.product_name,
        oi.product_price,
        oi.product_category,
        oi.product_condition,
        oi.product_description,
        oi.seller_id,
        oi.seller_name,
        oi.seller_email
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = ? AND o.buyer_id = ?
    `;

    const [rows] = await db.execute(query, [orderId, buyerId]);

    if (rows.length === 0) {
      return null;
    }

    const order = rows[0];

    // Get product images
    if (order.product_id) {
      const [images] = await db.execute(
        `SELECT image_url, is_primary FROM product_images 
         WHERE product_id = ? ORDER BY is_primary DESC`,
        [order.product_id]
      );
      order.product_images = images;
    } else {
      order.product_images = [];
    }

    return order;
  }

  // Cancel order with wallet refund (within 24 hours)
  static async cancelOrder(orderId, buyerId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Get order details and check eligibility
      const [orderRows] = await connection.execute(
        `SELECT o.order_id, o.order_date, o.order_status, o.total_amount, oi.product_id, oi.product_name
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         WHERE o.order_id = ? AND o.buyer_id = ?
         FOR UPDATE`,
        [orderId, buyerId]
      );

      if (orderRows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderRows[0];

      // Check if already cancelled
      if (order.order_status === 'cancelled') {
        throw new Error('Order is already cancelled');
      }

      // Check if within 24 hours
      const orderDate = new Date(order.order_date);
      const now = new Date();
      const hoursSinceOrder = (now - orderDate) / (1000 * 60 * 60);

      if (hoursSinceOrder > 24) {
        throw new Error('Cancellation period has expired (24 hours)');
      }

      // 2. Update order status to cancelled
      await connection.execute(
        `UPDATE orders 
         SET order_status = 'cancelled', cancelled_at = NOW()
         WHERE order_id = ?`,
        [orderId]
      );

      // 3. Return product to 'active' status
      await connection.execute(
        `UPDATE products 
         SET status = 'active', updated_at = NOW()
         WHERE product_id = ? AND status = 'sold'`,
        [order.product_id]
      );

      // 4. Refund to wallet (pass existing connection)
      const refundAmount = parseFloat(order.total_amount);
      await WalletModel.refundToWallet(
        buyerId,
        refundAmount,
        orderId,
        order.product_name,
        connection  // IMPORTANT: Pass the existing connection
      );

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Check if order can be cancelled (within 24 hours)
  static async canCancelOrder(orderId, buyerId) {
    const query = `
      SELECT order_date, order_status
      FROM orders
      WHERE order_id = ? AND buyer_id = ?
    `;

    const [rows] = await db.execute(query, [orderId, buyerId]);

    if (rows.length === 0) {
      return false;
    }

    const order = rows[0];

    if (order.order_status === 'cancelled') {
      return false;
    }

    const orderDate = new Date(order.order_date);
    const now = new Date();
    const hoursSinceOrder = (now - orderDate) / (1000 * 60 * 60);

    return hoursSinceOrder <= 24;
  }
}

module.exports = OrderModel;
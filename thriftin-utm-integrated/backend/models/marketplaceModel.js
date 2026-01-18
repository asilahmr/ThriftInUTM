const db = require('../config/db').pool;

class MarketplaceModel {

  // Get all products for marketplace (exclude own products)
  static async getAllProducts(userId, limit = 50, offset = 0) {
    const query = `
      SELECT 
        p.product_id,
        p.name,
        p.category,
        p.description,
        p.price,
        p.condition,
        p.view_count,
        p.created_at,
        p.updated_at,
        s.name as seller_name,
        u.email as seller_email,
        GROUP_CONCAT(
          CONCAT(pi.image_id, ':', pi.image_url, ':', pi.is_primary)
          ORDER BY pi.is_primary DESC
          SEPARATOR '|'
        ) as images
      FROM products p
      JOIN user u ON p.seller_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      WHERE p.status = 'active' AND p.seller_id != ?
      GROUP BY p.product_id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.execute(query, [userId, limit, offset]);

    return rows.map(product => ({
      ...product,
      images: product.images
        ? product.images.split('|').map(img => {
          const [id, url, isPrimary] = img.split(':');
          return { image_id: id, image_url: url, is_primary: isPrimary === '1' };
        })
        : []
    }));
  }

  // Search products by keyword
  static async searchProducts(userId, searchQuery, limit = 50) {
    const searchTerm = `%${searchQuery}%`;

    const query = `
      SELECT 
        p.product_id,
        p.name,
        p.category,
        p.description,
        p.price,
        p.condition,
        p.view_count,
        p.created_at,
        s.name as seller_name,
        u.email as seller_email,
        GROUP_CONCAT(
          CONCAT(pi.image_id, ':', pi.image_url, ':', pi.is_primary)
          ORDER BY pi.is_primary DESC
          SEPARATOR '|'
        ) as images
      FROM products p
      JOIN user u ON p.seller_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      WHERE p.status = 'active' 
        AND p.seller_id != ?
        AND (p.name LIKE ? OR p.description LIKE ?)
      GROUP BY p.product_id
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

    const [rows] = await db.execute(query, [userId, searchTerm, searchTerm, limit]);

    return rows.map(product => ({
      ...product,
      images: product.images
        ? product.images.split('|').map(img => {
          const [id, url, isPrimary] = img.split(':');
          return { image_id: id, image_url: url, is_primary: isPrimary === '1' };
        })
        : []
    }));
  }

  //Filter products by category
  static async getProductsByCategory(userId, category, limit = 50) {
    const query = `
      SELECT 
        p.product_id,
        p.name,
        p.category,
        p.description,
        p.price,
        p.condition,
        p.view_count,
        p.created_at,
        s.name as seller_name,
        u.email as seller_email,
        GROUP_CONCAT(
          CONCAT(pi.image_id, ':', pi.image_url, ':', pi.is_primary)
          ORDER BY pi.is_primary DESC
          SEPARATOR '|'
        ) as images
      FROM products p
      JOIN user u ON p.seller_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      WHERE p.status = 'active' 
        AND p.seller_id != ?
        AND p.category = ?
      GROUP BY p.product_id
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

    const [rows] = await db.execute(query, [userId, category, limit]);

    return rows.map(product => ({
      ...product,
      images: product.images
        ? product.images.split('|').map(img => {
          const [id, url, isPrimary] = img.split(':');
          return { image_id: id, image_url: url, is_primary: isPrimary === '1' };
        })
        : []
    }));
  }

  // Get product details (including seller info)
  static async getProductDetails(productId) {
    const query = `
      SELECT 
        p.*,
        u.id as seller_id,
        COALESCE(s.name, u.email, 'User') as seller_name,
        u.email as seller_email
      FROM products p
      JOIN user u ON p.seller_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      WHERE p.product_id = ? AND p.status = 'active'
    `;

    const [rows] = await db.execute(query, [productId]);

    if (rows.length === 0) return null;

    // Get images
    const [images] = await db.execute(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC',
      [productId]
    );

    return {
      ...rows[0],
      images,
      seller: {
        user_id: rows[0].seller_id,
        name: rows[0].seller_name,
        email: rows[0].seller_email
      }
    };
  }

  // Increment view count when product is viewed
  static async incrementViewCount(productId) {
    await db.execute(
      'UPDATE products SET view_count = view_count + 1 WHERE product_id = ?',
      [productId]
    );
  }

  // Track user interaction (for AI recommendations)
  static async trackInteraction(userId, productId, interactionType) {
    await db.execute(
      'INSERT INTO user_interactions (user_id, product_id, interaction_type) VALUES (?, ?, ?)',
      [userId, productId, interactionType]
    );
  }

  // Save search query (for AI recommendations)
  static async saveSearchQuery(userId, searchQuery, resultsCount) {
    await db.execute(
      'INSERT INTO search_history (user_id, search_query, results_count) VALUES (?, ?, ?)',
      [userId, searchQuery, resultsCount]
    );
  }

  // Get AI recommendations (simple version)
  static async getRecommendations(userId, limit = 10) {
    try {
      console.log(`Getting recommendations for user ${userId}`);

      // Try to get personalized recommendations
      const [rows] = await db.execute(`
      SELECT 
        p.product_id,
        p.name,
        p.category,
        p.price,
        p.condition,
        p.view_count,
        s.name as seller_name,
        GROUP_CONCAT(
          CONCAT(pi.image_id, ':', pi.image_url, ':', pi.is_primary)
          ORDER BY pi.is_primary DESC SEPARATOR '|'
        ) as images
      FROM products p
      JOIN user u ON p.seller_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      WHERE p.status = 'active' AND p.seller_id != ?
      GROUP BY p.product_id
      ORDER BY p.view_count DESC, p.created_at DESC
      LIMIT ?
    `, [userId, limit]);

      return rows.map(product => ({
        ...product,
        images: product.images
          ? product.images.split('|').map(img => {
            const [id, url, isPrimary] = img.split(':');
            return { image_id: id, image_url: url, is_primary: isPrimary === '1' };
          })
          : []
      }));

    } catch (error) {
      console.error('Recommendation error:', error);
      return []; // Always return empty array, never throw
    }
  }

  // Get popular products (fallback for recommendations)
  static async getPopularProducts(userId, limit = 10) {
    const query = `
      SELECT 
        p.product_id,
        p.name,
        p.category,
        p.description,
        p.price,
        p.condition,
        p.view_count,
        p.created_at,
        s.name as seller_name,
        GROUP_CONCAT(
          CONCAT(pi.image_id, ':', pi.image_url, ':', pi.is_primary)
          ORDER BY pi.is_primary DESC
          SEPARATOR '|'
        ) as images
      FROM products p
      JOIN user u ON p.seller_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      WHERE p.status = 'active' AND p.seller_id != ?
      GROUP BY p.product_id
      ORDER BY p.view_count DESC, p.created_at DESC
      LIMIT ?
    `;

    const [rows] = await db.execute(query, [userId, limit]);

    return rows.map(product => ({
      ...product,
      images: product.images
        ? product.images.split('|').map(img => {
          const [id, url, isPrimary] = img.split(':');
          return { image_id: id, image_url: url, is_primary: isPrimary === '1' };
        })
        : []
    }));
  }

  // Get category statistics
  static async getCategoryStats(userId) {
    const query = `
      SELECT 
        category,
        COUNT(*) as count
      FROM products
      WHERE status = 'active' AND seller_id != ?
      GROUP BY category
      ORDER BY count DESC
    `;

    const [rows] = await db.execute(query, [userId]);
    return rows;
  }
}

module.exports = MarketplaceModel;
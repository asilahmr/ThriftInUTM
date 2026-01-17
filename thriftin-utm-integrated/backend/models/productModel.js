// models/productModel.js
const db = require('../config/db');

class ProductModel {

  // Add New Product
  static async createProduct(productData) {
    const { seller_id, name, category, description, price, condition } = productData;

    const query = `
      INSERT INTO products (seller_id, name, category, description, price, \`condition\`)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      seller_id, name, category, description, price, condition
    ]);

    return result.insertId;
  }

  // Add product images
  static async addProductImages(productId, imageUrls) {
    if (!imageUrls || imageUrls.length === 0) return;

    const values = imageUrls.map((url, index) => [
      productId,
      url,
      index === 0 // First image is primary
    ]);

    const query = `
      INSERT INTO product_images (product_id, image_url, is_primary)
      VALUES ?
    `;

    await db.query(query, [values]);
  }

  // View Own Product Listing
  static async getProductsBySeller(sellerId) {
    const query = `
      SELECT 
        p.product_id,
        p.name,
        p.category,
        p.description,
        p.price,
        p.condition,
        p.status,
        p.created_at,
        p.updated_at,
        GROUP_CONCAT(
          CONCAT(pi.image_id, ':', pi.image_url, ':', pi.is_primary)
          ORDER BY pi.is_primary DESC
          SEPARATOR '|'
        ) as images
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      WHERE p.seller_id = ? AND p.status = 'active'
      GROUP BY p.product_id
      ORDER BY p.created_at DESC
    `;

    const [rows] = await db.execute(query, [sellerId]);

    // Parse images into array
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

  // Get single product by ID
  static async getProductById(productId, sellerId = null) {
    let query = `
      SELECT 
        p.*,
        u.name as seller_name,
        u.email as seller_email
      FROM products p
      JOIN user u ON p.seller_id = u.id
      WHERE p.product_id = ? AND p.status = 'active'
    `;

    const params = [productId];

    if (sellerId) {
      query += ' AND p.seller_id = ?';
      params.push(sellerId);
    }

    const [rows] = await db.execute(query, params);

    if (rows.length === 0) return null;

    // Get images
    const [images] = await db.execute(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC',
      [productId]
    );

    return { ...rows[0], images };
  }

  // Edit Product Details
  static async updateProduct(productId, sellerId, updateData) {
    const { name, category, description, price, condition } = updateData;

    const query = `
      UPDATE products 
      SET name = ?, category = ?, description = ?, price = ?, \`condition\` = ?
      WHERE product_id = ? AND seller_id = ?
    `;

    const [result] = await db.execute(query, [
      name, category, description, price, condition, productId, sellerId
    ]);

    return result.affectedRows > 0;
  }

  // Update product images (delete old, add new)
  static async updateProductImages(productId, newImageUrls) {
    // Delete existing images
    await db.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);

    // Add new images
    if (newImageUrls && newImageUrls.length > 0) {
      await this.addProductImages(productId, newImageUrls);
    }
  }

  // Delete Product
  static async deleteProduct(productId, sellerId = null) {
    let query = 'UPDATE products SET status = ? WHERE product_id = ?';
    const params = ['deleted', productId];

    if (sellerId) {
      query += ' AND seller_id = ?';
      params.push(sellerId);
    }

    const [result] = await db.execute(query, params);
    return result.affectedRows > 0;
  }

  // Hard delete (for admin or cleanup)
  static async permanentDeleteProduct(productId) {
    const [result] = await db.execute(
      'DELETE FROM products WHERE product_id = ?',
      [productId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = ProductModel;
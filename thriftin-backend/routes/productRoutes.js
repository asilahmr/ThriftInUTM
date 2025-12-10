// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { authenticateToken, requireVerified, requireAdmin } = require('../middleware/auth');
const { uploadProductImages, handleUploadError } = require('../middleware/upload');

// All routes require authentication
router.use(authenticateToken);
router.use(requireVerified);

/**
 * @route   POST /api/products
 * @desc    Add new product (UC004)
 * @access  Private (Verified students only)
 */
router.post(
  '/',
  uploadProductImages,
  handleUploadError,
  ProductController.addProduct
);

/**
 * @route   GET /api/products/my-products
 * @desc    Get all products by logged-in seller (UC005)
 * @access  Private
 */
router.get('/my-products', ProductController.getMyProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product details
 * @access  Private
 */
router.get('/:id', ProductController.getProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product details (UC006)
 * @access  Private (Product owner only)
 */
router.put(
  '/:id',
  uploadProductImages,
  handleUploadError,
  ProductController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (UC007)
 * @access  Private (Product owner only)
 */
router.delete('/:id', ProductController.deleteProduct);

/**
 * @route   DELETE /api/products/admin/:id
 * @desc    Admin delete product for moderation
 * @access  Admin only
 */
router.delete('/admin/:id', requireAdmin, ProductController.adminDeleteProduct);

module.exports = router;
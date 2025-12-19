// routes/marketplaceRoutes.js
const express = require('express');
const router = express.Router();
const MarketplaceController = require('../controllers/marketplaceController');
const { authenticateToken, requireVerified } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);
router.use(requireVerified);

/**
 * @route   GET /api/marketplace
 * @desc    Get all products for marketplace (UC008)
 * @access  Private
 * @query   limit, offset (pagination)
 */
router.get('/', MarketplaceController.getAllProducts);

/**
 * @route   GET /api/marketplace/search
 * @desc    Search products (UC009)
 * @access  Private
 * @query   q (search query)
 */
router.get('/search', MarketplaceController.searchProducts);

/**
 * @route   GET /api/marketplace/category/:category
 * @desc    Filter products by category (UC010)
 * @access  Private
 * @params  category (Books, Electronics, Fashion, Furniture, Others)
 */
router.get('/category/:category', MarketplaceController.getProductsByCategory);

/**
 * @route   GET /api/marketplace/product/:id
 * @desc    Get product details (UC011)
 * @access  Private
 * @params  id (product_id)
 */
router.get('/product/:id', MarketplaceController.getProductDetails);

/**
 * @route   GET /api/marketplace/recommendations
 * @desc    Get AI product recommendations (UC012)
 * @access  Private
 * @query   limit (default: 10)
 */
router.get('/recommendations', MarketplaceController.getRecommendations);

/**
 * @route   GET /api/marketplace/stats/categories
 * @desc    Get category statistics
 * @access  Private
 */
router.get('/stats/categories', MarketplaceController.getCategoryStats);

module.exports = router;
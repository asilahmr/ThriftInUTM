// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticateToken, requireVerified } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);
router.use(requireVerified);

/**
 * @route   GET /api/orders/checkout/:productId
 * @desc    Prepare checkout - validate product availability (UC013)
 * @access  Private
 */
router.get('/checkout/:productId', OrderController.prepareCheckout);

/**
 * @route   POST /api/orders/purchase
 * @desc    Process payment and create order (UC014)
 * @access  Private
 * @body    { productId, paymentMethod }
 */
router.post('/purchase', OrderController.processPayment);

/**
 * @route   GET /api/orders/history
 * @desc    Get buyer's order history (UC015)
 * @access  Private
 */
router.get('/history', OrderController.getOrderHistory);

/**
 * @route   GET /api/orders/receipt/:orderId
 * @desc    Get order receipt details (UC016)
 * @access  Private
 */
router.get('/receipt/:orderId', OrderController.getOrderReceipt);

/**
 * @route   PUT /api/orders/cancel/:orderId
 * @desc    Cancel order within 24 hours (UC017)
 * @access  Private
 */
router.put('/cancel/:orderId', OrderController.cancelOrder);

module.exports = router;
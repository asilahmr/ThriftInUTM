// routes/walletRoutes.js
const express = require('express');
const router = express.Router();
const WalletController = require('../controllers/walletController');
const { authenticate, requireVerified } = require('../middleware/authMiddleWare.js');

// All routes require authentication
router.use(authenticate);
router.use(requireVerified);

/**
 * @route   GET /api/wallet/balance
 * @desc    Get wallet balance
 * @access  Private
 */
router.get('/balance', WalletController.getWalletBalance);

/**
 * @route   GET /api/wallet/summary
 * @desc    Get wallet summary (balance + statistics)
 * @access  Private
 */
router.get('/summary', WalletController.getWalletSummary);

/**
 * @route   POST /api/wallet/topup
 * @desc    Top up wallet
 * @access  Private
 * @body    { amount: number, topUpMethod: 'credit_card'|'e_wallet'|'online_banking' }
 */
router.post('/topup', WalletController.topUpWallet);

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get transaction history
 * @access  Private
 * @query   limit, offset (optional)
 */
router.get('/transactions', WalletController.getTransactionHistory);

/**
 * @route   GET /api/wallet/check-balance
 * @desc    Check if user has sufficient balance
 * @access  Private
 * @query   amount (required)
 */
router.get('/check-balance', WalletController.checkSufficientBalance);

/**
 * @route   GET /api/wallet/stats
 * @desc    Get transaction statistics
 * @access  Private
 */
router.get('/stats', WalletController.getTransactionStats);

module.exports = router;
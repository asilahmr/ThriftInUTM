// controllers/walletController.js
const WalletModel = require('../models/walletModel');

class WalletController {

  // Get wallet balance
  static async getWalletBalance(req, res) {
    try {
      const userId = req.user.id;

      console.log(`💰 Fetching wallet balance for user ${userId}`);

      const wallet = await WalletModel.getWalletBalance(userId);

      res.status(200).json({
        success: true,
        data: {
          wallet_id: wallet.wallet_id,
          balance: parseFloat(wallet.balance),
          created_at: wallet.created_at,
          updated_at: wallet.updated_at
        }
      });

    } catch (error) {
      console.error('Get wallet balance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wallet balance',
        error: error.message
      });
    }
  }

  // Get wallet summary (balance + statistics)
  static async getWalletSummary(req, res) {
    try {
      const userId = req.user.id;

      console.log(`📊 Fetching wallet summary for user ${userId}`);

      const summary = await WalletModel.getWalletSummary(userId);

      res.status(200).json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Get wallet summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wallet summary',
        error: error.message
      });
    }
  }

  // Top up wallet
  static async topUpWallet(req, res) {
    try {
      const userId = req.user.id;
      const { amount, topUpMethod } = req.body;

      console.log(`💳 Top-up request: User ${userId}, Amount: RM ${amount}, Method: ${topUpMethod}`);

      // Validate amount
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount. Must be a positive number.'
        });
      }

      const topUpAmount = parseFloat(amount);

      // Validate amount range (min RM 10, max RM 5000)
      if (topUpAmount < 10) {
        return res.status(400).json({
          success: false,
          message: 'Minimum top-up amount is RM 10.00'
        });
      }

      if (topUpAmount > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Maximum top-up amount is RM 5000.00'
        });
      }

      // Validate top-up method
      const validMethods = ['credit_card', 'e_wallet', 'online_banking'];
      if (!topUpMethod || !validMethods.includes(topUpMethod)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid top-up method. Must be: credit_card, e_wallet, or online_banking'
        });
      }

      // Process top-up
      const result = await WalletModel.topUpWallet(userId, topUpAmount, topUpMethod);

      console.log(`✅ Top-up successful: Transaction ID ${result.transaction_id}`);

      res.status(200).json({
        success: true,
        message: `Successfully topped up RM ${topUpAmount.toFixed(2)}`,
        data: {
          transaction_id: result.transaction_id,
          amount: result.amount,
          balance_before: result.balance_before,
          balance_after: result.balance_after,
          top_up_method: topUpMethod
        }
      });

    } catch (error) {
      console.error('Top-up wallet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to top up wallet',
        error: error.message
      });
    }
  }

  // Get transaction history
  static async getTransactionHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      console.log(`📜 Fetching transaction history for user ${userId}`);

      const transactions = await WalletModel.getTransactionHistory(userId, limit, offset);

      res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions
      });

    } catch (error) {
      console.error('Get transaction history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction history',
        error: error.message
      });
    }
  }

  // Check sufficient balance
  static async checkSufficientBalance(req, res) {
    try {
      const userId = req.user.id;
      const { amount } = req.query;

      if (!amount || isNaN(amount)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount parameter'
        });
      }

      const hasSufficient = await WalletModel.hasSufficientBalance(userId, parseFloat(amount));
      const wallet = await WalletModel.getWalletBalance(userId);

      res.status(200).json({
        success: true,
        data: {
          has_sufficient_balance: hasSufficient,
          current_balance: parseFloat(wallet.balance),
          required_amount: parseFloat(amount),
          shortage: hasSufficient ? 0 : parseFloat(amount) - parseFloat(wallet.balance)
        }
      });

    } catch (error) {
      console.error('Check balance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check balance',
        error: error.message
      });
    }
  }

  // Get transaction statistics
  static async getTransactionStats(req, res) {
    try {
      const userId = req.user.id;

      console.log(`📊 Fetching transaction stats for user ${userId}`);

      const stats = await WalletModel.getTransactionStats(userId);

      res.status(200).json({
        success: true,
        data: {
          total_topped_up: parseFloat(stats.total_topped_up),
          total_spent: parseFloat(stats.total_spent),
          total_refunded: parseFloat(stats.total_refunded),
          top_up_count: stats.top_up_count,
          purchase_count: stats.purchase_count,
          refund_count: stats.refund_count
        }
      });

    } catch (error) {
      console.error('Get transaction stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction statistics',
        error: error.message
      });
    }
  }
}

module.exports = WalletController;
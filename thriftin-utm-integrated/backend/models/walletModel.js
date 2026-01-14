// models/walletModel.js
const db = require('../config/db');

class WalletModel {
  
  // Get or create wallet for a user
  static async getOrCreateWallet(userId) {
    const connection = await db.getConnection();
    
    try {
      // Check if wallet exists
      const [wallets] = await connection.execute(
        'SELECT * FROM wallets WHERE user_id = ?',
        [userId]
      );
      
      if (wallets.length > 0) {
        return wallets[0];
      }
      
      // Create new wallet if doesn't exist
      await connection.execute(
        'INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)',
        [userId]
      );
      
      const [newWallet] = await connection.execute(
        'SELECT * FROM wallets WHERE user_id = ?',
        [userId]
      );
      
      return newWallet[0];
      
    } finally {
      connection.release();
    }
  }

  // Get wallet balance
  static async getWalletBalance(userId) {
    const query = `
      SELECT wallet_id, user_id, balance, created_at, updated_at
      FROM wallets
      WHERE user_id = ?
    `;
    
    const [rows] = await db.execute(query, [userId]);
    
    if (rows.length === 0) {
      // Create wallet if doesn't exist
      return await this.getOrCreateWallet(userId);
    }
    
    return rows[0];
  }

  // Top up wallet (atomic transaction)
  static async topUpWallet(userId, amount, topUpMethod) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 1. Get or create wallet with lock
      let [wallets] = await connection.execute(
        'SELECT * FROM wallets WHERE user_id = ? FOR UPDATE',
        [userId]
      );
      
      // Create wallet if doesn't exist
      if (wallets.length === 0) {
        await connection.execute(
          'INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)',
          [userId]
        );
        
        [wallets] = await connection.execute(
          'SELECT * FROM wallets WHERE user_id = ? FOR UPDATE',
          [userId]
        );
      }
      
      const wallet = wallets[0];
      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = balanceBefore + parseFloat(amount);
      
      // 2. Update wallet balance
      await connection.execute(
        'UPDATE wallets SET balance = ? WHERE wallet_id = ?',
        [balanceAfter, wallet.wallet_id]
      );
      
      // 3. Record transaction
      const [transactionResult] = await connection.execute(
        `INSERT INTO wallet_transactions 
         (wallet_id, user_id, transaction_type, amount, balance_before, balance_after, 
          top_up_method, description)
         VALUES (?, ?, 'top_up', ?, ?, ?, ?, ?)`,
        [
          wallet.wallet_id,
          userId,
          amount,
          balanceBefore,
          balanceAfter,
          topUpMethod,
          `Topped up RM ${parseFloat(amount).toFixed(2)} via ${topUpMethod}`
        ]
      );
      
      await connection.commit();
      
      return {
        transaction_id: transactionResult.insertId,
        wallet_id: wallet.wallet_id,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        amount: parseFloat(amount)
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Deduct from wallet for purchase (can use existing connection/transaction)
  static async deductFromWallet(userId, amount, orderId, productName, existingConnection = null) {
    const connection = existingConnection || await db.getConnection();
    const shouldManageTransaction = !existingConnection;
    
    try {
      if (shouldManageTransaction) {
        await connection.beginTransaction();
      }
      
      // 1. Get wallet with lock
      const [wallets] = await connection.execute(
        'SELECT * FROM wallets WHERE user_id = ? FOR UPDATE',
        [userId]
      );
      
      if (wallets.length === 0) {
        throw new Error('Wallet not found');
      }
      
      const wallet = wallets[0];
      const balanceBefore = parseFloat(wallet.balance);
      const deductAmount = parseFloat(amount);
      
      // 2. Check sufficient balance
      if (balanceBefore < deductAmount) {
        throw new Error('Insufficient wallet balance');
      }
      
      const balanceAfter = balanceBefore - deductAmount;
      
      // 3. Update wallet balance
      await connection.execute(
        'UPDATE wallets SET balance = ? WHERE wallet_id = ?',
        [balanceAfter, wallet.wallet_id]
      );
      
      // 4. Record transaction
      const [transactionResult] = await connection.execute(
        `INSERT INTO wallet_transactions 
         (wallet_id, user_id, transaction_type, amount, balance_before, balance_after, 
          order_id, product_name, description)
         VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?, ?)`,
        [
          wallet.wallet_id,
          userId,
          deductAmount,
          balanceBefore,
          balanceAfter,
          orderId,
          productName,
          `Purchased "${productName}" for RM ${deductAmount.toFixed(2)}`
        ]
      );
      
      if (shouldManageTransaction) {
        await connection.commit();
      }
      
      return {
        transaction_id: transactionResult.insertId,
        wallet_id: wallet.wallet_id,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        amount: deductAmount
      };
      
    } catch (error) {
      if (shouldManageTransaction) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (shouldManageTransaction) {
        connection.release();
      }
    }
  }

  // Refund to wallet (for cancelled orders) - can use existing connection/transaction
  static async refundToWallet(userId, amount, orderId, productName, existingConnection = null) {
    const connection = existingConnection || await db.getConnection();
    const shouldManageTransaction = !existingConnection;
    
    try {
      if (shouldManageTransaction) {
        await connection.beginTransaction();
      }
      
      // 1. Get wallet with lock
      const [wallets] = await connection.execute(
        'SELECT * FROM wallets WHERE user_id = ? FOR UPDATE',
        [userId]
      );
      
      if (wallets.length === 0) {
        throw new Error('Wallet not found');
      }
      
      const wallet = wallets[0];
      const balanceBefore = parseFloat(wallet.balance);
      const refundAmount = parseFloat(amount);
      const balanceAfter = balanceBefore + refundAmount;
      
      // 2. Update wallet balance
      await connection.execute(
        'UPDATE wallets SET balance = ? WHERE wallet_id = ?',
        [balanceAfter, wallet.wallet_id]
      );
      
      // 3. Record refund transaction
      const [transactionResult] = await connection.execute(
        `INSERT INTO wallet_transactions 
         (wallet_id, user_id, transaction_type, amount, balance_before, balance_after, 
          order_id, product_name, description)
         VALUES (?, ?, 'refund', ?, ?, ?, ?, ?, ?)`,
        [
          wallet.wallet_id,
          userId,
          refundAmount,
          balanceBefore,
          balanceAfter,
          orderId,
          productName,
          `Refund for cancelled order "${productName}" - RM ${refundAmount.toFixed(2)}`
        ]
      );
      
      if (shouldManageTransaction) {
        await connection.commit();
      }
      
      return {
        transaction_id: transactionResult.insertId,
        wallet_id: wallet.wallet_id,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        amount: refundAmount
      };
      
    } catch (error) {
      if (shouldManageTransaction) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (shouldManageTransaction) {
        connection.release();
      }
    }
  }

  // Get transaction history
  static async getTransactionHistory(userId, limit = 50, offset = 0) {
    const query = `
      SELECT 
        wt.transaction_id,
        wt.transaction_type,
        wt.amount,
        wt.balance_before,
        wt.balance_after,
        wt.top_up_method,
        wt.order_id,
        wt.product_name,
        wt.description,
        wt.transaction_date
      FROM wallet_transactions wt
      WHERE wt.user_id = ?
      ORDER BY wt.transaction_date DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.execute(query, [userId, limit, offset]);
    return rows;
  }

  // Get transaction statistics
  static async getTransactionStats(userId) {
    const query = `
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'top_up' THEN amount ELSE 0 END), 0) as total_topped_up,
        COALESCE(SUM(CASE WHEN transaction_type = 'purchase' THEN amount ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(CASE WHEN transaction_type = 'refund' THEN amount ELSE 0 END), 0) as total_refunded,
        COUNT(CASE WHEN transaction_type = 'top_up' THEN 1 END) as top_up_count,
        COUNT(CASE WHEN transaction_type = 'purchase' THEN 1 END) as purchase_count,
        COUNT(CASE WHEN transaction_type = 'refund' THEN 1 END) as refund_count
      FROM wallet_transactions
      WHERE user_id = ?
      GROUP BY user_id
    `;
    
    const [rows] = await db.execute(query, [userId]);
    
    if (rows.length === 0) {
      return {
        total_topped_up: 0,
        total_spent: 0,
        total_refunded: 0,
        top_up_count: 0,
        purchase_count: 0,
        refund_count: 0
      };
    }
    
    return rows[0];
  }

  // Check if user has sufficient balance
  static async hasSufficientBalance(userId, amount) {
    const wallet = await this.getWalletBalance(userId);
    return parseFloat(wallet.balance) >= parseFloat(amount);
  }

  // Get wallet summary (balance + stats)
  static async getWalletSummary(userId) {
    const wallet = await this.getWalletBalance(userId);
    const stats = await this.getTransactionStats(userId);
    
    return {
      wallet_id: wallet.wallet_id,
      balance: parseFloat(wallet.balance),
      created_at: wallet.created_at,
      updated_at: wallet.updated_at,
      statistics: {
        total_topped_up: parseFloat(stats.total_topped_up),
        total_spent: parseFloat(stats.total_spent),
        total_refunded: parseFloat(stats.total_refunded),
        top_up_count: stats.top_up_count,
        purchase_count: stats.purchase_count,
        refund_count: stats.refund_count
      }
    };
  }
}

module.exports = WalletModel;
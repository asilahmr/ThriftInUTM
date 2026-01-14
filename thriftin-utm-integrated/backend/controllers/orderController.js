// controllers/orderController.js - UPDATED WITH WALLET INTEGRATION
const OrderModel = require('../models/orderModel');

class OrderController {

  // Prepare checkout (validate product before showing checkout screen)
  static async prepareCheckout(req, res) {
    try {
      const buyerId = req.user.user_id;
      const { productId } = req.params;

      console.log(`Preparing checkout for product ${productId} by buyer ${buyerId}`);

      // Check if product is available
      const product = await OrderModel.checkProductAvailability(productId, buyerId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product is no longer available or you cannot buy your own product'
        });
      }

      // Get seller information
      const seller = await OrderModel.getSellerInfo(product.seller_id);

      res.status(200).json({
        success: true,
        message: 'Product available for checkout',
        data: {
          product: {
            product_id: product.product_id,
            name: product.name,
            price: product.price,
            category: product.category,
            condition: product.condition,
            description: product.description
          },
          seller: {
            seller_id: seller.user_id,
            name: seller.name,
            email: seller.email
          },
          total_amount: product.price
        }
      });

    } catch (error) {
      console.error('Prepare checkout error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to prepare checkout',
        error: error.message
      });
    }
  }

  // Process payment with wallet (no payment method needed)
  static async processPayment(req, res) {
    try {
      const buyerId = req.user.user_id;
      const { productId } = req.body;

      console.log(`Processing wallet payment: Product ${productId} by buyer ${buyerId}`);

      // Validate product ID
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      // Create order with wallet payment (will check balance automatically)
      const result = await OrderModel.createOrder(buyerId, productId);

      console.log(`✅ Order created successfully: Order ID ${result.orderId}`);

      // Get complete order details for receipt
      const orderDetails = await OrderModel.getOrderById(result.orderId, buyerId);

      res.status(201).json({
        success: true,
        message: 'Payment successful! Order created.',
        data: {
          order_id: result.orderId,
          order: orderDetails,
          wallet_transaction: result.walletTransaction
        }
      });

    } catch (error) {
      console.error('Process payment error:', error);
      
      if (error.message === 'Product is no longer available') {
        return res.status(409).json({
          success: false,
          message: 'This product was just purchased by another buyer',
          error: error.message
        });
      }

      if (error.message.includes('Insufficient wallet balance')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: 'insufficient_balance'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Payment failed. Please try again.',
        error: error.message
      });
    }
  }

  // Get buyer's order history
  static async getOrderHistory(req, res) {
    try {
      const buyerId = req.user.user_id;

      console.log(`Fetching order history for buyer ${buyerId}`);

      const orders = await OrderModel.getBuyerOrders(buyerId);

      res.status(200).json({
        success: true,
        count: orders.length,
        data: orders
      });

    } catch (error) {
      console.error('Get order history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load order history',
        error: error.message
      });
    }
  }

  // Get order receipt details
  static async getOrderReceipt(req, res) {
    try {
      const buyerId = req.user.user_id;
      const { orderId } = req.params;

      console.log(`Fetching order receipt: Order ${orderId} for buyer ${buyerId}`);

      const order = await OrderModel.getOrderById(orderId, buyerId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or you do not have access'
        });
      }

      // Check if order can be cancelled
      const canCancel = await OrderModel.canCancelOrder(orderId, buyerId);

      res.status(200).json({
        success: true,
        data: {
          ...order,
          can_cancel: canCancel
        }
      });

    } catch (error) {
      console.error('Get order receipt error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load order receipt',
        error: error.message
      });
    }
  }

  // Cancel order (with wallet refund)
  static async cancelOrder(req, res) {
    try {
      const buyerId = req.user.user_id;
      const { orderId } = req.params;

      console.log(`Cancelling order: Order ${orderId} by buyer ${buyerId}`);

      await OrderModel.cancelOrder(orderId, buyerId);

      // Get updated order details
      const updatedOrder = await OrderModel.getOrderById(orderId, buyerId);

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully. Amount refunded to your wallet. Item returned to marketplace.',
        data: updatedOrder
      });

    } catch (error) {
      console.error('Cancel order error:', error);

      if (error.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (error.message === 'Order is already cancelled') {
        return res.status(400).json({
          success: false,
          message: 'This order is already cancelled'
        });
      }

      if (error.message === 'Cancellation period has expired (24 hours)') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel order. Cancellation period has expired (24 hours).'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to cancel order',
        error: error.message
      });
    }
  }
}

module.exports = OrderController;
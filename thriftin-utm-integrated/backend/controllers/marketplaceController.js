// controllers/marketplaceController.js
const MarketplaceModel = require('../models/marketplaceModel');

class MarketplaceController {

  // Get all marketplace products
  static async getAllProducts(req, res) {
    try {
      const userId = req.user.user_id;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const products = await MarketplaceModel.getAllProducts(userId, limit, offset);

      res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });

    } catch (error) {
      console.error('Get marketplace products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load products',
        error: error.message
      });
    }
  }

  //  Search products
  static async searchProducts(req, res) {
    try {
      const userId = req.user.user_id;
      const searchQuery = req.query.q;

      if (!searchQuery || searchQuery.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const products = await MarketplaceModel.searchProducts(userId, searchQuery);

      // Save search query for AI recommendations
      await MarketplaceModel.saveSearchQuery(userId, searchQuery, products.length);

      res.status(200).json({
        success: true,
        query: searchQuery,
        count: products.length,
        data: products
      });

    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products',
        error: error.message
      });
    }
  }

  // Filter by category
  static async getProductsByCategory(req, res) {
    try {
      const userId = req.user.user_id;
      const category = req.params.category;

      const validCategories = ['Books', 'Electronics', 'Fashion', 'Furniture', 'Others'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }

      const products = await MarketplaceModel.getProductsByCategory(userId, category);

      res.status(200).json({
        success: true,
        category: category,
        count: products.length,
        data: products
      });

    } catch (error) {
      console.error('Get products by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to filter products',
        error: error.message
      });
    }
  }

  // Get product details
  static async getProductDetails(req, res) {
    try {
      const userId = req.user.user_id;
      const productId = req.params.id;

      const product = await MarketplaceModel.getProductDetails(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Increment view count
      await MarketplaceModel.incrementViewCount(productId);

      // Track interaction for AI
      await MarketplaceModel.trackInteraction(userId, productId, 'view');

      res.status(200).json({
        success: true,
        data: product
      });

    } catch (error) {
      console.error('Get product details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load product details',
        error: error.message
      });
    }
  }

  // Get AI recommendations
  static async getRecommendations(req, res) {
    try {
      const userId = req.user.user_id;
      const limit = parseInt(req.query.limit) || 10;

      const products = await MarketplaceModel.getRecommendations(userId, limit);

      res.status(200).json({
        success: true,
        message: 'Recommendations based on your interests',
        count: products.length,
        data: products
      });

    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load recommendations',
        error: error.message
      });
    }
  }

  // Get category statistics
  static async getCategoryStats(req, res) {
    try {
      const userId = req.user.user_id;
      const stats = await MarketplaceModel.getCategoryStats(userId);

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get category stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load statistics',
        error: error.message
      });
    }
  }
}

module.exports = MarketplaceController;
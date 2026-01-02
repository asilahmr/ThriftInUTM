// controllers/productController.js
const ProductModel = require('../models/productModel');
const { validateProductData, validateImages } = require('../utils/validation');

class ProductController {

  // Add New Product
  static async addProduct(req, res) {
    try {
      const sellerId = req.user.user_id;
      const productData = req.body;

      // Validate product data
      const validation = validateProductData(productData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Validate images
      const imageValidation = validateImages(req.files);
      if (!imageValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Image validation failed',
          errors: imageValidation.errors
        });
      }

      // Create product
      const productId = await ProductModel.createProduct({
        ...productData,
        seller_id: sellerId
      });

      // Save image URLs
      const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
      await ProductModel.addProductImages(productId, imageUrls);

      // Get the created product
      const product = await ProductModel.getProductById(productId, sellerId);

      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        data: product
      });

    } catch (error) {
      console.error('Add product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add product',
        error: error.message
      });
    }
  }

  // View Own Product Listing
  static async getMyProducts(req, res) {
    try {
      const sellerId = req.user.user_id;

      const products = await ProductModel.getProductsBySeller(sellerId);

      if (products.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No products listed yet',
          data: []
        });
      }

      res.status(200).json({
        success: true,
        message: 'Products retrieved successfully',
        count: products.length,
        data: products
      });

    } catch (error) {
      console.error('Get my products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve products',
        error: error.message
      });
    }
  }

  // Get single product details
  static async getProduct(req, res) {
    try {
      const productId = req.params.id;
      const sellerId = req.user.user_id;

      const product = await ProductModel.getProductById(productId, sellerId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or you do not have access'
        });
      }

      res.status(200).json({
        success: true,
        data: product
      });

    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve product',
        error: error.message
      });
    }
  }

  // Edit Product Details
  static async updateProduct(req, res) {
    try {
      const productId = req.params.id;
      const sellerId = req.user.user_id;
      const updateData = req.body;

      // Check if product exists and belongs to user
      const existingProduct = await ProductModel.getProductById(productId, sellerId);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or you do not have permission to edit'
        });
      }

      // Validate updated data
      const validation = validateProductData(updateData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Update product
      const updated = await ProductModel.updateProduct(productId, sellerId, updateData);

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update product'
        });
      }

      // Handle image updates if new images provided
      if (req.files && req.files.length > 0) {
        const imageValidation = validateImages(req.files);
        if (!imageValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: 'Image validation failed',
            errors: imageValidation.errors
          });
        }

        const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
        await ProductModel.updateProductImages(productId, imageUrls);
      }

      // Get updated product
      const updatedProduct = await ProductModel.getProductById(productId, sellerId);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct
      });

    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message
      });
    }
  }

  // Delete Product
  static async deleteProduct(req, res) {
    try {
      const productId = req.params.id;
      const sellerId = req.user.user_id;

      // Check if product exists and belongs to user
      const product = await ProductModel.getProductById(productId, sellerId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or you do not have permission to delete'
        });
      }

      // Soft delete (mark as deleted)
      const deleted = await ProductModel.deleteProduct(productId, sellerId);

      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete product'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message
      });
    }
  }

  // Admin delete (for moderation)
  static async adminDeleteProduct(req, res) {
    try {
      const productId = req.params.id;

      // Delete without checking seller
      const deleted = await ProductModel.deleteProduct(productId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Product removed by admin'
      });

    } catch (error) {
      console.error('Admin delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message
      });
    }
  }
}

module.exports = ProductController;
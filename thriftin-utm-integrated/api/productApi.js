import api from '../utils/api';
import { API_BASE_URL } from '../utils/constants';

// NOTE: We rely on the interceptors in '../utils/api.js' to handle authentication tokens.
// Do NOT create a new axios instance here or hardcode tokens.

// Product API methods
export const productApi = {

  // Add New Product
  addProduct: async (productData, images) => {
    console.log('📤 Attempting to add product...');
    console.log('Product data:', productData);
    console.log('Images count:', images.length);

    const formData = new FormData();

    // Append product data
    formData.append('name', productData.name);
    formData.append('category', productData.category);
    formData.append('description', productData.description);
    formData.append('price', productData.price);
    formData.append('condition', productData.condition);

    // Append images
    images.forEach((image, index) => {
      console.log(`Image ${index}:`, image.uri);
      formData.append('images', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || `product-${index}.jpg`,
      });
    });

    console.log('🚀 Sending request to:', `${API_BASE_URL}/products`);

    try {
      const response = await api.post('/api/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Success:', response);
      return response;
    } catch (error) {
      console.error('❌ Error details:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Get My Products
  getMyProducts: async () => {
    const response = await api.get('/api/products/my-products');
    return response;
  },

  // Get single product
  getProduct: async (productId) => {
    const response = await api.get(`/api/products/${productId}`);
    return response;
  },

  // Update Product
  updateProduct: async (productId, productData, newImages = null) => {
    if (newImages && newImages.length > 0) {
      // Update with new images
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('category', productData.category);
      formData.append('description', productData.description);
      formData.append('price', productData.price);
      formData.append('condition', productData.condition);

      newImages.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || `product-${index}.jpg`,
        });
      });

      const response = await api.put(`/api/products/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } else {
      // Update without images
      const response = await api.put(`/api/products/${productId}`, productData);
      return response;
    }
  },

  // Delete Product
  deleteProduct: async (productId) => {
    const response = await api.delete(`/api/products/${productId}`);
    return response;
  },
};

// Marketplace API methods
export const marketplaceApi = {

  //Get all marketplace products
  getAllProducts: async (limit = 50, offset = 0) => {
    const response = await api.get(`/api/marketplace?limit=${limit}&offset=${offset}`);
    return response;
  },

  // Search products
  searchProducts: async (searchQuery) => {
    const response = await api.get(`/api/marketplace/search?q=${encodeURIComponent(searchQuery)}`);
    return response;
  },

  // Filter by category
  getProductsByCategory: async (category) => {
    const response = await api.get(`/api/marketplace/category/${category}`);
    return response;
  },

  //Get product details
  getProductDetails: async (productId) => {
    const response = await api.get(`/api/marketplace/product/${productId}`);
    return response;
  },

  // Get recommendations
  getRecommendations: async (limit = 10) => {
    const response = await api.get(`/api/marketplace/recommendations?limit=${limit}`);
    return response;
  },

  // Get category stats
  getCategoryStats: async () => {
    const response = await api.get('/api/marketplace/stats/categories');
    return response;
  },
};

export const orderApi = {

  // Prepare checkout
  prepareCheckout: async (productId) => {
    const response = await api.get(`/api/orders/checkout/${productId}`);
    return response;
  },

  // Process payment and create order
  processPayment: async (productId) => {
    const response = await api.post('/api/orders/purchase', {
      productId
    });
    return response;
  },

  // Get order history
  getOrderHistory: async () => {
    const response = await api.get('/api/orders/history');
    return response;
  },

  // Get order receipt
  getOrderReceipt: async (orderId) => {
    const response = await api.get(`/api/orders/receipt/${orderId}`);
    return response;
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    const response = await api.put(`/api/orders/cancel/${orderId}`);
    return response;
  },
};

export const walletApi = {

  // Get wallet balance
  getBalance: async () => {
    const response = await api.get('/api/wallet/balance');
    return response;
  },

  // Get wallet summary (balance + statistics)
  getSummary: async () => {
    const response = await api.get('/api/wallet/summary');
    return response;
  },

  // Top up wallet
  topUp: async (amount, topUpMethod) => {
    const response = await api.post('/api/wallet/topup', {
      amount,
      topUpMethod
    });
    return response;
  },

  // Get transaction history
  getTransactions: async (limit = 50, offset = 0) => {
    const response = await api.get(`/api/wallet/transactions?limit=${limit}&offset=${offset}`);
    return response;
  },

  // Check sufficient balance
  checkBalance: async (amount) => {
    const response = await api.get(`/api/wallet/check-balance?amount=${amount}`);
    return response;
  },

  // Get transaction statistics
  getStats: async () => {
    const response = await api.get('/api/wallet/stats');
    return response;
  },
};

export const chatApi = {
  // Create conversation
  createConversation: async (participant1Id, participant2Id) => {
    const response = await api.post('/api/conversations', {
      participant_1_id: participant1Id,
      participant_2_id: participant2Id,
    });
    return response;
  },
};


export default api;
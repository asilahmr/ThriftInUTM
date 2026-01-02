// src/api/productApi.js
import axios from 'axios';
import { API_BASE_URL, TEST_JWT_TOKEN } from '../utils/constants';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increased to 60 seconds for image upload
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    config.headers.Authorization = `Bearer ${TEST_JWT_TOKEN}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.message || 'Something went wrong');
    } else if (error.request) {
      // No response from server
      throw new Error('Cannot connect to server. Check your connection.');
    } else {
      throw new Error(error.message);
    }
  }
);

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
      const response = await api.post('/products', formData, {
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
    const response = await api.get('/products/my-products');
    return response;
  },
  
  // Get single product
  getProduct: async (productId) => {
    const response = await api.get(`/products/${productId}`);
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
      
      const response = await api.put(`/products/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } else {
      // Update without images
      const response = await api.put(`/products/${productId}`, productData);
      return response;
    }
  },
  
  // Delete Product
  deleteProduct: async (productId) => {
    const response = await api.delete(`/products/${productId}`);
    return response;
  },
};

// Marketplace API methods
export const marketplaceApi = {
  
  //Get all marketplace products
  getAllProducts: async (limit = 50, offset = 0) => {
    const response = await api.get(`/marketplace?limit=${limit}&offset=${offset}`);
    return response;
  },
  
  // Search products
  searchProducts: async (searchQuery) => {
    const response = await api.get(`/marketplace/search?q=${encodeURIComponent(searchQuery)}`);
    return response;
  },
  
  // Filter by category
  getProductsByCategory: async (category) => {
    const response = await api.get(`/marketplace/category/${category}`);
    return response;
  },
  
  //Get product details
  getProductDetails: async (productId) => {
    const response = await api.get(`/marketplace/product/${productId}`);
    return response;
  },
  
  // Get recommendations
  getRecommendations: async (limit = 10) => {
    const response = await api.get(`/marketplace/recommendations?limit=${limit}`);
    return response;
  },
  
  // Get category stats
  getCategoryStats: async () => {
    const response = await api.get('/marketplace/stats/categories');
    return response;
  },
};

export const orderApi = {
  
  // Prepare checkout
  prepareCheckout: async (productId) => {
    const response = await api.get(`/orders/checkout/${productId}`);
    return response;
  },
  
  // Process payment and create order
 processPayment: async (productId) => {
  const response = await api.post('/orders/purchase', {
    productId
  });
  return response;
},
  
  // Get order history
  getOrderHistory: async () => {
    const response = await api.get('/orders/history');
    return response;
  },
  
  // Get order receipt
  getOrderReceipt: async (orderId) => {
    const response = await api.get(`/orders/receipt/${orderId}`);
    return response;
  },
  
  // Cancel order
  cancelOrder: async (orderId) => {
    const response = await api.put(`/orders/cancel/${orderId}`);
    return response;
  },
};

export const walletApi = {
  
  // Get wallet balance
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response;
  },
  
  // Get wallet summary (balance + statistics)
  getSummary: async () => {
    const response = await api.get('/wallet/summary');
    return response;
  },
  
  // Top up wallet
  topUp: async (amount, topUpMethod) => {
    const response = await api.post('/wallet/topup', {
      amount,
      topUpMethod
    });
    return response;
  },
  
  // Get transaction history
  getTransactions: async (limit = 50, offset = 0) => {
    const response = await api.get(`/wallet/transactions?limit=${limit}&offset=${offset}`);
    return response;
  },
  
  // Check sufficient balance
  checkBalance: async (amount) => {
    const response = await api.get(`/wallet/check-balance?amount=${amount}`);
    return response;
  },
  
  // Get transaction statistics
  getStats: async () => {
    const response = await api.get('/wallet/stats');
    return response;
  },
};


export default api;
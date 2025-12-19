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
  
  // UC004: Add New Product
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
  
  // UC005: Get My Products
  getMyProducts: async () => {
    const response = await api.get('/products/my-products');
    return response;
  },
  
  // Get single product
  getProduct: async (productId) => {
    const response = await api.get(`/products/${productId}`);
    return response;
  },
  
  // UC006: Update Product
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
  
  // UC007: Delete Product
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

export default api;
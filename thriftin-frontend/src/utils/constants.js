// src/utils/constants.js

// API Configuration
// Change this to your computer's IP address when testing on physical device
// Find your IP: Windows (ipconfig), Mac/Linux (ifconfig)
export const API_BASE_URL = 'http://10.134.246.207:3000/api'; // Replace with your IP
// For Android emulator: 'http://10.0.2.2:3000/api'
// For iOS simulator: 'http://localhost:3000/api'

// Your test JWT token (paste from generate-test-token.js)
export const TEST_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3R1c2VyQGdyYWR1YXRlLnV0bS5teSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJpc192ZXJpZmllZCI6dHJ1ZSwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NjUyOTg2ODUsImV4cCI6MTc2NTkwMzQ4NX0.xOhfyVrQyEURmyVEpI5u-dq134IsLFUeMuv804wiKB8'; // Replace with your token

// Product Categories
export const PRODUCT_CATEGORIES = [
  { label: 'Books', value: 'Books' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Fashion', value: 'Fashion' },
  { label: 'Furniture', value: 'Furniture' },
  { label: 'Others', value: 'Others' }
];

// Product Conditions
export const PRODUCT_CONDITIONS = [
  { label: 'Like New', value: 'Like New' },
  { label: 'Excellent', value: 'Excellent' },
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' }
];

// Colors 
export const COLORS = {
  primary: '#A30F0F',      
  secondary: '#81C784',     
  accent: '#FFB74D',        
  background: '#FFFFFF',    
  card: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  error: '#ef4444',
  success: '#388E3C',
  border: '#E0E0E0'
};
// src/utils/constants.js

// API Configuration
// Change this to your computer's IP address when testing on physical device
// Find your IP: Windows (ipconfig), Mac/Linux (ifconfig)
export const API_BASE_URL = 'http://10.0.2.2:3000/api';
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
  primary: '#B71C1C',
  primaryLight: '#FFF5F5',
  secondary: '#4285F4',
  accent: '#FFB74D',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  background: '#F5F5F5',
  card: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',
  text: '#333333',
  textSecondary: '#757575',
  textLight: '#666666',
  textLighter: '#999999',
  border: '#E0E0E0',
  danger: '#D32F2F',
};

export const SIZES = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const NOTIFICATION_TYPES = {
  NEW_MESSAGE: 'new_message',
  SYSTEM_UPDATE: 'system_update',
  REPORT_UPDATE: 'report_update',
  FEEDBACK_RESPONSE: 'feedback_response',
  HELP_TICKET: 'help_ticket',
  PRICE_ALERT: 'price_alert',
  NEW_LISTING: 'new_listing',
};

export const FEEDBACK_TYPES = {
  BUG_REPORT: 'bug_report',
  FEATURE_REQUEST: 'feature_request',
  IMPROVEMENT: 'improvement',
  COMPLAINT: 'complaint',
  COMPLIMENT: 'compliment',
  APP_RATING: 'app_rating',
};

export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
};
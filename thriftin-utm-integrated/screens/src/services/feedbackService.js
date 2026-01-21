
import api from './api';

export const feedbackService = {
  submitFeedback: async (data, screenshot = null) => {
    try {
      const formData = new FormData();
      
      // Add all data fields
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key].toString());
        }
      });
      
      // Add screenshot if provided
      if (screenshot) {
        formData.append('screenshot', {
          uri: screenshot.uri,
          type: screenshot.type || 'image/jpeg',
          name: screenshot.name || 'screenshot.jpg',
        });
      }
      
      const response = await api.post('/api/feedback', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response;
    } catch (error) {
      console.error('Feedback submission error:', error);
      throw error;
    }
  },

  getUserFeedback: (userId, params = {}) => {
    return api.get(`/api/feedback/${userId}`, { params });
  },

  getFeedbackDetail: (feedbackId) => {
    return api.get(`/api/feedback/detail/${feedbackId}`);
  },
};
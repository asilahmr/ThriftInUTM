import api from './api';

export const feedbackService = {
  submitFeedback: (data, screenshot = null) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    if (screenshot) {
      formData.append('screenshot', {
        uri: screenshot.uri,
        type: screenshot.type,
        name: screenshot.name,
      });
    }
    
    return api.post('/feedback', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getUserFeedback: (userId, params = {}) => {
    return api.get(`/feedback/${userId}`, { params });
  },

  getFeedbackDetail: (feedbackId) => {
    return api.get(`/feedback/detail/${feedbackId}`);
  },
};
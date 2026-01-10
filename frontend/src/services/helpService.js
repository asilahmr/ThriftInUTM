import api from './api';

export const helpService = {
  getCategories: () => {
    return api.get('/help/categories');
  },

  getFAQs: (params = {}) => {
    return api.get('/help/faq', { params });
  },

  getFAQDetail: (faqId) => {
    return api.get(`/help/faq/${faqId}`);
  },

  voteFAQ: (faqId, userId, isHelpful) => {
    return api.post(`/help/faq/${faqId}/helpful`, { userId, isHelpful });
  },

  createTicket: (data, file = null) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    
    if (file) {
      formData.append('attachment', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      });
    }
    
    return api.post('/help/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getTickets: (userId, params = {}) => {
    return api.get(`/help/tickets/${userId}`, { params });
  },
};
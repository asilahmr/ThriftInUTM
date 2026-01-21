
import api from './api';

export const helpService = {
  createTicket: async (data, attachment = null) => {
    try {
      const formData = new FormData();
      
      // Add all data fields
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key].toString());
        }
      });
      
      // Add attachment if provided
      if (attachment) {
        formData.append('attachment', {
          uri: attachment.uri,
          type: attachment.type || 'image/jpeg',
          name: attachment.name || 'attachment.jpg',
        });
      }
      
      const response = await api.post('/help/tickets', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response;
    } catch (error) {
      console.error('Create ticket error:', error);
      throw error;
    }
  },

  getTickets: async (userId, params = {}) => {
    try {
      const response = await api.get(`/help/tickets/${userId}`, { params });
      return response;
    } catch (error) {
      console.error('Get tickets error:', error);
      throw error;
    }
  },

  getTicketDetail: async (ticketId) => {
    try {
      const response = await api.get(`/help/tickets/detail/${ticketId}`);
      return response;
    } catch (error) {
      console.error('Get ticket detail error:', error);
      throw error;
    }
  },

  getFAQs: async (params = {}) => {
    try {
      const response = await api.get('/help/faq', { params });
      return response;
    } catch (error) {
      console.error('Get FAQs error:', error);
      throw error;
    }
  },

  getCategories: async () => {
    try {
      const response = await api.get('/help/categories');
      return response;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  },
};
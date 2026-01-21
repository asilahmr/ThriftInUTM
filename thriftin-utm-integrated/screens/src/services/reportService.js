
import api from './api';

export const reportService = {
  reportUser: async (data) => {
    try {
      const response = await api.post('/reports/user', data);
      return response;
    } catch (error) {
      console.error('Report user error:', error);
      throw error;
    }
  },

  blockUser: async (data) => {
    try {
      const response = await api.post('/reports/block', data);
      return response;
    } catch (error) {
      console.error('Block user error:', error);
      throw error;
    }
  },

  getBlockedUsers: async (userId) => {
    try {
      const response = await api.get(`/reports/blocked/${userId}`);
      return response;
    } catch (error) {
      console.error('Get blocked users error:', error);
      throw error;
    }
  },

  unblockUser: async (blockId) => {
    try {
      const response = await api.put(`/reports/unblock/${blockId}`);
      return response;
    } catch (error) {
      console.error('Unblock user error:', error);
      throw error;
    }
  },
};
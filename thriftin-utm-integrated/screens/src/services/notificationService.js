
import api from './api';

export const notificationService = {
  getNotifications: async (userId, params = {}) => {
    try {
      const response = await api.get(`/api/notifications/${userId}`, { params });
      return response;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  getUnreadCount: async (userId) => {
    try {
      const response = await api.get(`/api/notifications/${userId}/unread-count`);
      return response;
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/api/notifications/${notificationId}/read`);
      return response;
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  },

  markAllAsRead: async (userId) => {
    try {
      const response = await api.put(`/api/notifications/read-all/${userId}`);
      return response;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  },

  getPreferences: async (userId) => {
    try {
      const response = await api.get(`/api/notifications/preferences/${userId}`);
      return response;
    } catch (error) {
      console.error('Get preferences error:', error);
      throw error;
    }
  },

  updatePreferences: async (userId, preferences) => {
    try {
      const response = await api.put(`/api/notifications/preferences/${userId}`, preferences);
      return response;
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  },
};

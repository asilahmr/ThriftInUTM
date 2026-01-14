import api from './api';

export const notificationService = {
  getNotifications: (userId, params = {}) => {
    return api.get(`/notifications/${userId}`, { params });
  },

  getUnreadCount: (userId) => {
    return api.get(`/notifications/${userId}/unread-count`);
  },

  markAsRead: (notificationId) => {
    return api.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: (userId) => {
    return api.put(`/notifications/read-all/${userId}`);
  },

  getPreferences: (userId) => {
    return api.get(`/notifications/preferences/${userId}`);
  },

  updatePreferences: (userId, preferences) => {
    return api.put(`/notifications/preferences/${userId}`, preferences);
  },
};
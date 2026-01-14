import api from './api';

export const chatService = {
  getConversations: (userId, params = {}) => {
    return api.get(`/conversations/${userId}`, { params });
  },

  createConversation: (data) => {
    return api.post('/conversations', data);
  },

  getMessages: (conversationId, params = {}) => {
    return api.get(`/messages/${conversationId}`, { params });
  },

  sendMessage: (data, file = null) => {
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
    
    return api.post('/messages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteMessage: (messageId, userId) => {
    return api.delete(`/messages/${messageId}`, { params: { userId } });
  },

  searchMessages: (userId, query) => {
    return api.get(`/messages/search/${userId}`, { params: { query } });
  },

  getAIResponse: (message, userId) => {
    return api.post('/ai/respond', { message, userId });
  },

  getQuickActions: () => {
    return api.get('/ai/quick-actions');
  },
};
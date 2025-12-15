// config.js
const API_URL = 'http://10.198.209.113:3000';

export default {
  API_URL,
  endpoints: {
    login: `${API_URL}/login`,
    register: `${API_URL}/register`,
    recoverPassword: `${API_URL}/recover-password`,
    resetPassword: `${API_URL}/reset-password`,
  }
};
import axios from 'axios';

const API_URL = 'http://localhost:5000/api' || 'https://level-up-local-version-jauth.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});


export const chatAPI = {
  sendMessage: async (message) => {
    try {
      const response = await apiClient.post('/chat/message', { message });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
};

export default apiClient; 
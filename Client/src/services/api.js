import axios from 'axios';

// Base API URL
const API_URL = 'http://localhost:5003/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors and transform responses
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      if (!response.data.token && response.data.data && response.data.data.token) {
        response.data.token = response.data.data.token;
      }
      if (!response.data.user && response.data.data && response.data.data.user) {
        response.data.user = response.data.data.user;
      }
    }
    
    return response;
  },
  (error) => {
    // Distinguish between different types of errors for better handling
    if (error.response) {
      // Server responded with an error status (4xx, 5xx)
      console.error("API Error:", error.response);
      
      // Handle 401 errors (unauthorized)
      if (error.response.status === 401) {
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        
        // Only redirect if we're not already on the login page and not trying to login
        const isLoginPath = window.location.pathname.includes('/login');
        const isLoginRequest = error.config && 
          (error.config.url.includes('/auth/login') || 
           error.config.url.includes('/auth/register') ||
           error.config.url.includes('/auth/google'));
        
        if (!isLoginPath && !isLoginRequest) {
          window.location.href = '/login';
        }
      } 
      // Don't treat 404 errors as critical for certain endpoints
      else if (error.response.status === 404) {
        const isTaskEndpoint = error.config && error.config.url.includes('/tasks');
        if (isTaskEndpoint) {
          console.warn("Task endpoint not found: This could be normal if the server doesn't have task data yet");
        } else {
          console.error(`API 404 Error: Endpoint ${error.config?.url} not found`);
        }
      }
    } 
    else if (error.request) {
      // No response received from server
      console.error("API Network Error: No response from server", error.request);
    } 
    else {
      // Error in setting up the request
      console.error("API Request Error:", error.message);
    }
    
    return Promise.reject(error);
  }
);


// Auth related API calls
export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (!response.data?.success || !response.data?.token || !response.data?.user) {
        return Promise.reject(new Error(response.data?.message || 'Invalid response from server'));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      
      if (error.response?.data?.message) {
        return Promise.reject(new Error(error.response.data.message));
      } else if (error.response?.data?.error) {
        return Promise.reject(new Error(error.response.data.error));
      } else if (error.message) {
        return Promise.reject(new Error(error.message));
      }
      
      return Promise.reject(new Error('Login failed: Could not connect to server'));
    }
  },
  
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (!response.data?.success || !response.data?.token || !response.data?.user) {
        return Promise.reject(new Error('Invalid response from server'));
      }
      
      return response.data;
    } catch (error) {
      return Promise.reject(new Error(error.response?.data?.message || 'Registration failed'));
    }
  },
  
  logout: () => api.post('/auth/logout'),
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      
      if (!response.data?.success) {
        return Promise.reject(new Error('Invalid response from server'));
      }
      
      return response.data;
    } catch (error) {
      return Promise.reject(new Error(error.response?.data?.message || 'Failed to get current user'));
    }
  },
  
  googleLogin: async (token) => {
    try {
      const response = await api.post('/auth/google', { token });
      
      if (!response.data?.success || !response.data?.token || !response.data?.user) {
        return Promise.reject(new Error('Invalid response from server'));
      }
      
      return response.data;
    } catch (error) {
      return Promise.reject(new Error(error.response?.data?.message || 'Google login failed'));
    }
  },
  
  refreshToken: () => api.post('/auth/refresh-token'),
};

// User related API calls
export const userService = {
  updateProfile: (userData) => api.put('/users/profile', userData),
  getProfile: () => api.get('/users/profile'),
  updateAvatar: (formData) => {
    return api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Handle API errors
const handleApiError = (error) => {
  if (error.response) {
    if (error.response.status === 404) {
      // Handle 404 errors (not found)
      return Promise.reject(new Error(`Resource not found: ${error.config?.url}`));
    } else {
      return Promise.reject(new Error(error.response.data?.message || error.response.data || 'Server error'));
    }
  } else if (error.request) {
    return Promise.reject(new Error('Network error: No response from server'));
  } else {
    return Promise.reject(new Error(`Request error: ${error.message}`));
  }
};

export default api; 
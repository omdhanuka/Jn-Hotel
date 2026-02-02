import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_INACTIVE') {
      // Account has been deactivated
      toast.error('Your account has been deactivated by the administrator.');
      
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
    
    return Promise.reject(error);
  }
);

// Also set global axios defaults for backward compatibility
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default api;

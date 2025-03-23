/**
 * API Configuration
 * This file contains all API-related configuration for the application.
 * For Netlify/Vercel deployment, we use relative URLs for API endpoints
 */

import axios from 'axios';

// Determine API base URL based on environment
let API_BASE_URL = '/api';

// For local development, we might need to use a different URL
if (process.env.NODE_ENV === 'development') {
  // If running frontend on different port than backend in development
  API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add authorization token
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

// Create an authenticated axios instance with a specific token
export const createAuthenticatedAxios = (token) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  return instance;
};

// Helper to handle common API errors
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Get response data
  const response = error.response;
  
  if (response) {
    // Server responded with a status code outside 2xx range
    const status = response.status;
    const message = response.data?.message || response.statusText || 'An unexpected error occurred';
    
    console.log(`API Error ${status}: ${message}`);
    
    if (status === 401) {
      // Unauthorized - token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?session_expired=true';
      return { success: false, message: 'Your session has expired. Please login again.' };
    }
    
    return { success: false, message };
  }
  
  // Network error or other issue
  return { 
    success: false, 
    message: 'Network error. Please check your connection and try again.'
  };
};

// Create utility for API error handling in UI components
export const extractErrorMessage = (error) => {
  if (error.response && error.response.data) {
    return error.response.data.message || 'An unexpected error occurred';
  }
  return error.message || 'Network error. Please try again later.';
};

export default api;
export { API_BASE_URL };

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  
  // User & Profile
  USER_PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  CHANGE_PASSWORD: '/user/password',
  
  // Financial Data
  ACCOUNTS: '/accounts',
  TRANSACTIONS: '/transactions',
  SPENDING_MONTHLY: '/spending/monthly',
  SPENDING_CATEGORIES: '/spending/categories',
  
  // Settings
  SETTINGS: '/settings',
  NOTIFICATION_PREFERENCES: '/settings/notifications',
  CONNECTED_ACCOUNTS: '/settings/connected-accounts'
}; 
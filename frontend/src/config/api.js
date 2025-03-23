/**
 * API Configuration
 * This file contains all API-related configuration for the application.
 * For Netlify/Vercel deployment, we use relative URLs for API endpoints
 */

import axios from 'axios';

// Determine API base URL based on environment
let API_BASE_URL = '/api';

// For local development, we might need to use a different URL
if (import.meta.env.DEV) {
  // If running frontend on different port than backend in development
  API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  console.log('DEV mode - Using API endpoint:', API_BASE_URL);
}

// In production, always use '/api' which will be handled by Netlify redirects
if (import.meta.env.PROD) {
  // Force using '/api' in production for Netlify redirects to work
  API_BASE_URL = '/api';
  console.log('PROD mode - API endpoint (forced):', API_BASE_URL);
  console.log('NOTE: Ignoring VITE_API_URL in production for consistent routing');
}

// Clean up any potential double slashes or trailing slashes
if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
  console.log('Removed trailing slash from API_BASE_URL:', API_BASE_URL);
}

// Print final API URL for debugging
console.log('Final API_BASE_URL:', API_BASE_URL);

// Check what location we're running at
console.log('Current window location:', typeof window !== 'undefined' ? window.location.href : 'SSR');
console.log('API requests will go to base:', API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add a timeout to prevent hanging requests
  timeout: 15000,
});

// Interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the full URL being requested (helpful for debugging)
    // Make sure there's a slash between baseURL and url
    if (config.baseURL && config.url && !config.url.startsWith('/') && !config.baseURL.endsWith('/')) {
      console.log('Adding slash between baseURL and url to ensure proper path formation');
      config.url = '/' + config.url;
    }
    
    const fullUrl = config.baseURL 
      ? `${config.baseURL}${config.url}` 
      : config.url;
    
    console.log(`API Request: ${config.method?.toUpperCase() || 'GET'} ${fullUrl}`);
    
    // The previous code that removed leading slashes was causing the issue
    // Now we ensure proper formatting instead of removing slashes
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log detailed error information
    console.error('API Error:', error);
    
    if (error.response) {
      console.error(`API Error ${error.response.status}: ${error.response.statusText}`);
      
      // If the response is HTML and not JSON (like a 404 page), log a clearer message
      if (error.response.headers['content-type']?.includes('text/html')) {
        console.error('API Error: Received HTML instead of JSON - likely a 404 or routing issue');
        console.error('This usually means the API endpoint is not found or not correctly configured');
        console.error('Check the .env file and Netlify redirects configuration');
      }
    } else if (error.request) {
      console.error('API Error: No response received');
      console.error('This could be a CORS issue or the server is not running');
    } else {
      console.error('API Error: Request setup failed');
    }
    
    return Promise.reject(error);
  }
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

// Default export
export default api;

// Named exports
export { API_BASE_URL };

// API Endpoints - ensure these have the correct format with leading slashes
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
  
  // Plaid Integration
  PLAID_CREATE_LINK_TOKEN: '/plaid/create-link-token',
  PLAID_EXCHANGE_PUBLIC_TOKEN: '/plaid/exchange-public-token',
  PLAID_ACCOUNTS: '/plaid/accounts',
  PLAID_TRANSACTIONS: '/plaid/transactions',
  
  // Settings
  SETTINGS: '/settings',
  NOTIFICATION_PREFERENCES: '/settings/notifications'
}; 
/**
 * Debug Utility Functions
 * Helper functions for debugging the application in development mode
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * Checks if the backend server is reachable
 * @returns {Promise<Object>} Result of the check
 */
export const checkBackendConnection = async () => {
  try {
    console.log('Checking backend connection at:', API_BASE_URL);
    
    // First try the health check endpoint
    const response = await axios.get(`${API_BASE_URL}/health-check`, { timeout: 5000 });
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      message: 'Backend connection successful'
    };
  } catch (error) {
    console.error('Backend connection check failed:', error);
    
    // If the health check fails, try the base API URL
    try {
      const baseResponse = await axios.get(API_BASE_URL.replace('/api', ''), { timeout: 5000 });
      
      return {
        success: false,
        status: baseResponse.status,
        message: 'Health check failed, but server is reachable',
        error: error.message
      };
    } catch (baseError) {
      return {
        success: false,
        message: 'Backend server is unreachable',
        error: error.message,
        baseError: baseError.message
      };
    }
  }
};

/**
 * Test the authentication flow
 * @param {string} token JWT token
 * @returns {Promise<Object>} Result of the test
 */
export const testAuthentication = async (token) => {
  try {
    console.log('Testing authentication with token:', token ? token.substring(0, 15) + '...' : 'none');
    
    if (!token) {
      return {
        success: false,
        message: 'No authentication token available'
      };
    }
    
    const response = await axios.get(`${API_BASE_URL}/auth/check`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 5000
    });
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      message: 'Authentication successful'
    };
  } catch (error) {
    console.error('Authentication test failed:', error);
    
    return {
      success: false,
      message: 'Authentication test failed',
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    };
  }
};

/**
 * Log development mode status and mock data usage
 */
export const logDevModeStatus = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const prodOrDev = isDev ? 'Development' : 'Production';
  
  console.log(`
✨ Application Mode: ${prodOrDev} ✨
${isDev ? '🧪 Using mock data for API responses when backend is unavailable' : '🔒 Using real API data only'}
API Base URL: ${API_BASE_URL}
  `);
  
  return {
    mode: prodOrDev,
    usingMockData: isDev,
    apiBaseUrl: API_BASE_URL
  };
};

/**
 * Run a comprehensive diagnostics check
 * @param {string} token JWT token
 * @returns {Promise<Object>} Diagnostic results
 */
export const runDiagnostics = async (token) => {
  console.log('Running application diagnostics...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mockDataEnabled: process.env.NODE_ENV === 'development',
    apiBaseUrl: API_BASE_URL,
    tests: {}
  };
  
  // Log development mode status
  results.devModeStatus = logDevModeStatus();
  
  // Check backend connection
  results.tests.backendConnection = await checkBackendConnection();
  
  // Test authentication if token is available
  if (token) {
    results.tests.authentication = await testAuthentication(token);
  } else {
    results.tests.authentication = {
      success: false,
      message: 'No authentication token available - skipping authentication test'
    };
  }
  
  // Summary
  results.summary = {
    allTestsPassed: Object.values(results.tests).every(test => test.success),
    failedTests: Object.keys(results.tests).filter(key => !results.tests[key].success)
  };
  
  console.log('Diagnostics complete:', results);
  return results;
};

// Auto-run diagnostics in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode detected - logging system status');
  logDevModeStatus();
}

export default {
  checkBackendConnection,
  testAuthentication,
  logDevModeStatus,
  runDiagnostics
}; 
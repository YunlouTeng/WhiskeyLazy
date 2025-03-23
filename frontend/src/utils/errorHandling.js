/**
 * Utility functions for error handling throughout the application
 */

/**
 * Handles API errors in a consistent way
 * @param {Error} error - The error object from axios or other API calls
 * @returns {Object} Standardized error response object
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Get response data if available
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
    message: error.message || 'Network error. Please check your connection and try again.'
  };
};

/**
 * Extracts a user-friendly error message from different error formats
 * @param {Error|Object} error - The error object (can be axios error, API response, or simple Error)
 * @returns {string} A user-friendly error message
 */
export const extractErrorMessage = (error) => {
  // Handle API errors
  if (error.response && error.response.data) {
    return error.response.data.message || 'An unexpected server error occurred';
  }
  
  // Handle standard errors
  if (error.message) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Default message
  return 'An unexpected error occurred';
};

/**
 * Logs errors to console with additional context
 * @param {string} context - Where the error occurred (component/function name)
 * @param {Error} error - The error object
 */
export const logError = (context, error) => {
  console.error(`Error in ${context}:`, error);
  
  if (process.env.NODE_ENV === 'development') {
    // In development mode, provide more detailed logs
    console.debug('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
  }
};

/**
 * Creates a standardized error for consistent handling
 * @param {string} message - User-friendly error message
 * @param {string} code - Error code for programmatic handling
 * @param {any} details - Additional error details
 * @returns {Object} Standardized error object
 */
export const createError = (message, code = 'UNKNOWN_ERROR', details = null) => {
  return {
    success: false,
    message,
    code,
    details,
    timestamp: new Date().toISOString()
  };
}; 
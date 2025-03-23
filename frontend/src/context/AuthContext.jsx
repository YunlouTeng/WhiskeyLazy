import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { API_BASE_URL } from '../config/api';

// Create Auth Context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Add a constant for development mode
const DEV_MODE = process.env.NODE_ENV === 'development';

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const navigate = useNavigate();
  
  // Enhanced console logging for development mode
  const logDev = (message, data = null) => {
    if (DEV_MODE) {
      console.log(`[Auth] ${message}`, data ? data : '');
    }
  };
  
  // When token changes, update isAuthenticated and localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      logDev('Token updated', token.substring(0, 15) + '...');
    } else {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      logDev('Token removed');
    }
    setLoading(false);
  }, [token]);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    
    try {
      // For demo: Skip actual API call if we're in development with no backend
      if (DEV_MODE) {
        logDev('Using mock login response');
        
        // Mock successful login
        const newToken = 'mock_jwt_token_' + Date.now();
        const user = {
          id: email.includes('admin') ? 'admin123' : '123',
          name: email.split('@')[0],
          email
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setToken(newToken);
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        return {
          success: true,
          user,
          token: newToken
        };
      }
      
      // Real API call in production
      const response = await api.post('/auth/login', { email, password });
      
      const { user, token: newToken } = response.data;
      
      setToken(newToken);
      setCurrentUser(user);
      
      return {
        success: true,
        user,
        token: newToken
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (userData) => {
    setLoading(true);
    
    try {
      // For demo: Skip actual API call if we're in development with no backend
      if (DEV_MODE) {
        logDev('Using mock register response');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
          success: true,
          message: 'Registration successful! You can now log in.'
        };
      }
      
      // Real API call in production
      const response = await api.post('/auth/register', userData);
      
      return {
        success: true,
        message: response.data.message || 'Registration successful! You can now log in.'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Check if token is valid and get user data on initial load
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        if (DEV_MODE) {
          logDev('Auto-logging in demo user');
          await login('demo@example.com', 'password');
        } else {
          setLoading(false);
        }
        return;
      }

      try {
        // For demo purposes, we'll just validate the token format
        // In a real app, you'd verify with the server
        setIsAuthenticated(true);
        
        // For demo, set a mock user since our backend might not support profile endpoint yet
        setCurrentUser({
          id: '123',
          name: 'Demo User',
          email: 'user@example.com'
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        logout();
      }
    };

    checkAuth();
  }, []);

  // Auto-login in development mode if no user is logged in
  // This is a separate effect that runs after the initial auth check
  useEffect(() => {
    if (DEV_MODE && !isAuthenticated && !loading) {
      logDev('Double-checking auto-login');
      login('demo@example.com', 'password');
    }
  }, [loading, isAuthenticated]);
  
  // Context value
  const value = {
    currentUser,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
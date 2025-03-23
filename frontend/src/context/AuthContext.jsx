import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  
  // Enhanced console logging for development mode
  const logDev = (message, data = null) => {
    if (DEV_MODE) {
      console.log(`[Auth] ${message}`, data ? data : '');
    }
  };
  
  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session) {
          setCurrentUser(session.user);
          setToken(session.access_token);
          setIsAuthenticated(true);
          logDev('User is authenticated', session.user.email);
        } else {
          setCurrentUser(null);
          setToken(null);
          setIsAuthenticated(false);
          logDev('No active session found');
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setCurrentUser(null);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCurrentUser(session.user);
        setToken(session.access_token);
        setIsAuthenticated(true);
        logDev('Auth state changed - authenticated', session.user.email);
      } else {
        setCurrentUser(null);
        setToken(null);
        setIsAuthenticated(false);
        logDev('Auth state changed - unauthenticated');
      }
      setLoading(false);
    });

    // Clean up subscription
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      const { user, session } = data;
      
      setCurrentUser(user);
      setToken(session.access_token);
      setIsAuthenticated(true);
      
      return {
        success: true,
        user,
        token: session.access_token
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Login failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.name
          },
          emailRedirectTo: window.location.origin + '/dashboard',
          // Skip email confirmation
          emailConfirm: false
        }
      });

      if (error) {
        throw error;
      }

      const { user, session } = data;
      
      if (session) {
        // User is automatically signed in if email confirmation is disabled
        setCurrentUser(user);
        setToken(session.access_token);
        setIsAuthenticated(true);
      }
      
      return {
        success: true,
        user,
        token: session?.access_token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.message || 'Registration failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      setCurrentUser(null);
      setToken(null);
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Provide the auth context to children
  return (
    <AuthContext.Provider 
      value={{
        currentUser,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 
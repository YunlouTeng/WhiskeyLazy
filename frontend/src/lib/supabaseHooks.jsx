// Custom hooks for working with Supabase in React
import { useState, useEffect, createContext, useContext } from 'react';
import supabase from './supabase';

// Create an auth context
const SupabaseAuthContext = createContext(null);

/**
 * Supabase Auth Provider Component
 * Provides authentication state and methods to all child components
 */
export function SupabaseAuthProvider({ children }) {
  const auth = useSupabaseAuth();
  
  return (
    <SupabaseAuthContext.Provider value={auth}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

/**
 * Hook to use the Supabase Auth Context
 */
export function useSupabaseAuthContext() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuthContext must be used within a SupabaseAuthProvider');
  }
  return context;
}

/**
 * Hook for managing user authentication state
 * @returns {Object} Authentication state and functions
 */
export function useSupabaseAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get current session
    const getCurrentUser = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session?.user) {
          setUser(session.user);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error getting current user:', err);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Clean up subscription
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Sign in with email
  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error signing in:', err);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email
  const signUp = async (email, password, metadata = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: window.location.origin + '/dashboard',
          // Set to false to skip email confirmation
          emailConfirm: false
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error signing up:', err);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (err) {
      setError(err.message);
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user
  };
}

/**
 * Hook for fetching user's accounts from Supabase
 * @returns {Object} Account data, loading state, and error
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .order('institution_name', { ascending: true });

        if (error) {
          throw error;
        }

        setAccounts(data || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching accounts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  return { accounts, loading, error };
}

/**
 * Hook for fetching user's transactions from Supabase
 * @param {Object} filters - Query filters for transactions
 * @returns {Object} Transaction data, loading state, and error
 */
export function useTransactions(filters = {}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        // Apply filters
        if (filters.accountId) {
          query = query.eq('account_id', filters.accountId);
        }
        
        if (filters.startDate) {
          query = query.gte('date', filters.startDate);
        }
        
        if (filters.endDate) {
          query = query.lte('date', filters.endDate);
        }
        
        if (filters.category) {
          query = query.eq('category', filters.category);
        }

        // Limit results
        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setTransactions(data || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filters.accountId, filters.startDate, filters.endDate, filters.category, filters.limit]);

  return { transactions, loading, error };
}

/**
 * Hook for managing Plaid tokens in Supabase
 * @returns {Object} Functions for managing Plaid tokens
 */
export function usePlaidTokens() {
  // Store a new Plaid token securely
  const storeToken = async (accessToken, itemId, institutionName) => {
    try {
      const { data, error } = await supabase
        .from('plaid_tokens')
        .insert([
          { 
            access_token: accessToken,
            item_id: itemId,
            institution_name: institutionName
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      return { success: true, tokenId: data?.[0]?.id };
    } catch (err) {
      console.error('Error storing Plaid token:', err);
      return { success: false, error: err.message };
    }
  };

  // Get Plaid token by item ID
  const getTokenByItemId = async (itemId) => {
    try {
      const { data, error } = await supabase
        .from('plaid_tokens')
        .select('*')
        .eq('item_id', itemId)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, token: data };
    } catch (err) {
      console.error('Error getting Plaid token:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete a Plaid token
  const deleteToken = async (tokenId) => {
    try {
      const { error } = await supabase
        .from('plaid_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting Plaid token:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    storeToken,
    getTokenByItemId,
    deleteToken
  };
} 
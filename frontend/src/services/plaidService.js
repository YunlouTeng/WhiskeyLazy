/**
 * Plaid API Service
 * Handles interactions with Plaid API through backend endpoints
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { handleApiError } from '../utils/errorHandling';

// Flag to control mock data usage in development
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

// Helper function to generate mock data
const generateMockData = () => {
  console.log('DEV MODE: Generating mock data for development');
  const mockAccounts = [
    {
      id: 'mock-account-1',
      account_id: 'mock-account-1',
      name: 'Mock Checking',
      mask: '1234',
      type: 'depository',
      subtype: 'checking',
      balance: 1250.45,
      institution_name: 'Mock Bank',
      balances: {
        available: 1200.00,
        current: 1250.45,
        limit: null,
        iso_currency_code: 'USD'
      }
    },
    {
      id: 'mock-account-2',
      account_id: 'mock-account-2',
      name: 'Mock Savings',
      mask: '5678',
      type: 'depository',
      subtype: 'savings',
      balance: 5432.10,
      institution_name: 'Mock Bank',
      balances: {
        available: 5432.10,
        current: 5432.10,
        limit: null,
        iso_currency_code: 'USD'
      }
    },
    {
      id: 'mock-account-3',
      account_id: 'mock-account-3',
      name: 'Mock Credit Card',
      mask: '9012',
      type: 'credit',
      subtype: 'credit card',
      balance: -450.75,
      institution_name: 'Mock Credit Union',
      balances: {
        available: 3549.25,
        current: -450.75,
        limit: 4000.00,
        iso_currency_code: 'USD'
      }
    }
  ];

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  
  const mockTransactions = [
    {
      id: 'mock-tx-1',
      transaction_id: 'mock-tx-1',
      account_id: 'mock-account-1',
      account_name: 'Mock Checking',
      amount: -75.50,
      date: today,
      description: 'Grocery Store',
      name: 'Whole Foods',
      category: 'Food',
      category_id: '13005000',
      pending: false,
      merchant_name: 'Whole Foods',
      institution_name: 'Mock Bank'
    },
    {
      id: 'mock-tx-2',
      transaction_id: 'mock-tx-2',
      account_id: 'mock-account-1',
      account_name: 'Mock Checking',
      amount: -12.99,
      date: yesterday,
      description: 'Coffee Shop',
      name: 'Starbucks',
      category: 'Dining',
      category_id: '13005043',
      pending: false,
      merchant_name: 'Starbucks',
      institution_name: 'Mock Bank'
    },
    {
      id: 'mock-tx-3',
      transaction_id: 'mock-tx-3',
      account_id: 'mock-account-2',
      account_name: 'Mock Savings',
      amount: 1000.00,
      date: lastWeek,
      description: 'Deposit',
      name: 'Transfer',
      category: 'Income',
      category_id: '21001000',
      pending: false,
      merchant_name: 'Transfer',
      institution_name: 'Mock Bank'
    },
    {
      id: 'mock-tx-4',
      transaction_id: 'mock-tx-4',
      account_id: 'mock-account-3',
      account_name: 'Mock Credit Card',
      amount: -120.35,
      date: yesterday,
      description: 'Online Shopping',
      name: 'Amazon',
      category: 'Shopping',
      category_id: '19013000',
      pending: true,
      merchant_name: 'Amazon',
      institution_name: 'Mock Credit Union'
    },
    {
      id: 'mock-tx-5',
      transaction_id: 'mock-tx-5',
      account_id: 'mock-account-1',
      account_name: 'Mock Checking',
      amount: -45.00,
      date: today,
      description: 'Uber Ride',
      name: 'Uber',
      category: 'Transportation',
      category_id: '17000000',
      pending: false,
      merchant_name: 'Uber',
      institution_name: 'Mock Bank'
    },
    {
      id: 'mock-tx-6',
      transaction_id: 'mock-tx-6',
      account_id: 'mock-account-1',
      account_name: 'Mock Checking',
      amount: -89.99,
      date: lastWeek,
      description: 'Internet Bill',
      name: 'Comcast',
      category: 'Utilities',
      category_id: '16000000',
      pending: false,
      merchant_name: 'Comcast',
      institution_name: 'Mock Bank'
    },
    {
      id: 'mock-tx-7',
      transaction_id: 'mock-tx-7',
      account_id: 'mock-account-1',
      account_name: 'Mock Checking',
      amount: 2500.00,
      date: lastWeek,
      description: 'Payroll',
      name: 'COMPANY PAYROLL',
      category: 'Income',
      category_id: '21001000',
      pending: false,
      merchant_name: 'Employer',
      institution_name: 'Mock Bank'
    },
    {
      id: 'mock-tx-8',
      transaction_id: 'mock-tx-8',
      account_id: 'mock-account-3',
      account_name: 'Mock Credit Card',
      amount: -35.50,
      date: today,
      description: 'Restaurant',
      name: 'Local Cafe',
      category: 'Dining',
      category_id: '13005000',
      pending: true,
      merchant_name: 'Local Cafe',
      institution_name: 'Mock Credit Union'
    }
  ];

  return {
    accounts: mockAccounts,
    transactions: mockTransactions
  };
};

// Cache for mock data
const mockDataCache = generateMockData();

/**
 * Extracts a user-friendly error message from an error object
 * @param {Error} error - The error object
 * @returns {string} - A user-friendly error message
 */
const extractErrorMessage = (error) => {
  if (!error) return "An unknown error occurred";
  
  // If it's an axios error with a response
  if (error.response) {
    // Get the error message from the response data
    if (error.response.data?.message) {
      return error.response.data.message;
    }
    if (error.response.data?.error) {
      return error.response.data.error;
    }
    // Otherwise, use the status text
    return `${error.response.status}: ${error.response.statusText}`;
  }
  
  // If it's a network error
  if (error.request) {
    return "Network error - no response received";
  }
  
  // For any other type of error
  return error.message || "An unexpected error occurred";
};

// Debug helper to log data in development mode only
const logData = (message, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PlaidService] ${message}:`, data);
  }
};

/**
 * Get a link token from the server
 * @param {string} token - JWT auth token
 * @returns {Promise<{success: boolean, linkToken?: string, error?: string}>}
 */
export const createLinkToken = async (token) => {
  try {
    console.log("Creating Plaid link token...");
    
    const response = await axios.post(
      `${API_BASE_URL}/plaid/create-link-token`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    logData("LINK TOKEN RESPONSE", response.data);
    
    if (!response.data?.link_token) {
      console.error("Missing link token in response:", response.data);
      return {
        success: false,
        message: "Link token not found in server response"
      };
    }
    
    return {
      success: true,
      linkToken: response.data.link_token
    };
  } catch (error) {
    console.error('Error creating link token:', error);
    handleApiError(error);
    
    return {
      success: false,
      message: extractErrorMessage(error) || "Failed to create link token"
    };
  }
};

/**
 * Exchange public token for access token
 * @param {string} token - JWT auth token
 * @param {string} publicToken - Plaid public token from Link
 * @param {object} metadata - Metadata from Plaid Link
 * @returns {Promise<{success: boolean, accounts?: Array, error?: string}>}
 */
export const exchangePublicToken = async (token, publicToken, metadata) => {
  try {
    console.log("Exchanging public token with metadata:", metadata);
    
    const response = await axios.post(
      `${API_BASE_URL}/plaid/exchange-public-token`,
      {
        public_token: publicToken,
        institution: metadata?.institution,
        accounts: metadata?.accounts
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    logData("EXCHANGE TOKEN RESPONSE", response.data);
    
    // Ensure accounts data has the correct format expected by Dashboard
    let accounts = response.data;
    
    // If the response structure is { accounts: [...] }, extract just the accounts array
    if (accounts && typeof accounts === 'object' && Array.isArray(accounts.accounts)) {
      accounts = accounts.accounts;
    }
    
    // Validate the accounts data
    if (!Array.isArray(accounts)) {
      console.error("Accounts data is not an array:", accounts);
      
      // If in development, create some mock data for testing
      if (process.env.NODE_ENV === 'development') {
        console.log("Using mock account data for development");
        accounts = [
          {
            id: 'mock-account-1',
            account_id: 'mock-account-1',
            name: 'Mock Checking',
            mask: '1234',
            type: 'depository',
            subtype: 'checking',
            balance: 1250.45,
            institution: metadata?.institution?.name || 'Mock Bank',
            institution_name: metadata?.institution?.name || 'Mock Bank'
          }
        ];
      } else {
        return {
          success: false,
          message: "Invalid account data received from server"
        };
      }
    }
    
    // Transform accounts to match expected format
    const transformedAccounts = accounts.map(account => {
      // Ensure each account has required fields for the Dashboard
      return {
        id: account.id || account.account_id || `account-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        account_id: account.account_id || account.id || `account-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        name: account.name || 'Account',
        mask: account.mask || '****',
        type: account.type || 'Unknown',
        subtype: account.subtype || '',
        balance: typeof account.balance === 'number' ? account.balance : 
                 (account.balances?.current !== undefined ? account.balances.current : 0),
        institution: account.institution || account.institution_name || metadata?.institution?.name || 'Bank Account',
        institution_name: account.institution_name || account.institution || metadata?.institution?.name || 'Bank Account',
        // Handle various balance formats
        balances: account.balances || {
          available: typeof account.available === 'number' ? account.available : 
                    (account.balances?.available !== undefined ? account.balances.available : 0),
          current: typeof account.balance === 'number' ? account.balance : 
                  (account.balances?.current !== undefined ? account.balances.current : 0),
          limit: account.balances?.limit || null,
          iso_currency_code: account.balances?.iso_currency_code || 'USD'
        }
      };
    });
    
    logData("TRANSFORMED ACCOUNTS", transformedAccounts);
    
    return {
      success: true,
      accounts: transformedAccounts
    };
  } catch (error) {
    console.error("Error exchanging public token:", error);
    handleApiError(error);
    
    return {
      success: false,
      message: extractErrorMessage(error) || "Failed to exchange public token"
    };
  }
};

/**
 * Fetch accounts for the current user
 * @param {string} token - JWT auth token
 * @returns {Promise<{success: boolean, accounts?: Array, error?: string}>}
 */
export const getAccounts = async (token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/plaid/accounts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    logData("GET ACCOUNTS RESPONSE", response.data);
    
    // Validate accounts data
    let accounts = response.data;
    
    // If the response structure is { accounts: [...] }, extract just the accounts array
    if (accounts && typeof accounts === 'object' && Array.isArray(accounts.accounts)) {
      accounts = accounts.accounts;
    }
    
    if (!Array.isArray(accounts)) {
      console.error("Accounts data is not an array:", accounts);
      
      // In development mode, return mock data to help debug UI issues
      if (USE_MOCK_DATA) {
        console.log("Returning mock account data for development");
        return {
          success: true,
          accounts: mockDataCache.accounts
        };
      }
      
      return {
        success: false,
        message: "Invalid account data received from server"
      };
    }
    
    // Transform accounts to match the format expected by Dashboard component
    const transformedAccounts = accounts.map(account => {
      return {
        id: account.id || account.account_id || `account-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        account_id: account.account_id || account.id || `account-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        name: account.name || 'Account',
        mask: account.mask || '****',
        type: account.type || 'Unknown',
        subtype: account.subtype || '',
        balance: typeof account.balance === 'number' ? account.balance : 
                 (account.balances?.current !== undefined ? account.balances.current : 0),
        institution: account.institution || account.institution_name || 'Bank Account',
        institution_name: account.institution_name || account.institution || 'Bank Account',
        // Handle various balance formats
        balances: account.balances || {
          available: typeof account.available === 'number' ? account.available : 
                    (account.balances?.available !== undefined ? account.balances.available : 0),
          current: typeof account.balance === 'number' ? account.balance : 
                  (account.balances?.current !== undefined ? account.balances.current : 0),
          limit: account.balances?.limit || null,
          iso_currency_code: account.balances?.iso_currency_code || 'USD'
        }
      };
    });
    
    logData("TRANSFORMED ACCOUNTS", transformedAccounts);
    
    return {
      success: true,
      accounts: transformedAccounts
    };
  } catch (error) {
    console.error("Error fetching accounts:", error);
    handleApiError(error);
    
    // In development mode, return mock data to help debug UI issues
    if (USE_MOCK_DATA) {
      console.log("Returning mock account data for development");
      return {
        success: true,
        accounts: mockDataCache.accounts
      };
    }
    
    return {
      success: false,
      message: extractErrorMessage(error) || "Failed to fetch accounts"
    };
  }
};

/**
 * Fetch transactions for the current user
 * @param {string} token - JWT auth token
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, transactions?: Array, error?: string}>}
 */
export const getTransactions = async (token, startDate, endDate) => {
  try {
    console.log("Fetching transactions with date range:", { startDate, endDate });
    
    const response = await axios.get(
      `${API_BASE_URL}/plaid/transactions`,
      {
        params: {
          start_date: startDate,
          end_date: endDate
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    logData("GET TRANSACTIONS RESPONSE", response.data);
    
    // Validate transactions data
    let transactions = response.data;
    
    // If the response structure is { transactions: [...] }, extract just the transactions array
    if (transactions && typeof transactions === 'object' && Array.isArray(transactions.transactions)) {
      transactions = transactions.transactions;
    }
    
    if (!Array.isArray(transactions)) {
      console.error("Transactions data is not an array:", transactions);
      
      // In development mode, return mock data to help debug UI issues
      if (USE_MOCK_DATA) {
        console.log("Returning mock transaction data for development");
        return {
          success: true,
          transactions: mockDataCache.transactions
        };
      }
      
      return {
        success: false,
        message: "Invalid transaction data received from server"
      };
    }
    
    // Transform transactions to match the format expected by Transactions component
    const transformedTransactions = transactions.map(transaction => {
      // Make sure we have a unique ID for each transaction
      const id = transaction.id || transaction.transaction_id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Handle Plaid's amount convention - ensure expenses are negative and income is positive
      // (Our UI expects expenses to be negative for visualization)
      let amount = transaction.amount;
      
      // Some Plaid implementations might return positive values for expenses
      // Normalize based on transaction_type if available
      if (transaction.transaction_type === 'debit' && amount > 0) {
        amount = -amount;
      } else if (transaction.transaction_type === 'credit' && amount < 0) {
        amount = Math.abs(amount);
      }
      
      return {
        id,
        transaction_id: transaction.transaction_id || id,
        account_id: transaction.account_id || '',
        account_name: transaction.account_name || 'Account',
        amount,
        date: transaction.date || new Date().toISOString().split('T')[0],
        description: transaction.description || transaction.name || 'Transaction',
        name: transaction.name || transaction.description || 'Transaction',
        category: Array.isArray(transaction.category) ? transaction.category[0] : (transaction.category || 'Other'),
        category_id: transaction.category_id || '',
        pending: Boolean(transaction.pending),
        merchant_name: transaction.merchant_name || '',
        institution_name: transaction.institution_name || transaction.institution || 'Bank'
      };
    });
    
    // Sort transactions by date (newest first)
    transformedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    logData("TRANSFORMED TRANSACTIONS", transformedTransactions);
    
    return {
      success: true,
      transactions: transformedTransactions
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    handleApiError(error);
    
    // In development mode, return mock data to help debug UI issues
    if (USE_MOCK_DATA) {
      console.log("Returning mock transaction data after error for development");
      return {
        success: true,
        transactions: mockDataCache.transactions
      };
    }
    
    return {
      success: false,
      message: extractErrorMessage(error) || "Failed to fetch transactions"
    };
  }
};

/**
 * Remove a connected account
 * @param {string} token - JWT auth token
 * @param {string} accountId - Plaid account ID to remove
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeAccount = async (token, accountId) => {
  try {
    console.log(`Removing account: ${accountId}`);
    
    const response = await axios.delete(
      `${API_BASE_URL}/plaid/accounts/${accountId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    logData("REMOVE ACCOUNT RESPONSE", response.data);
    
    return {
      success: true,
      message: "Account successfully removed"
    };
  } catch (error) {
    console.error("Error removing account:", error);
    handleApiError(error);
    
    return {
      success: false,
      message: extractErrorMessage(error) || "Failed to remove account"
    };
  }
};

// Add a debug function to help troubleshoot
export const debugPlaidService = async (token) => {
  try {
    console.log("Running plaidService diagnostics...");
    
    const accountsResult = await getAccounts(token);
    logData("Debug - Accounts Result", accountsResult);
    
    let transactions = [];
    if (accountsResult.success) {
      // Only try to get transactions if we have accounts
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
      
      const transactionsResult = await getTransactions(token, startDate, endDate);
      logData("Debug - Transactions Result", transactionsResult);
      
      if (transactionsResult.success) {
        transactions = transactionsResult.transactions;
      }
    }
    
    return {
      accounts: accountsResult.success ? accountsResult.accounts : [],
      transactions,
      success: true,
      messages: {
        accounts: accountsResult.message,
        transactions: accountsResult.message
      }
    };
  } catch (error) {
    console.error("Debug error:", error);
    return {
      success: false,
      accounts: [],
      transactions: [],
      error: extractErrorMessage(error) || "Error during plaidService diagnostics"
    };
  }
}; 
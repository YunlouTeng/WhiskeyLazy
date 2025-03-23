// Use dynamic imports to avoid Netlify bundling issues
let Configuration, PlaidApi, PlaidEnvironments, jwt;

// Wrapped in try/catch to help debug any loading issues
try {
  const plaid = require('plaid');
  Configuration = plaid.Configuration;
  PlaidApi = plaid.PlaidApi;
  PlaidEnvironments = plaid.PlaidEnvironments;
  
  jwt = require('jsonwebtoken');
  
  console.log('Transactions.js: Successfully imported plaid and jsonwebtoken packages');
} catch (error) {
  console.error('Transactions.js: Error importing dependencies:', error);
  // Fallback empty implementations to avoid crashes
  Configuration = class {};
  PlaidApi = class {};
  PlaidEnvironments = { sandbox: 'https://sandbox.plaid.com' };
  jwt = {
    verify: () => { return null; },
    sign: () => { return 'mock-token'; }
  };
}

// Initialize Plaid client
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);

// In-memory storage for demo purposes (in production, this would be a database)
// Map of user IDs to their Plaid items (access tokens)
const userItemsMap = {};

// Verify JWT token
const verifyToken = (token) => {
  try {
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return null;
  }
};

// Get user ID from authorization header
const getUserFromHeader = (event) => {
  const authHeader = event.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = verifyToken(token);
  return user ? user.sub || user.id || 'dev-user-' + Date.now() : null;
};

// Helper function to store an access token for a user
exports.storeAccessToken = (userId, accessToken, itemId) => {
  if (!userItemsMap[userId]) {
    userItemsMap[userId] = [];
  }
  // Check if this token is already stored
  if (!userItemsMap[userId].includes(accessToken)) {
    userItemsMap[userId].push(accessToken);
    console.log(`Stored access token for user ${userId}, item ${itemId}`);
  }
};

// Function to get access tokens for a user
exports.getAccessTokensForUser = async (userId) => {
  console.log(`Getting access tokens for user ${userId}`);
  
  // In a production environment, you would query your database here
  // For this demo, we'll check our in-memory map and return tokens if available
  
  const accessTokens = userItemsMap[userId] || [];
  
  // If no tokens found and we're in development, provide a mock token
  if (accessTokens.length === 0 && process.env.NODE_ENV !== 'production') {
    console.log('No stored tokens found for user, using mock access token in development');
    // Return a mock token that will be rejected by Plaid but useful for testing
    return ['access-sandbox-mock-token'];
  }
  
  return accessTokens;
};

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' }),
    };
  }

  try {
    const userId = getUserFromHeader(event) || 'dev-user';
    console.log(`Transactions requested for user: ${userId}`);

    // For demo/development purposes, return mock transactions
    // In production, you would get this from your database or Plaid
    const mockTransactions = [
      {
        id: 'tx_1',
        account_id: 'acc_1',
        amount: -75.21,
        date: '2025-03-15',
        name: 'Grocery Store',
        category: 'Food & Dining',
        pending: false,
        merchant_name: 'Whole Foods Market',
        payment_channel: 'in store',
        currency: 'USD'
      },
      {
        id: 'tx_2',
        account_id: 'acc_1',
        amount: -32.50,
        date: '2025-03-14',
        name: 'Restaurant Payment',
        category: 'Food & Dining',
        pending: false,
        merchant_name: 'Chipotle',
        payment_channel: 'in store',
        currency: 'USD'
      },
      {
        id: 'tx_3',
        account_id: 'acc_2',
        amount: 1250.00,
        date: '2025-03-10',
        name: 'Payroll Deposit',
        category: 'Income',
        pending: false,
        merchant_name: 'Employer',
        payment_channel: 'other',
        currency: 'USD'
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        transactions: mockTransactions
      }),
    };
  } catch (error) {
    console.error('Error in transactions function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message,
      }),
    };
  }
}; 
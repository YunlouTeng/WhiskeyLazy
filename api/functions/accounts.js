// Use dynamic imports to avoid Netlify bundling issues
let plaid, jwt;

// Wrapped in try/catch to help debug any loading issues
try {
  plaid = require('plaid');
  jwt = require('jsonwebtoken');
  console.log('Accounts.js: Successfully imported plaid and jsonwebtoken packages');
} catch (error) {
  console.error('Accounts.js: Error importing dependencies:', error);
  // Create mock implementations
  plaid = {
    Configuration: class {},
    PlaidApi: class {
      constructor() {
        // Add mock methods
        this.linkTokenCreate = async () => ({ 
          data: { link_token: 'mock-link-token-' + Date.now() } 
        });
        this.itemPublicTokenExchange = async () => ({
          data: { access_token: 'mock-access-token', item_id: 'mock-item-id' }
        });
        this.accountsGet = async () => ({
          data: { 
            accounts: [],
            item: { institution_id: 'mock-institution' }
          }
        });
        this.transactionsGet = async () => ({
          data: { transactions: [] }
        });
      }
    },
    PlaidEnvironments: { sandbox: 'https://sandbox.plaid.com' }
  };
  
  jwt = {
    verify: () => { return null; },
    sign: () => { return 'mock-token'; }
  };
}

// Get classes and constants from the plaid module
const { Configuration, PlaidApi, PlaidEnvironments } = plaid;

// Initialize Plaid client
let plaidClient;
try {
  const plaidConfig = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });

  plaidClient = new PlaidApi(plaidConfig);
  console.log('Accounts.js: Successfully initialized Plaid client');
} catch (error) {
  console.error('Accounts.js: Error initializing Plaid client:', error);
  // Use mock client as fallback
  plaidClient = new plaid.PlaidApi();
  console.log('Accounts.js: Using mock Plaid client as fallback');
}

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
    console.log(`Accounts requested for user: ${userId}`);

    // For demo/development purposes, return mock accounts
    // In production, you would get this from your database or Plaid
    const mockAccounts = [
      {
        id: 'acc_1',
        account_id: 'acc_1',
        name: 'Checking Account',
        mask: '1234',
        type: 'depository',
        subtype: 'checking',
        balance: 1250.45,
        institution: 'Chase',
        institution_name: 'Chase',
        balances: {
          available: 1250.45,
          current: 1250.45,
          limit: null,
          iso_currency_code: 'USD'
        }
      },
      {
        id: 'acc_2',
        account_id: 'acc_2',
        name: 'Savings Account',
        mask: '5678',
        type: 'depository',
        subtype: 'savings',
        balance: 8750.22,
        institution: 'Chase',
        institution_name: 'Chase',
        balances: {
          available: 8750.22,
          current: 8750.22,
          limit: null,
          iso_currency_code: 'USD'
        }
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        accounts: mockAccounts
      }),
    };
  } catch (error) {
    console.error('Error in accounts function:', error);
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
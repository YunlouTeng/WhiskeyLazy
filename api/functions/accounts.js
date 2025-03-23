const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const jwt = require('jsonwebtoken');

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
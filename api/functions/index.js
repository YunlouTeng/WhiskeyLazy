const accounts = require('./accounts.js');
const transactions = require('./transactions.js');

// Use dynamic imports to avoid Netlify bundling issues
// We'll require these packages at runtime instead of bundling them
let plaid, jwt;

// Wrapped in try/catch to help debug any loading issues
try {
  plaid = require('plaid');
  jwt = require('jsonwebtoken');
  console.log('Successfully imported plaid and jsonwebtoken packages');
} catch (error) {
  console.error('Error importing dependencies:', error);
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

// JWT Secret for authentication
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Use proper environment variables with fallbacks for different naming conventions
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || process.env.VITE_PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET || process.env.VITE_PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || process.env.VITE_PLAID_ENV || 'sandbox';

// Initialize Plaid client
let plaidClient;
try {
  const plaidConfig = new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
    },
  });

  plaidClient = new PlaidApi(plaidConfig);
  console.log('Successfully initialized Plaid client');
} catch (error) {
  console.error('Error initializing Plaid client:', error);
  // Use mock client as fallback
  plaidClient = new plaid.PlaidApi();
  console.log('Using mock Plaid client as fallback');
}

// Verify JWT token middleware
const verifyToken = (authHeader) => {
  if (!authHeader) {
    return { error: 'Authorization header missing', status: 401 };
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return { error: 'Token missing', status: 401 };
  }
  
  // Accept mock tokens in development mode
  if (process.env.NODE_ENV !== 'production' && token.startsWith('mock_jwt_token_')) {
    console.log('DEV MODE: Accepting mock token');
    // Extract a user ID from the token or use a default one
    const mockUserId = token.split('_').pop() || '123';
    return { user: { id: mockUserId, email: 'dev@example.com' } };
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { user: decoded };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
};

// Enable CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Handler for create-link-token
const handleCreateLinkToken = async (event) => {
  console.log('Handling Plaid create-link-token request');
  console.log('Request headers:', JSON.stringify(event.headers));
  console.log('Request path:', event.path);
  console.log('Request HTTP method:', event.httpMethod);
  console.log('Request body:', event.body);
  
  // Log Plaid configuration (without sensitive details)
  console.log('Plaid configuration used for this request:');
  console.log(`- PLAID_ENV: ${process.env.PLAID_ENV || 'sandbox'}`);
  console.log(`- PLAID_CLIENT_ID: configured (${process.env.PLAID_CLIENT_ID ? process.env.PLAID_CLIENT_ID.substring(0, 8) + '...' : 'not set'})`);
  console.log(`- PLAID_SECRET: configured (length: ${process.env.PLAID_SECRET ? process.env.PLAID_SECRET.length : 0})`);
  
  try {
    // Extract user information from request if available
    let userId;
    
    // Parse the request body if it exists
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
        console.log('Parsed request body:', body);
      } catch (e) {
        console.error('Error parsing request body:', e);
        console.log('Raw body:', event.body);
      }
    }
    
    // Try to get userId from body first
    userId = body.userId;
    console.log('User ID from request body:', userId);
    
    // If no userId in body, try from auth token
    if (!userId && event.headers && event.headers.authorization) {
      const authResult = verifyToken(event.headers.authorization);
      if (authResult.user) {
        userId = authResult.user.id;
        console.log('User ID from authorization token:', userId);
      }
    }
    
    // If still no userId, generate a unique ID
    if (!userId) {
      userId = 'dev-user-' + Date.now();
      console.log('Generated default user ID:', userId);
    }
    
    console.log(`Plaid link token request for user: ${userId}`);
    
    // Create the link token configuration
    const linkTokenConfig = {
      user: {
        client_user_id: userId, // This is the critical field the API requires
      },
      client_name: 'WhiskeyLazy Finance',
      products: ['auth', 'transactions'],
      language: 'en',
      country_codes: ['US'],
    };
    
    console.log('Link token request:', JSON.stringify(linkTokenConfig));
    console.log('Calling Plaid API to create link token...');
    
    // Create the link token with Plaid
    const createTokenResponse = await plaidClient.linkTokenCreate(linkTokenConfig);
    
    console.log('Link token created successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        link_token: createTokenResponse.data.link_token
      }),
    };
  } catch (error) {
    console.error('Error creating link token:', error);
    // Log more detailed error information
    console.error('Plaid API error details:');
    console.error(`- Error name: ${error.name}`);
    console.error(`- Error message: ${error.message}`);
    
    // If it's an API response error, log additional details
    if (error.response) {
      console.error(`- Status code: ${error.response.status}`);
      console.error(`- Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Error creating link token',
        error: error.message,
        details: error.response?.data
      }),
    };
  }
};

// Handler for exchange-public-token
const handleExchangePublicToken = async (event) => {
  console.log('Handling Plaid exchange-public-token request');
  console.log('Request headers:', JSON.stringify(event.headers));
  console.log('Request path:', event.path);
  console.log('Request HTTP method:', event.httpMethod);
  
  try {
    // Get user ID from auth header
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Authorization token required'
        }),
      };
    }
    
    // Verify the token
    const tokenResult = verifyToken(authHeader);
    if (tokenResult.error) {
      return {
        statusCode: tokenResult.status,
        headers,
        body: JSON.stringify({
          success: false,
          message: tokenResult.error
        }),
      };
    }
    
    const userId = tokenResult.user.id;
    console.log('User authorized:', userId);
    
    // Parse the request body
    const body = JSON.parse(event.body);
    const publicToken = body.public_token;
    const metadata = body.metadata || {};
    
    console.log('Request body parsed:', { 
      publicToken: publicToken ? '✓ Present' : '✗ Missing',
      metadata: Object.keys(metadata).length > 0 ? `✓ Present (${Object.keys(metadata).length} keys)` : '✗ Empty'
    });
    
    if (!publicToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Missing public_token in request body'
        }),
      };
    }
    
    console.log('Exchanging public token for access token...');
    
    // Exchange the public token for an access token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken
    });
    
    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;
    
    console.log('Public token exchanged successfully');
    console.log('Item ID:', itemId);
    
    // Store the access token for this user
    if (typeof transactions.storeAccessToken === 'function') {
      transactions.storeAccessToken(userId, accessToken, itemId);
      console.log('Access token stored for user:', userId);
    } else {
      console.warn('transactions.storeAccessToken function not available');
    }
    
    // Get account information
    console.log('Retrieving account information...');
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken
    });
    
    const accounts = accountsResponse.data.accounts;
    
    console.log('Retrieved account information successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        access_token: accessToken,
        item_id: itemId,
        accounts: accounts
      }),
    };
  } catch (error) {
    console.error('Error exchanging public token:', error);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Plaid API error response:', error.response.data);
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Error exchanging public token',
        error: error.message
      }),
    };
  }
};

// Handler for Plaid accounts
const handlePlaidAccounts = async (event) => {
  console.log('Handling Plaid accounts request');
  console.log('Request headers:', JSON.stringify(event.headers));
  console.log('Request path:', event.path);
  console.log('Request HTTP method:', event.httpMethod);
  
  try {
    // Get token from header
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Authorization token required'
        }),
      };
    }
    
    // For demo/development purposes, return mock accounts
    if (process.env.NODE_ENV !== 'production' || authHeader.includes('mock_jwt_token')) {
      console.log('Using mock account data for development');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          accounts: [
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
          ]
        }),
      };
    }
    
    // In a real implementation, you would use Plaid to fetch actual accounts
    // This would require storing access tokens securely and associating them with users
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        accounts: []
      }),
    };
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Error fetching accounts',
        error: error.message
      }),
    };
  }
};

// Handler for Plaid transactions
const handlePlaidTransactions = async (event) => {
  console.log('Handling Plaid transactions request');
  console.log('Request headers:', JSON.stringify(event.headers));
  console.log('Request path:', event.path);
  console.log('Request HTTP method:', event.httpMethod);
  
  try {
    // Get token from header
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Authorization token required'
        }),
      };
    }
    
    // For demo/development purposes, return mock transactions
    if (process.env.NODE_ENV !== 'production' || authHeader.includes('mock_jwt_token')) {
      console.log('Using mock transaction data for development');
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          transactions: [
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
              date: yesterday,
              description: 'Deposit',
              name: 'Transfer',
              category: 'Income',
              category_id: '21001000',
              pending: false,
              merchant_name: 'Transfer',
              institution_name: 'Mock Bank'
            }
          ]
        }),
      };
    }
    
    // In production, use the actual Plaid API to fetch transactions
    console.log('Using real Plaid API to fetch transactions');
    
    // Verify user token
    const tokenResult = verifyToken(authHeader);
    if (tokenResult.error) {
      return {
        statusCode: tokenResult.status,
        headers,
        body: JSON.stringify({
          success: false,
          message: tokenResult.error
        }),
      };
    }
    
    const userId = tokenResult.user.id;
    console.log('Fetching transactions for user:', userId);
    
    // Get date range from query parameters
    let { start_date, end_date } = event.queryStringParameters || {};
    
    // Default to last 30 days if no dates provided
    const endDate = end_date || new Date().toISOString().slice(0, 10);
    
    // If start_date is provided, use it; otherwise default to 6 months ago
    let startDate;
    if (start_date) {
      startDate = start_date;
      console.log('Using provided start date:', startDate);
    } else {
      // Default to 6 months ago
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      startDate = sixMonthsAgo.toISOString().slice(0, 10);
      console.log('Using default 6-month start date:', startDate);
    }
    
    // Get user's Plaid items (access tokens)
    // In a real app, you would retrieve this from your database
    // For this example, we'll use the transactions module if it has a getAccessTokens function
    let userAccessTokens = [];
    
    if (typeof transactions.getAccessTokensForUser === 'function') {
      userAccessTokens = await transactions.getAccessTokensForUser(userId);
    } else {
      // Fallback implementation - in a real app this would be your database query
      // This is just a placeholder
      console.log('No getAccessTokensForUser function available, please implement this');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Not implemented: access token retrieval for user'
        }),
      };
    }
    
    if (!userAccessTokens || userAccessTokens.length === 0) {
      console.log('No access tokens found for user:', userId);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'No linked bank accounts found'
        }),
      };
    }
    
    // Fetch transactions from all user's accounts
    const allTransactions = [];
    
    for (const accessToken of userAccessTokens) {
      try {
        const request = {
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
        };
        
        console.log('Calling Plaid API with date range:', { startDate, endDate });
        const response = await plaidClient.transactionsGet(request);
        const plaidTransactions = response.data.transactions;
        
        // Get account details for this item
        const accountsResponse = await plaidClient.accountsGet({
          access_token: accessToken
        });
        
        const accounts = accountsResponse.data.accounts;
        const item = accountsResponse.data.item;
        
        // Create a lookup by account ID
        const accountsById = {};
        for (const account of accounts) {
          accountsById[account.account_id] = account;
        }
        
        // Transform transactions to match frontend expected format
        const transformedTransactions = plaidTransactions.map(transaction => {
          const account = accountsById[transaction.account_id] || {};
          
          // Plaid convention: positive values are outflows, negative are inflows
          // Our frontend wants: negative values for expenses, positive for income
          const amount = transaction.amount * -1;
          
          return {
            id: transaction.transaction_id,
            transaction_id: transaction.transaction_id,
            account_id: transaction.account_id,
            account_name: account.name || 'Account',
            amount: amount,
            date: transaction.date,
            description: transaction.name,
            name: transaction.name,
            category: Array.isArray(transaction.category) && transaction.category.length > 0 
              ? transaction.category[0] : 'Other',
            category_id: transaction.category_id || '',
            pending: Boolean(transaction.pending),
            merchant_name: transaction.merchant_name || '',
            institution_name: item.institution_id || 'Bank'
          };
        });
        
        allTransactions.push(...transformedTransactions);
      } catch (error) {
        console.error('Error fetching transactions for access token:', error);
        // Continue with other access tokens even if one fails
      }
    }
    
    // Sort transactions by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`Returning ${allTransactions.length} transactions for user ${userId}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        transactions: allTransactions
      }),
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Error fetching transactions',
        error: error.message
      }),
    };
  }
};

// Add a health check handler
const handleHealthCheck = async (event) => {
  console.log('Handling health check request');
  console.log('Request headers:', JSON.stringify(event.headers));
  console.log('Request path:', event.path);
  console.log('Request HTTP method:', event.httpMethod);
  
  // Return information about the environment to help debugging
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV || 'not set',
        plaidEnv: PLAID_ENV,
        debug: process.env.DEBUG || 'false',
        // Add other non-sensitive environment details that might help with debugging
        hasPlaidClientId: {
          direct: !!process.env.PLAID_CLIENT_ID,
          vite: !!process.env.VITE_PLAID_CLIENT_ID,
          resolved: !!PLAID_CLIENT_ID
        },
        hasPlaidSecret: {
          direct: !!process.env.PLAID_SECRET,
          vite: !!process.env.VITE_PLAID_SECRET,
          resolved: !!PLAID_SECRET
        },
        deployUrl: process.env.DEPLOY_URL || 'not set',
        functionName: process.env.FUNCTION_NAME || 'not set',
      },
      requestInfo: {
        path: event.path,
        method: event.httpMethod,
        queryParams: Object.keys(event.queryStringParameters || {}),
        hasAuthHeader: !!(event.headers && event.headers.authorization),
        headers: Object.keys(event.headers || {}),
        source: event.headers && event.headers['client-ip'] || 'unknown'
      }
    }),
  };
};

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Debug environment
  console.log('ENVIRONMENT DUMP (non-sensitive):');
  console.log('Node ENV:', process.env.NODE_ENV);
  console.log('Plaid ENV:', PLAID_ENV);
  console.log('Function Name:', process.env.FUNCTION_NAME || 'not set');
  console.log('Debug Mode:', process.env.DEBUG || 'false');
  console.log('Has PLAID_CLIENT_ID (direct):', !!process.env.PLAID_CLIENT_ID);
  console.log('Has VITE_PLAID_CLIENT_ID:', !!process.env.VITE_PLAID_CLIENT_ID);
  console.log('Final resolved PLAID_CLIENT_ID exists:', !!PLAID_CLIENT_ID);
  console.log('Has PLAID_SECRET (direct):', !!process.env.PLAID_SECRET);
  console.log('Has VITE_PLAID_SECRET:', !!process.env.VITE_PLAID_SECRET);
  console.log('Final resolved PLAID_SECRET exists:', !!PLAID_SECRET);
  
  // Debug all available environment variables (keys only)
  console.log('Available env vars:', Object.keys(process.env).sort().join(', '));

  // Extensive logging for all requests
  console.log('🔍 REQUEST INFO:');
  console.log(`📌 Path: ${event.path}`);
  console.log(`📌 HTTP Method: ${event.httpMethod}`);
  console.log(`📌 Query Parameters: ${JSON.stringify(event.queryStringParameters)}`);
  console.log(`📌 Headers: ${JSON.stringify(event.headers)}`);
  console.log(`📌 Body Present: ${!!event.body}`);
  console.log(`📌 Body Content (first 100 chars): ${event.body ? event.body.substring(0, 100) : 'none'}`);
  console.log(`📌 Raw URL:`, event.rawUrl || 'not available');
  console.log(`📌 Path Parameters:`, JSON.stringify(event.pathParameters || {}));

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' }),
    };
  }

  // Extract the path from the URL
  console.log('Full event path:', event.path);
  console.log('Event body:', event.body);
  console.log('Event HTTP method:', event.httpMethod);
  console.log('Event headers:', JSON.stringify(event.headers));
  
  // Clean up the path for better matching
  let cleanPath = event.path;
  
  // Handle paths from various sources:
  // 1. /.netlify/functions/index
  // 2. /api/plaid/create-link-token (from redirects)
  // 3. /plaid/create-link-token (direct paths)
  
  console.log('Path before cleaning:', cleanPath);
  
  // Remove /.netlify/functions/index if present
  if (cleanPath.includes('/.netlify/functions/')) {
    cleanPath = cleanPath.split('/.netlify/functions/')[1] || '';
    console.log('Path after removing netlify function prefix:', cleanPath);
    
    // If the result is just 'index', we need to check for special cases
    if (cleanPath === 'index') {
      // Case 1: If we have a path parameter, extract it
      if (event.pathParameters && event.pathParameters.proxy) {
        cleanPath = event.pathParameters.proxy;
        console.log('Path extracted from pathParameters.proxy:', cleanPath);
      }
      // Case 2: Extract from the original URL if it contains /api/
      else if (event.rawUrl && event.rawUrl.includes('/api/')) {
        cleanPath = event.rawUrl.split('/api/')[1];
        console.log('Path extracted from rawUrl after /api/:', cleanPath);
      }
      // Case 3: Check if we have a proper path in the query parameters (Netlify sometimes puts it here)
      else if (event.queryStringParameters && event.queryStringParameters.path) {
        cleanPath = event.queryStringParameters.path;
        console.log('Path extracted from queryStringParameters.path:', cleanPath);
      }
      // Case 4: Check if this is a Plaid API direct request
      else {
        // If we're here, we need to handle direct requests to the index function
        // Check if the request has a specific target in the body
        try {
          if (event.body) {
            const body = JSON.parse(event.body);
            if (body && body.target) {
              cleanPath = body.target;
              console.log('Path extracted from request body target:', cleanPath);
            } else {
              // Default to plaid/create-link-token for POST requests as that's the most common case
              if (event.httpMethod === 'POST') {
                cleanPath = 'plaid/create-link-token';
                console.log('Default path for POST to index with no path: plaid/create-link-token');
              }
            }
          }
        } catch (e) {
          console.error('Error parsing body while trying to extract path:', e);
        }
      }
    }
  }
  // Handle '/api/' prefix from redirects
  else if (cleanPath.includes('/api/')) {
    cleanPath = cleanPath.split('/api/')[1] || '';
    console.log('Path after removing /api/ prefix:', cleanPath);
  }
  
  // Remove leading slash if present
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
    console.log('Path after removing leading slash:', cleanPath);
  }
  
  console.log('Final cleaned path for routing:', cleanPath);
  
  // Extract components for better routing
  const pathSegments = cleanPath.split('/');
  console.log('Path segments:', pathSegments);
  
  // Additional logging for debugging path issues
  console.log(`API Request: ${event.httpMethod} ${event.path} (cleaned: ${cleanPath}, segments: ${pathSegments.join(', ')})`);
  
  try {
    // Handle health check with high priority
    if (cleanPath === 'health' || cleanPath === 'health-check') {
      console.log('Routing to health check handler');
      return handleHealthCheck(event);
    }
    
    // If we have no clean path but this is a POST to the index endpoint, default to plaid/create-link-token
    if (!cleanPath && event.httpMethod === 'POST' && event.path.endsWith('index')) {
      console.log('POST to index with no path - defaulting to plaid/create-link-token');
      cleanPath = 'plaid/create-link-token';
    }
    
    // More flexible path matching for Plaid endpoints
    const isPlaidPath = cleanPath.includes('plaid/') || (pathSegments.length >= 2 && pathSegments[0] === 'plaid');
    
    // Get the specific Plaid endpoint if this is a Plaid request
    let plaidEndpoint = '';
    if (isPlaidPath) {
      if (cleanPath.startsWith('plaid/')) {
        plaidEndpoint = cleanPath.substring(6); // Remove 'plaid/'
      } else if (pathSegments.length >= 2) {
        plaidEndpoint = pathSegments[1];
      }
      console.log('Detected Plaid endpoint:', plaidEndpoint);
    }
    
    // Route to appropriate handler based on path
    if (cleanPath === 'accounts' || cleanPath === 'api/accounts') {
      console.log('Routing to accounts handler');
      return accounts.handler(event, context);
    } 
    else if (cleanPath === 'transactions' || cleanPath === 'api/transactions') {
      console.log('Routing to transactions handler');
      return handlePlaidTransactions(event);
    }
    // Plaid endpoints with more flexible matching
    else if (isPlaidPath) {
      if (plaidEndpoint === 'create-link-token') {
        console.log('Routing to createLinkToken handler (inline)');
        return handleCreateLinkToken(event);
      } 
      else if (plaidEndpoint === 'exchange-public-token') {
        console.log('Routing to exchangePublicToken handler (inline)');
        return handleExchangePublicToken(event);
      }
      else if (plaidEndpoint === 'accounts') {
        console.log('Routing to Plaid accounts handler (inline)');
        return handlePlaidAccounts(event);
      }
      else if (plaidEndpoint === 'transactions') {
        console.log('Routing to Plaid transactions handler (inline)');
        return handlePlaidTransactions(event);
      }
      else {
        console.log(`Generic Plaid request for: ${plaidEndpoint}`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: `Received request for ${cleanPath}`,
            endpointType: 'plaid',
            path: cleanPath
          }),
        };
      }
    }
    else {
      console.log(`No matching route for: ${cleanPath}`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false,
          message: `Endpoint not found: ${cleanPath}`,
          requestPath: event.path,
          cleanedPath: cleanPath,
          pathSegments: pathSegments
        }),
      };
    }
  } catch (error) {
    console.error('Error in route handler:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        message: 'Server error',
        error: error.message,
        path: cleanPath
      }),
    };
  }
}; 
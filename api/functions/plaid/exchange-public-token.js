// Serverless function for Plaid public token exchange
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const jwt = require('jsonwebtoken');

// JWT Secret for authentication
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Verify the token
  const authResult = verifyToken(req.headers.authorization);
  if (authResult.error) {
    return res.status(authResult.status).json({ message: authResult.error });
  }
  
  // Validate request body
  const { public_token, institution, accounts } = req.body;
  
  if (!public_token) {
    return res.status(400).json({ message: 'Missing public_token in request body' });
  }
  
  try {
    const userId = authResult.user.id;
    
    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: public_token
    });
    
    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;
    
    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken
    });
    
    const plaidAccounts = accountsResponse.data.accounts;
    
    // Add accounts to database - in a real application, you would store this in your database
    // Here we're just returning the accounts to the frontend
    const accountsData = plaidAccounts.map(account => ({
      id: account.account_id,
      name: account.name,
      mask: account.mask,
      type: account.type,
      subtype: account.subtype,
      institution_name: institution?.name || 'Unknown Institution',
      balances: {
        available: account.balances.available,
        current: account.balances.current
      }
    }));
    
    return res.status(200).json({
      success: true,
      accounts: accountsData
    });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return res.status(500).json({ 
      success: false,
      message: error.response?.data?.error_message || 'Failed to exchange public token' 
    });
  }
}; 
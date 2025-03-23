// Serverless function for Plaid link token creation
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
  
  try {
    const userId = authResult.user.id;
    
    const request = {
      user: {
        client_user_id: userId,
      },
      client_name: 'Personal Finance App',
      products: ['auth', 'transactions'],
      language: 'en',
      country_codes: ['US'],
    };
    
    const response = await plaidClient.linkTokenCreate(request);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error creating link token:', error);
    return res.status(500).json({ message: 'Failed to create link token' });
  }
}; 
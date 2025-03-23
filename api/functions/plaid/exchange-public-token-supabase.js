// Serverless function for Plaid public token exchange with Supabase integration
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const jwt = require('jsonwebtoken');
const { supabase, storePlaidToken } = require('../../lib/supabase');

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
    
    // Store Plaid token in Supabase
    const institutionName = institution?.name || 'Unknown Institution';
    const tokenResult = await storePlaidToken(userId, accessToken, itemId, institutionName);
    
    if (!tokenResult.success) {
      throw new Error(`Failed to store Plaid token: ${tokenResult.error}`);
    }
    
    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken
    });
    
    const plaidAccounts = accountsResponse.data.accounts;
    
    // Store accounts in Supabase
    for (const account of plaidAccounts) {
      const { data, error } = await supabase
        .from('accounts')
        .insert([
          {
            user_id: userId,
            account_id: account.account_id,
            name: account.name,
            mask: account.mask,
            type: account.type,
            subtype: account.subtype,
            institution_name: institutionName,
            current_balance: account.balances.current || 0,
            available_balance: account.balances.available || 0,
            limit_amount: account.balances.limit || 0,
            plaid_access_token_id: tokenResult.tokenId,
            plaid_account_id: account.account_id
          }
        ]);
      
      if (error) {
        console.error('Error inserting account:', error);
      }
    }
    
    // Return the account data to the frontend
    const accountsData = plaidAccounts.map(account => ({
      id: account.account_id,
      name: account.name,
      mask: account.mask,
      type: account.type,
      subtype: account.subtype,
      institution_name: institutionName,
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
      message: error.response?.data?.error_message || error.message || 'Failed to exchange public token' 
    });
  }
}; 
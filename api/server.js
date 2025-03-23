const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Configuration, PlaidApi, Products, PlaidEnvironments } = require('plaid');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

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

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }
  
  // Accept mock tokens in development mode
  if (process.env.NODE_ENV !== 'production' && token.startsWith('mock_jwt_token_')) {
    console.log('DEV MODE: Accepting mock token');
    // Extract a user ID from the token or use a default one
    const mockUserId = token.split('_').pop() || '123';
    req.user = { id: mockUserId, email: 'dev@example.com' };
    next();
    return;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// In-memory storage for demo (use a database in production)
const users = [];
const userItems = {}; // Map userId -> [itemId]
const items = {}; // Map itemId -> { accessToken, accounts, etc. }

// Auth Routes
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  
  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Check if user already exists
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // Create new user (in a real app, hash the password)
  const userId = Date.now().toString();
  const user = {
    id: userId,
    email,
    password, // Never store plaintext passwords in production
    name: email.split('@')[0],
    createdAt: new Date().toISOString()
  };
  
  users.push(user);
  userItems[userId] = [];
  
  return res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Find user
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Return user info and token (exclude password)
  const { password: _, ...userWithoutPassword } = user;
  return res.status(200).json({
    user: userWithoutPassword,
    token
  });
});

// Plaid Routes
app.post('/api/plaid/create-link-token', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
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
    return res.json(response.data);
  } catch (error) {
    console.error('Error creating link token:', error);
    return res.status(500).json({ message: 'Failed to create link token' });
  }
});

app.post('/api/plaid/exchange-public-token', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { public_token, metadata } = req.body;
    
    console.log('Exchange public token metadata:', metadata);
    
    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token
    });
    
    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;
    
    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken
    });
    
    const accounts = accountsResponse.data.accounts;
    const item = accountsResponse.data.item;
    
    // Store in our "database"
    items[itemId] = {
      id: itemId,
      accessToken,
      accounts,
      institutionId: item.institution_id,
      userId,
      institutionName: metadata?.institution?.name || 'Unknown Institution'
    };
    
    if (!userItems[userId]) {
      userItems[userId] = [];
    }
    userItems[userId].push(itemId);
    
    // Get institution name
    let institutionName = metadata?.institution?.name || 'Unknown Institution';
    
    // Add institution name to accounts and properly format data
    const formattedAccounts = accounts.map(account => ({
      id: account.account_id,
      account_id: account.account_id,
      name: account.name || 'Account',
      mask: account.mask || '****',
      type: account.type || 'Unknown',
      subtype: account.subtype || '',
      balance: account.balances?.current || 0,
      institution: institutionName,
      institution_name: institutionName,
      balances: {
        available: account.balances?.available || 0,
        current: account.balances?.current || 0,
        limit: account.balances?.limit || null,
        iso_currency_code: account.balances?.iso_currency_code || 'USD'
      }
    }));
    
    console.log('Returning formatted accounts:', formattedAccounts);
    
    // Return an array of formatted accounts
    return res.json(formattedAccounts);
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return res.status(500).json({ message: 'Failed to exchange public token' });
  }
});

app.get('/api/plaid/accounts', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userItemIds = userItems[userId] || [];
    
    // If user has no connected items, return empty array
    if (userItemIds.length === 0) {
      console.log("No connected items for user", userId);
      return res.json([]);
    }
    
    // Collect all accounts from all items
    const allAccounts = [];
    
    for (const itemId of userItemIds) {
      const item = items[itemId];
      if (item) {
        // Get fresh account data
        try {
          const accountsResponse = await plaidClient.accountsGet({
            access_token: item.accessToken
          });
          
          const accounts = accountsResponse.data.accounts;
          
          // Add institution name to accounts and ensure all required fields exist
          const accountsWithInstitution = accounts.map(account => ({
            account_id: account.account_id,
            id: account.account_id, // Add 'id' for frontend compatibility
            name: account.name,
            mask: account.mask,
            official_name: account.official_name,
            type: account.type,
            subtype: account.subtype,
            institution_name: item.institutionName || 'Connected Account',
            balances: {
              available: account.balances.available !== null ? account.balances.available : 0,
              current: account.balances.current !== null ? account.balances.current : 0,
              limit: account.balances.limit,
              iso_currency_code: account.balances.iso_currency_code
            },
            // For frontend compatibility
            balance: account.balances.current !== null ? account.balances.current : 0,
            institution: item.institutionName || 'Connected Account'
          }));
          
          allAccounts.push(...accountsWithInstitution);
        } catch (error) {
          console.error(`Error fetching accounts for item ${itemId}:`, error);
          // Don't fail the whole request if one item fails
        }
      }
    }
    
    console.log(`Returning ${allAccounts.length} accounts for user ${userId}`);
    return res.json(allAccounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return res.status(500).json({ message: 'Failed to fetch accounts' });
  }
});

app.get('/api/plaid/transactions', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;
    
    // Default to last 30 days if no dates provided
    const endDate = end_date || new Date().toISOString().slice(0, 10);
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    const userItemIds = userItems[userId] || [];
    
    // If user has no connected items, return empty array
    if (userItemIds.length === 0) {
      console.log("No connected items for user", userId);
      return res.json([]);
    }
    
    // Collect all transactions from all items
    const allTransactions = [];
    
    for (const itemId of userItemIds) {
      const item = items[itemId];
      if (item) {
        try {
          const request = {
            access_token: item.accessToken,
            start_date: startDate,
            end_date: endDate,
          };
          
          // Get transactions
          const response = await plaidClient.transactionsGet(request);
          const transactions = response.data.transactions;
          
          // Process accounts to create a lookup by ID
          const accountsById = {};
          for (const account of item.accounts) {
            accountsById[account.account_id] = account;
          }
          
          // Add institution name and create unique IDs
          const transactionsWithDetails = transactions.map(transaction => {
            // Find account name from the account_id
            const account = accountsById[transaction.account_id] || {};
            
            // Ensure transaction.amount is negative for expenses and positive for income
            // Plaid convention: positive values are outflows (expenses), negative are inflows (income)
            // Our frontend wants: negative values for expenses, positive for income
            const amount = transaction.amount * -1;
            
            // Get a standardized category
            const categoryString = Array.isArray(transaction.category) && transaction.category.length > 0 
              ? transaction.category[0] 
              : (transaction.category || 'Other');
              
            // Generate a unique ID if not present
            const id = transaction.transaction_id || 
                      `tx-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
            
            return {
              // Basic transaction information
              id: id,
              transaction_id: id,
              name: transaction.name || 'Transaction',
              description: transaction.name || 'Transaction',
              date: transaction.date,
              amount: amount, // Negative for expenses, positive for income
              
              // Account information
              account_id: transaction.account_id,
              account_name: account.name || 'Account',
              
              // Institution information
              institution_name: item.institutionName || 'Connected Account',
              
              // Category information
              category: categoryString,
              category_id: transaction.category_id || '',
              
              // Additional details
              merchant_name: transaction.merchant_name || '',
              pending: Boolean(transaction.pending),
              
              // Original transaction data (optional)
              original: transaction
            };
          });
          
          allTransactions.push(...transactionsWithDetails);
        } catch (error) {
          console.error(`Error fetching transactions for item ${itemId}:`, error);
          // Don't fail the whole request if one item fails
        }
      }
    }
    
    // Sort transactions by date (most recent first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`Returning ${allTransactions.length} transactions for user ${userId}`);
    return res.json(allTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

app.delete('/api/plaid/accounts/:accountId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.accountId;
    
    // This is a simplified version. In a real app, you'd need to:
    // 1. Find which item this account belongs to
    // 2. Remove just this account or the entire item
    // 3. Update the database
    
    // For this demo, we'll just return success
    return res.json({ success: true });
  } catch (error) {
    console.error('Error removing account:', error);
    return res.status(500).json({ message: 'Failed to remove account' });
  }
});

// Financial data endpoints
app.get('/api/accounts', verifyToken, (req, res) => {
  // Redirect to Plaid accounts endpoint
  return res.redirect('/api/plaid/accounts');
});

app.get('/api/transactions', verifyToken, (req, res) => {
  // Redirect to Plaid transactions endpoint
  return res.redirect('/api/plaid/transactions');
});

app.get('/api/spending/monthly', verifyToken, (req, res) => {
  // In a real app, this would calculate monthly spending from transactions
  // For demo, return mock data
  const mockMonthlySpending = [
    { month: 'December', totalSpent: 1245.67 },
    { month: 'January', totalSpent: 1378.42 },
    { month: 'February', totalSpent: 1156.89 },
    { month: 'March', totalSpent: 1489.32 },
    { month: 'April', totalSpent: 1298.76 },
    { month: 'May', totalSpent: 1422.18 }
  ];
  
  return res.json(mockMonthlySpending);
});

// Debug endpoints (only available in development)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/env', (req, res) => {
    // Return sanitized environment info without exposing full credentials
    res.json({
      plaid: {
        client_id_set: !!process.env.PLAID_CLIENT_ID,
        client_id_prefix: process.env.PLAID_CLIENT_ID ? process.env.PLAID_CLIENT_ID.substring(0, 6) + '...' : null,
        secret_set: !!process.env.PLAID_SECRET,
        secret_prefix: process.env.PLAID_SECRET ? process.env.PLAID_SECRET.substring(0, 6) + '...' : null,
        env: process.env.PLAID_ENV || 'Not set'
      },
      server: {
        port: process.env.PORT || '8000 (default)',
        node_env: process.env.NODE_ENV || 'development (default)'
      }
    });
  });

  // Health check endpoint
  app.get('/api/health-check', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
// Serverless function for user login
const jwt = require('jsonwebtoken');

// JWT Secret for authentication
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

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
  
  // Validate request body
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    // For a real app, validate against a database
    // This is a mock implementation for demonstration
    
    // Mock user credentials - in production, you would check against your database
    const validUser = {
      email: 'demo@example.com',
      password: 'password123',
      id: '123',
      name: 'Demo User'
    };
    
    // Simple validation - in production, use proper password hashing
    if (email === validUser.email && password === validUser.password) {
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: validUser.id, 
          email: validUser.email,
          name: validUser.name
        }, 
        JWT_SECRET, 
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: validUser.id,
          email: validUser.email,
          name: validUser.name
        }
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
}; 
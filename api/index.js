// Root API endpoint that returns basic info about the API
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Return API info
  return res.status(200).json({
    name: 'WhiskeyLazy Finance API',
    version: '1.0.0',
    endpoints: {
      auth: ['/api/auth/login'],
      plaid: [
        '/api/plaid/create-link-token',
        '/api/plaid/exchange-public-token'
      ]
    },
    status: 'online'
  });
}; 
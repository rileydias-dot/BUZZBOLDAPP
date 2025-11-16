// Temporary serverless function for login
// This is a demo endpoint until the full backend is deployed

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed'
    });
  }

  try {
    const { email, password } = req.body;

    // Demo credentials for testing
    if (email === 'riley.dias@gmail.com' && password === 'password123') {
      return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: 'demo-user-id',
            email: email,
            role: 'client'
          },
          token: 'demo-jwt-token-' + Date.now()
        }
      });
    }

    // For any other credentials, return error
    return res.status(401).json({
      status: 'error',
      message: 'Invalid credentials. Use demo account: riley.dias@gmail.com / password123'
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

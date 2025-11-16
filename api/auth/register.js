// Temporary serverless function for registration
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
    const { email, password, name, businessName } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters'
      });
    }

    // Create demo user (in production, this would save to database)
    return res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        user: {
          id: 'demo-user-' + Date.now(),
          email: email,
          role: 'client'
        },
        token: 'demo-jwt-token-' + Date.now()
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Registration failed'
    });
  }
};

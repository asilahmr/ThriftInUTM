const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    console.log('\n=== AUTH MIDDLEWARE ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Authorization header:', req.headers.authorization);
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No authorization header');
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Token missing after split');
      return res.status(401).json({ message: 'No token provided' });
    }
    
    console.log('Token (first 30 chars):', token.substring(0, 30) + '...');
    
    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key-change-in-production';
    console.log('Using JWT_SECRET for verification:', jwtSecret);
    
    const decoded = jwt.verify(token, jwtSecret);
    console.log('✓ Token decoded successfully');
    console.log('Decoded payload:', decoded);
    
    req.user = decoded;
    console.log('✓ Auth middleware passed\n');
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    console.error('Error name:', error.name);
    if (error.name === 'JsonWebTokenError') {
      console.error('This usually means JWT_SECRET mismatch!');
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};
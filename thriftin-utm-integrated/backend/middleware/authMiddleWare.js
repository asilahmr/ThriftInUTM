// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DEBUG_LOG = process.env.NODE_ENV !== 'production';

const generateToken = (userId, additionalData = {}) => {
  return jwt.sign({ userId, ...additionalData }, JWT_SECRET, { expiresIn: '7d' });
};

const authenticate = (req, res, next) => {
  try {
    if (DEBUG_LOG) {
      console.log('\n=== AUTH MIDDLEWARE ===');
      console.log('Request URL:', req.originalUrl);
      console.log('Authorization header:', req.headers.authorization);
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      if (DEBUG_LOG) console.log('✗ No authorization header');
      return res.status(401).json({ message: 'Access token required. Please login.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      if (DEBUG_LOG) console.log('✗ Token missing after split');
      return res.status(401).json({ message: 'Access token required. Please login.' });
    }

    if (!JWT_SECRET) {
      console.error('✗ JWT_SECRET not set in environment!');
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.userId;

    if (DEBUG_LOG) {
      console.log('✓ Token decoded successfully');
      console.log('Decoded payload:', decoded);
      console.log('✓ Auth middleware passed\n');
    }

    next();
  } catch (error) {
    if (DEBUG_LOG) {
      console.error('Auth middleware error:', error.message);
      console.error('Error name:', error.name);
      if (error.name === 'JsonWebTokenError') console.error('This usually means JWT_SECRET mismatch!');
    }
    return res.status(403).json({ message: 'Invalid or expired token. Please login again.' });
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.userId = decoded.userId;
    }
    next();
  } catch (error) {
    next();
  }
};

const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const isAdmin = req.user.userType === 'admin' || req.user.role === 'admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    if (DEBUG_LOG) console.log('✓ Admin check passed');
    next();
  } catch (error) {
    console.error('Admin check error:', error.message);
    return res.status(500).json({ message: 'Authorization error.' });
  }
};

const requireVerified = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const isVerified = req.user.is_verified || req.user.email_verified || false;
    if (!isVerified) {
      return res.status(403).json({ message: 'Email verification required. Please verify your UTM email.' });
    }

    next();
  } catch (error) {
    console.error('RequireVerified error:', error.message);
    return res.status(500).json({ message: 'Authorization error.' });
  }
};

module.exports = {
  generateToken,
  authenticate,
  verifyToken: authenticate,
  optionalAuth,
  requireAdmin,
  requireVerified
};
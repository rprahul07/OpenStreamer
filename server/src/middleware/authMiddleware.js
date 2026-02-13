const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    console.log('Auth header:', req.header('Authorization'));
    
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('No Authorization header found');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token found in Authorization header');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    console.log('Verifying token with JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('Token verified successfully for user:', decoded.username);
    console.log('User role:', decoded.academic_role || decoded.role);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;

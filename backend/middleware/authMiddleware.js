const jwt = require('jsonwebtoken');

/**
 * Auth Middleware
 * Reads Bearer token from Authorization header,
 * verifies JWT, and attaches decoded user to req.user.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token has expired.' });
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
  }
};

module.exports = authMiddleware;

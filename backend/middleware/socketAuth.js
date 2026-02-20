import authService from '../services/authService.js';

/**
 * Socket.IO authentication middleware
 * Verifies JWT token from handshake and attaches user to socket
 */
export function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verify token
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    // Get user details
    const user = authService.findUserById(decoded.id);

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user to socket
    socket.user = user;
    
    console.log(`User authenticated: ${user.username} (${user.id})`);
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication failed'));
  }
}

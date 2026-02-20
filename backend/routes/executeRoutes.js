import express from 'express';
import codeExecutor from '../services/codeExecutor.js';
import authService from '../services/authService.js';

const router = express.Router();

/**
 * Middleware to verify JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const decoded = authService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = decoded;
  next();
}

/**
 * POST /api/execute
 * Execute code
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { code, language, stdin } = req.body;

    // Validate input
    if (!code || !language) {
      return res.status(400).json({
        error: 'Code and language are required'
      });
    }

    // Execute code
    const result = await codeExecutor.executeCode(code, language, stdin || '');

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({
      error: error.message || 'Execution failed'
    });
  }
});

export default router;

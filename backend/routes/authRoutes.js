import express from 'express';
import authService from '../services/authService.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Validate input
    if (!email || !password || !username) {
      return res.status(400).json({
        error: 'Email, password, and username are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      });
    }

    // Register user
    const user = await authService.register(email, password, username);

    // Generate token
    const token = authService.generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Login user
    const user = await authService.login(email, password);

    // Generate token
    const token = authService.generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Get current user (requires auth)
 */
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = authService.findUserById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/auth/color
 * Update user color preference
 */
router.put('/color', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { color } = req.body;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!color) {
      return res.status(400).json({ error: 'Color is required' });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const updated = authService.updateUserColor(decoded.id, color);

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Color updated successfully', color });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

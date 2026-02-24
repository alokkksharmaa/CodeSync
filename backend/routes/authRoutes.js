import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { signup, login, deleteUser } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// DELETE /api/auth/:id
router.delete('/:id', authMiddleware, deleteUser);

export default router;

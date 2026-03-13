import express from 'express';
import { executeCode } from '../controllers/executionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Execute code endpoint - requires authentication
router.post('/', authMiddleware, executeCode);

export default router;

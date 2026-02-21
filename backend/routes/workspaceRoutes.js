import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { verifyMembership } from '../middleware/workspaceAuth.js';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  shareWorkspace,
} from '../controllers/workspaceController.js';

const router = express.Router();

// All workspace routes require authentication
router.use(authMiddleware);

// POST /api/workspaces — create a new workspace
router.post('/', createWorkspace);

// GET /api/workspaces — list all workspaces for the logged-in user
router.get('/', getWorkspaces);

// GET /api/workspaces/:id — get workspace details + file list
router.get('/:id', verifyMembership, getWorkspace);

// POST /api/workspaces/:id/share — share with another user (owner only)
router.post('/:id/share', verifyMembership, shareWorkspace);

export default router;

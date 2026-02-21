const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { verifyMembership } = require('../middleware/workspaceAuth');
const {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  shareWorkspace,
} = require('../controllers/workspaceController');

// All workspace routes require authentication
router.use(authMiddleware);

// POST /api/workspaces — create a new workspace
router.post('/', createWorkspace);

// GET /api/workspaces — list all workspaces for the logged-in user
router.get('/', getWorkspaces);

// GET /api/workspaces/:id — get workspace details + file content
router.get('/:id', verifyMembership, getWorkspace);

// POST /api/workspaces/:id/share — share with another user (owner only)
router.post('/:id/share', verifyMembership, shareWorkspace);

module.exports = router;

import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { isOwner, isEditor, roles } from '../middleware/permissionMiddleware.js';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  deleteWorkspace,
  updateWorkspaceSettings,
} from '../controllers/workspaceController.js';
import {
  inviteMember,
  updateMemberRole,
  removeMember
} from '../controllers/memberController.js';
import { transferOwnership } from '../controllers/ownershipController.js';

const router = express.Router();

router.use(authMiddleware);

// ─── Workspace CRUD ───────────────────────────────────────────────────────────
router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.get('/:id', requireRole('viewer'), getWorkspace); 
router.delete('/:id', isOwner, deleteWorkspace);
router.patch('/:id/settings', isOwner, updateWorkspaceSettings);

// ─── Member & Role Management ────────────────────────────────────────────────
// Invite user
router.post('/:id/invite', isOwner, inviteMember);

// Update member role
router.patch('/:id/role', isOwner, updateMemberRole);

// Remove member
router.delete('/:id/member/:userId', isOwner, removeMember);

// Transfer ownership
router.post('/:id/transfer', isOwner, transferOwnership);

export default router;

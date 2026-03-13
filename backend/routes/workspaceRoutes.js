import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { isOwner, isEditor, requireRole, roles } from '../middleware/permissionMiddleware.js';
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
import { leaveSession } from '../controllers/sessionController.js';
import { transferOwnership } from '../controllers/ownershipController.js';
import { getActivities } from '../controllers/activityController.js';

const router = express.Router();

router.use(authMiddleware);

// ─── Workspace CRUD ───────────────────────────────────────────────────────────
router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.get('/:id', requireRole('viewer'), getWorkspace); 
router.get('/:id/activity', requireRole('viewer'), getActivities);
router.delete('/:id', isOwner, deleteWorkspace);
router.patch('/:id/settings', isOwner, updateWorkspaceSettings);
router.delete('/:id/session', leaveSession);

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

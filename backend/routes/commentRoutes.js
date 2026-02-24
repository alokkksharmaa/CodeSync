import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  toggleReaction,
} from '../controllers/commentController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get comments for a workspace
router.get('/workspace/:workspaceId', getComments);

// Create a comment
router.post('/workspace/:workspaceId', createComment);

// Update a comment
router.put('/:commentId', updateComment);

// Delete a comment
router.delete('/:commentId', deleteComment);

// Toggle emoji reaction
router.post('/:commentId/reaction', toggleReaction);

export default router;

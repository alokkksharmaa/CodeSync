import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { verifyMembership } from '../middleware/workspaceAuth.js';
import {
  createFile,
  getFileContent,
  updateFile,
  renameFile,
  deleteFile
} from '../controllers/fileController.js';
import {
  saveVersion,
  getHistory,
  restoreVersion
} from '../controllers/versionController.js';

const router = express.Router();

router.use(authMiddleware);

// File management (workspaceId is needed for permission check)
router.post('/', createFile); // Body contains workspaceId

// Open file
router.get('/open/:id', getFileContent);

// Update file content
router.put('/:id', updateFile);

// Rename/Delete
router.patch('/rename/:id', renameFile);
router.delete('/:id', deleteFile);

// Version history
router.post('/:fileId/version', saveVersion);
router.get('/:fileId/history', getHistory);
router.post('/restore/:versionId', restoreVersion);

export default router;

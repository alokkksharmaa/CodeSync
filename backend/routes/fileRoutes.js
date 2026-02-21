import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { isEditor, requireRole, checkRole } from '../middleware/permissionMiddleware.js';
import { verifyFileAccess } from '../middleware/filePermission.js';
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

// File management (requires Editor or Owner role in the workspace)
// POST uses workspaceId in body
router.post('/', requireRole('editor'), createFile); 

// Open file (Anyone in workspace can read)
router.get('/open/:id', verifyFileAccess, getFileContent);

// Update file content (Editor+)
router.put('/:id', verifyFileAccess, checkRole('editor'), updateFile);

// Rename/Delete (Editor+)
router.patch('/rename/:id', verifyFileAccess, checkRole('editor'), renameFile);
router.delete('/:id', verifyFileAccess, checkRole('editor'), deleteFile);

// Version history
router.post('/:fileId/version', verifyFileAccess, checkRole('editor'), saveVersion);
router.get('/:fileId/history', verifyFileAccess, getHistory);
router.post('/restore/:versionId', verifyFileAccess, checkRole('editor'), restoreVersion);

export default router;

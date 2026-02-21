import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { isEditor } from '../middleware/permissionMiddleware.js';
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

// File management (requires Editor or Owner role)
router.post('/', isEditor, createFile); 

// Open file (Anyone in workspace can read) — we need a verifyMembership for reading
// For now, let's keep it simple or update permissionMiddleware
router.get('/open/:id', getFileContent);

// Update file content (Editor+)
router.put('/:id', isEditor, updateFile);

// Rename/Delete (Editor+)
router.patch('/rename/:id', isEditor, renameFile);
router.delete('/:id', isEditor, deleteFile);

// Version history
router.post('/:fileId/version', isEditor, saveVersion);
router.get('/:fileId/history', getHistory);
router.post('/restore/:versionId', isEditor, restoreVersion);

export default router;

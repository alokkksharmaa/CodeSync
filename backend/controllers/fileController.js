import File from '../models/File.js';
import FileVersion from '../models/FileVersion.js';
import { logActivity } from '../utils/logger.js';

/**
 * Normalize a file/folder name:
 * - trim whitespace
 * - collapse multiple spaces
 * - remove most special characters (keep dots, dashes, underscores)
 */
const normalizeName = (name) => {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w.\-\s]/g, '')
    .replace(/\s/g, '_');
};

/**
 * Normalize a path string
 * Ensures it starts with '/' and has no trailing slash unless root
 */
const normalizePath = (raw) => {
  let p = (raw || '/').trim();
  if (!p.startsWith('/')) p = '/' + p;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
};

// ─── POST /api/files ──────────────────────────────────────────────────────────
export const createFile = async (req, res) => {
  try {
    const { workspaceId, name: rawName, path: rawPath, type = 'file', language } = req.body;

    if (!workspaceId || !rawName) {
      return res.status(400).json({ message: 'Workspace ID and name are required.' });
    }

    const name = normalizeName(rawName);
    const path = normalizePath(rawPath);

    if (!name) {
      return res.status(400).json({ message: 'Name contains only invalid characters.' });
    }

    const nameLower = name.toLowerCase();

    // Explicit duplicate check (before hitting the DB unique constraint)
    const existing = await File.findOne({ workspaceId, path, nameLower }).lean();
    if (existing) {
      console.log('Duplicate found!', { workspaceId, path, nameLower, existing });
      return res.status(409).json({
        message: `A ${existing.type === 'folder' ? 'folder' : 'file'} named "${name}" already exists in this folder.`
      });
    }

    const resolvedLanguage = type === 'folder'
      ? undefined
      : (language || getLanguageFromName(name));

    const file = await File.create({
      workspaceId,
      name,
      nameLower,
      path,
      type,
      language: resolvedLanguage,
      content: '',
      createdBy: req.user.id,
      lastEditedBy: req.user.id,
    });

    // Log activity
    logActivity({
      workspaceId,
      userId: req.user.id,
      actionType: type === 'folder' ? 'FOLDER_CREATED' : 'FILE_CREATED',
      targetId: file._id,
      metadata: { name: file.name, path: file.path, username: req.user.username }
    });

    // Broadcast ONLY after successful DB insert
    const io = req.app.get('io');
    const eventName = type === 'folder' ? 'folder_created' : 'file_created';
    io.to(`workspace:${workspaceId}`).emit(eventName, file.toObject());
    io.to(`workspace:${workspaceId}`).emit('activity_update');

    return res.status(201).json(file.toObject());
  } catch (error) {
    console.error('[createFile error]', error);
    // Fallback for race-condition duplicate (two simultaneous requests)
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A file or folder with this name already exists in this folder.' });
    }
    return res.status(500).json({ message: 'Failed to create file.' });
  }
};

// ─── GET /api/files/open/:id ───────────────────────────────────────────────
export const getFileContent = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).lean();
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }
    return res.status(200).json({ ...file, name: file.name || 'untitled' });
  } catch (error) {
    console.error('[getFileContent error]', error);
    return res.status(500).json({ message: 'Failed to fetch file content.' });
  }
};

// ─── PUT /api/files/:id ──────────────────────────────────────────────────────
export const updateFile = async (req, res) => {
  try {
    const { content } = req.body;
    const file = await File.findByIdAndUpdate(
      req.params.id,
      { content, lastEditedBy: req.user.id },
      { new: true }
    );
    if (!file) return res.status(404).json({ message: 'File not found.' });
    return res.status(200).json(file);
  } catch (error) {
    console.error('[updateFile error]', error);
    return res.status(500).json({ message: 'Failed to update file.' });
  }
};

// ─── PATCH /api/files/rename/:id ─────────────────────────────────────────────
export const renameFile = async (req, res) => {
  try {
    const { name: rawName } = req.body;
    const name = normalizeName(rawName || '');
    if (!name) return res.status(400).json({ message: 'Invalid name.' });

    const nameLower = name.toLowerCase();

    const existing = await File.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'File not found.' });

    // Check duplicate in same path
    const conflict = await File.findOne({
      workspaceId: existing.workspaceId,
      path: existing.path,
      nameLower,
      _id: { $ne: existing._id }
    }).lean();
    if (conflict) {
      return res.status(409).json({ message: `A ${conflict.type} named "${name}" already exists here.` });
    }

    // If renaming a folder, update all children paths
    if (existing.type === 'folder') {
      const oldFolderPath = existing.path === '/'
        ? `/${existing.name}`
        : `${existing.path}/${existing.name}`;
      const newFolderPath = existing.path === '/'
        ? `/${name}`
        : `${existing.path}/${name}`;

      // Update all files whose path starts with the old folder path
      await File.updateMany(
        { workspaceId: existing.workspaceId, path: new RegExp(`^${oldFolderPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) },
        [{ $set: { path: { $replaceAll: { input: '$path', find: oldFolderPath, replacement: newFolderPath } } } }]
      );
    }

    const file = await File.findByIdAndUpdate(
      req.params.id,
      { name, nameLower },
      { new: true }
    );

    logActivity({
      workspaceId: file.workspaceId,
      userId: req.user.id,
      actionType: 'FILE_RENAMED',
      targetId: file._id,
      metadata: { name, username: req.user.username }
    });

    const io = req.app.get('io');
    io.to(`workspace:${file.workspaceId}`).emit('file_renamed', file.toObject());
    io.to(`workspace:${file.workspaceId}`).emit('activity_update');

    return res.status(200).json(file.toObject());
  } catch (error) {
    console.error('[renameFile error]', error);
    return res.status(500).json({ message: 'Failed to rename.' });
  }
};

// ─── DELETE /api/files/:id ───────────────────────────────────────────────────
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).lean();
    if (!file) return res.status(404).json({ message: 'File not found.' });

    let deletedIds = [file._id];

    if (file.type === 'folder') {
      // Compute the folder's full path prefix
      const folderPrefix = file.path === '/'
        ? `/${file.name}`
        : `${file.path}/${file.name}`;

      // Find and delete all children recursively
      const children = await File.find({
        workspaceId: file.workspaceId,
        path: new RegExp(`^${folderPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
      }).lean();

      deletedIds = [file._id, ...children.map(c => c._id)];

      // Delete version history for all file children
      const fileChildIds = children.filter(c => c.type === 'file').map(c => c._id);
      await FileVersion.deleteMany({ fileId: { $in: fileChildIds } });
      await File.deleteMany({ _id: { $in: children.map(c => c._id) } });
    } else {
      await FileVersion.deleteMany({ fileId: file._id });
    }

    await File.findByIdAndDelete(file._id);

    logActivity({
      workspaceId: file.workspaceId,
      userId: req.user.id,
      actionType: file.type === 'folder' ? 'FOLDER_DELETED' : 'FILE_DELETED',
      targetId: file._id,
      metadata: { name: file.name, username: req.user.username }
    });

    const io = req.app.get('io');
    io.to(`workspace:${file.workspaceId}`).emit('file_deleted', {
      fileId: String(file._id),
      deletedIds: deletedIds.map(String),
      type: file.type,
    });
    io.to(`workspace:${file.workspaceId}`).emit('activity_update');

    return res.status(200).json({ message: 'Deleted successfully.', deletedIds: deletedIds.map(String) });
  } catch (error) {
    console.error('[deleteFile error]', error);
    return res.status(500).json({ message: 'Failed to delete.' });
  }
};

// ─── Utilities ─────────────────────────────────────────────────────────────────
const getLanguageFromName = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java',
    cpp: 'cpp', c: 'cpp',
    go: 'go', rs: 'rust',
    html: 'html', css: 'css',
    json: 'json', md: 'markdown'
  };
  return map[ext] || 'javascript';
};

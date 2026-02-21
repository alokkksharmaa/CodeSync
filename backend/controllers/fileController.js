import File from '../models/File.js';
import FileVersion from '../models/FileVersion.js';

// ─── POST /api/files ─────────────────────────────────────────────────────────
export const createFile = async (req, res) => {
  try {
    const { workspaceId, name, path, language } = req.body;

    if (!workspaceId || !name) {
      return res.status(400).json({ message: 'Workspace ID and name are required.' });
    }

    const file = await File.create({
      workspaceId,
      name,
      path: path || '/',
      language: language || 'javascript',
      lastEditedBy: req.user.id,
      content: '', // Initial empty content
    });

    return res.status(201).json(file);
  } catch (error) {
    console.error('[createFile error]', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A file with this name already exists in this path.' });
    }
    return res.status(500).json({ message: 'Failed to create file.' });
  }
};

// ─── GET /api/files/open/:id ───────────────────────────────────────────────
export const getFileContent = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const doc = file.toObject();
    if (!doc.name) doc.name = 'main.js';

    return res.status(200).json(doc);
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

    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    return res.status(200).json(file);
  } catch (error) {
    console.error('[updateFile error]', error);
    return res.status(500).json({ message: 'Failed to update file.' });
  }
};

// ─── PATCH /api/files/rename/:id ────────────────────────────────────────────
export const renameFile = async (req, res) => {
  try {
    const { name } = req.body;

    const file = await File.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );

    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    return res.status(200).json(file);
  } catch (error) {
    console.error('[renameFile error]', error);
    return res.status(500).json({ message: 'Failed to rename file.' });
  }
};

// ─── DELETE /api/files/:id ───────────────────────────────────────────────────
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    // Also delete version history
    await FileVersion.deleteMany({ fileId: req.params.id });

    return res.status(200).json({ message: 'File and history deleted.' });
  } catch (error) {
    console.error('[deleteFile error]', error);
    return res.status(500).json({ message: 'Failed to delete file.' });
  }
};

import FileVersion from '../models/FileVersion.js';
import File from '../models/File.js';

// ─── POST /api/files/:fileId/version ─────────────────────────────────────────
export const saveVersion = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get current content from File doc
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const version = await FileVersion.create({
      fileId,
      content: file.content,
      editedBy: req.user.id,
    });

    return res.status(201).json(version);
  } catch (error) {
    console.error('[saveVersion error]', error);
    return res.status(500).json({ message: 'Failed to save version.' });
  }
};

// ─── GET /api/files/:fileId/history ──────────────────────────────────────────
export const getHistory = async (req, res) => {
  try {
    const { fileId } = req.params;
    const history = await FileVersion.find({ fileId })
      .populate('editedBy', 'username')
      .sort({ createdAt: -1 });

    return res.status(200).json(history);
  } catch (error) {
    console.error('[getHistory error]', error);
    return res.status(500).json({ message: 'Failed to fetch history.' });
  }
};

// ─── POST /api/files/restore/:versionId ──────────────────────────────────────
export const restoreVersion = async (req, res) => {
  try {
    const { versionId } = req.params;

    const version = await FileVersion.findById(versionId);
    if (!version) {
      return res.status(404).json({ message: 'Version not found.' });
    }

    const file = await File.findByIdAndUpdate(
      version.fileId,
      { content: version.content, lastEditedBy: req.user.id },
      { new: true }
    );

    return res.status(200).json({ message: 'Version restored.', file });
  } catch (error) {
    console.error('[restoreVersion error]', error);
    return res.status(500).json({ message: 'Failed to restore version.' });
  }
};

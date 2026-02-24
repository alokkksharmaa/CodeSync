import WorkspaceMember from '../models/WorkspaceMember.js';
import File from '../models/File.js';

/**
 * verifyFileAccess
 * Checks if the user has access to the workspace that owns the file.
 * Attaches req.membership.role.
 */
export const verifyFileAccess = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;
    const actualFileId = id || fileId;

    if (!actualFileId) {
      return res.status(400).json({ message: 'File ID is required.' });
    }

    const file = await File.findById(actualFileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const membership = await WorkspaceMember.findOne({
      workspaceId: file.workspaceId,
      userId: req.user.id,
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied: not a workspace member.' });
    }

    req.membership = { role: membership.role };
    req.workspaceId = file.workspaceId;
    next();
  } catch (error) {
    console.error('[verifyFileAccess error]', error);
    return res.status(500).json({ message: 'Authorization check failed.' });
  }
};

import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import { logActivity } from '../utils/logger.js';

/**
 * transferOwnership
 * POST /api/workspaces/:id/transfer
 * Transfer workspace ownership to another member.
 * Current owner becomes an 'editor'.
 */
export const transferOwnership = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: 'Target User ID is required.' });
    }

    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: 'You already own this workspace.' });
    }

    // 1. Verify target user is a member
    const targetMembership = await WorkspaceMember.findOne({ workspaceId, userId: targetUserId });
    if (!targetMembership) {
      return res.status(404).json({ message: 'Target user is not a member of this workspace.' });
    }

    // 2. Perform transfer in transaction (ideal) or sequentially
    // Change current owner to editor
    await WorkspaceMember.findOneAndUpdate(
      { workspaceId, userId: req.user.id },
      { role: 'editor' }
    );

    // Change target user to owner
    targetMembership.role = 'owner';
    await targetMembership.save();

    // Update Workspace owner ref
    await Workspace.findByIdAndUpdate(workspaceId, { owner: targetUserId });

    logActivity({
      workspaceId,
      userId: req.user.id,
      actionType: 'OWNERSHIP_TRANSFERRED',
      targetId: targetUserId
    });

    return res.status(200).json({ message: 'Ownership transferred successfully.' });
  } catch (error) {
    console.error('[transferOwnership error]', error);
    return res.status(500).json({ message: 'Failed to transfer ownership.' });
  }
};

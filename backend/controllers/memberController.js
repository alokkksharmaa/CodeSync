import User from '../models/User.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Workspace from '../models/Workspace.js';
import { logActivity } from '../utils/logger.js';

/**
 * inviteMember
 * POST /api/workspaces/:id/invite
 * Invite a user by email and assign a role.
 */
export const inviteMember = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const { email, role } = req.body;

    
    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required.' });
    }

    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be editor or viewer.' });
    }

    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot invite yourself.' });
    }

    // Check if already a member
    const existing = await WorkspaceMember.findOne({ workspaceId, userId: targetUser._id });
    if (existing) {
      return res.status(400).json({ message: 'User is already a member of this workspace.' });
    }

    const membership = await WorkspaceMember.create({
      workspaceId,
      userId: targetUser._id,
      role,
      invitedBy: req.user.id
    });

    // Get inviter's username
    const inviter = await User.findById(req.user.id).select('username');

    logActivity({
      workspaceId,
      userId: req.user.id,
      actionType: 'USER_INVITED',
      targetId: targetUser._id,
      metadata: { 
        role, 
        email: targetUser.email,
        username: inviter?.username || 'Unknown',
        invitedUsername: targetUser.username
      }
    });

    // Log that the user joined the workspace
    logActivity({
      workspaceId,
      userId: targetUser._id,
      actionType: 'USER_JOINED',
      targetId: targetUser._id,
      metadata: { username: targetUser.username, role }
    });

    // Notify all clients of activity update
    const io = req.app.get('io');
    if (io) {
      io.to(`workspace:${workspaceId}`).emit('activity_update');
    }

    return res.status(201).json({
      message: `User ${targetUser.username} invited successfully.`,
      member: {
        _id: membership._id,
        userId: targetUser,
        role: membership.role
      }
    });
  } catch (error) {
    console.error('[inviteMember error]', error);
    return res.status(500).json({ message: 'Failed to invite member.' });
  }
};

/**
 * updateMemberRole
 * PATCH /api/workspaces/:id/role
 * Change role of an existing member.
 */
export const updateMemberRole = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and role are required.' });
    }

    if (!['editor', 'viewer', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const membership = await WorkspaceMember.findOne({ workspaceId, userId }).populate('userId', 'username');
    if (!membership) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    if (membership.role === 'owner' && role !== 'owner') {
      return res.status(400).json({ message: 'Cannot demote the owner directly. Use ownership transfer.' });
    }

    const oldRole = membership.role;
    const targetUsername = membership.userId.username;
    membership.role = role;
    await membership.save();

    logActivity({
      workspaceId,
      userId: req.user.id,
      actionType: 'ROLE_CHANGED',
      targetId: userId,
      metadata: { oldRole, newRole: role, targetUsername }
    });

    // Notify user via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`workspace:${workspaceId}`).emit('member_updated', {
        userId,
        role,
        oldRole
      });
      io.to(`workspace:${workspaceId}`).emit('activity_update');
    }

    return res.status(200).json({ message: 'Role updated successfully.' });
  } catch (error) {
    console.error('[updateMemberRole error]', error);
    return res.status(500).json({ message: 'Failed to update role.' });
  }
};

/**
 * removeMember
 * DELETE /api/workspaces/:id/member/:userId
 * Remove a member from the workspace.
 */
export const removeMember = async (req, res) => {
  try {
    const { id: workspaceId, userId } = req.params;

    const membership = await WorkspaceMember.findOne({ workspaceId, userId }).populate('userId', 'username');
    if (!membership) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    if (membership.role === 'owner') {
      return res.status(400).json({ message: 'The owner cannot be removed. Transfer ownership first.' });
    }

    const removedUsername = membership.userId.username;

    await WorkspaceMember.deleteOne({ _id: membership._id });

    logActivity({
      workspaceId,
      userId: req.user.id,
      actionType: 'MEMBER_REMOVED',
      targetId: userId,
      metadata: { removedUsername }
    });

    // Log that the user left the workspace
    logActivity({
      workspaceId,
      userId: userId,
      actionType: 'USER_LEFT',
      targetId: userId,
      metadata: { username: removedUsername }
    });

    // Notify via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`workspace:${workspaceId}`).emit('member_removed', { userId });
      io.to(`workspace:${workspaceId}`).emit('activity_update');
    }

    return res.status(200).json({ message: 'Member removed successfully.' });
  } catch (error) {
    console.error('[removeMember error]', error);
    return res.status(500).json({ message: 'Failed to remove member.' });
  }
};

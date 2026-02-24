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

    logActivity({
      workspaceId,
      userId: req.user.id,
      actionType: 'USER_INVITED',
      targetId: targetUser._id,
      metadata: { role, email: targetUser.email }
    });

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

    const membership = await WorkspaceMember.findOne({ workspaceId, userId });
    if (!membership) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    if (membership.role === 'owner' && role !== 'owner') {
      return res.status(400).json({ message: 'Cannot demote the owner directly. Use ownership transfer.' });
    }

    const oldRole = membership.role;
    membership.role = role;
    await membership.save();

    logActivity({
      workspaceId,
      userId: req.user.id,
      actionType: 'ROLE_CHANGED',
      targetId: userId,
      metadata: { oldRole, newRole: role }
    });

    // Notify user via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`workspace:${workspaceId}`).emit('member_updated', {
        userId,
        role,
        oldRole
      });
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

    const membership = await WorkspaceMember.findOne({ workspaceId, userId });
    if (!membership) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    if (membership.role === 'owner') {
      return res.status(400).json({ message: 'The owner cannot be removed. Transfer ownership first.' });
    }

    await WorkspaceMember.deleteOne({ _id: membership._id });

    logActivity({
      workspaceId,
      userId: req.user.id,
      actionType: 'MEMBER_REMOVED',
      targetId: userId
    });

    // Notify via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`workspace:${workspaceId}`).emit('member_removed', { userId });
    }

    return res.status(200).json({ message: 'Member removed successfully.' });
  } catch (error) {
    console.error('[removeMember error]', error);
    return res.status(500).json({ message: 'Failed to remove member.' });
  }
};

/**
 * joinWorkspace
 * POST /api/workspaces/:id/join
 * Join a workspace via ID (Room ID)
 */
export const joinWorkspace = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user.id;

    // Check if workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found. Invalid Room ID.' });
    }

    // Check if user is already a member
    const existingMembership = await WorkspaceMember.findOne({ workspaceId, userId });
    if (existingMembership) {
      return res.status(400).json({ message: 'You are already a member of this workspace.', workspaceId });
    }

    // Add user as editor (or viewer, depending on desired default)
    const membership = await WorkspaceMember.create({
      workspaceId,
      userId,
      role: 'editor',
    });

    logActivity({
      workspaceId,
      userId,
      actionType: 'USER_JOINED',
      metadata: { method: 'ROOM_ID' }
    });

    // Notify others in room via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`workspace:${workspaceId}`).emit('member_joined', {
        _id: membership._id,
        user: { _id: userId, username: req.user.username, email: req.user.email },
        role: 'editor'
      });
    }

    return res.status(200).json({ 
      message: 'Joined workspace successfully.',
      workspaceId
    });
  } catch (error) {
    console.error('[joinWorkspace error]', error);
    // If it's a CastError (invalid ObjectId format)
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid Room ID format.' });
    }
    return res.status(500).json({ message: 'Failed to join workspace.' });
  }
};

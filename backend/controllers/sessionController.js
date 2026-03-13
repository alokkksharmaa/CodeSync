import WorkspaceMember from '../models/WorkspaceMember.js';
import ActivityLog from '../models/ActivityLog.js';

export const leaveSession = async (req, res) => {
  const { id: workspaceId } = req.params;
  const userId = req.user.id;

  try {
    // Check if user is a member
    const membership = await WorkspaceMember.findOne({ workspaceId, userId });
    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this workspace' });
    }

    // Log the action (User leaving session)
    // In a real system, we might remove them from an "active_sessions" collection
    // Here we just log it and the client will handle the redirection/socket leave.
    
    await ActivityLog.create({
      workspaceId,
      userId,
      actionType: 'USER_LEFT',
      metadata: { username: req.user.username, method: 'manual' }
    });

    // Notify collaborators via socket (the server.js handle will also do this on disconnect, 
    // but this is for intentional "Leave Session" action)
    const io = req.app.get('io');
    io.to(`workspace:${workspaceId}`).emit('activity_update');
    io.to(`workspace:${workspaceId}`).emit('user_left', {
      profileId: userId,
      username: req.user.username
    });

    res.json({ message: 'Successfully left workspace session' });
  } catch (error) {
    console.error('Leave session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

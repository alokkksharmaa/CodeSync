import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import File from '../models/File.js';
import FileVersion from '../models/FileVersion.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const deleteUserCascade = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required for deletion');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const targetUser = await User.findById(userId).session(session).lean();
    if (!targetUser) {
      throw new Error('User not found');
    }

    if (targetUser.role === 'admin' || targetUser.isSystemAdmin) {
      throw new Error('Cannot delete system administrator accounts');
    }

    const ownedWorkspaces = await Workspace.find({ owner: userId }).session(session).lean();
    const ownedWorkspaceIds = ownedWorkspaces.map(ws => ws._id);

    if (ownedWorkspaceIds.length > 0) {
      const filesInOwnedWorkspaces = await File.find({ workspaceId: { $in: ownedWorkspaceIds } }).session(session).lean();
      const fileIds = filesInOwnedWorkspaces.map(f => f._id);

      if (fileIds.length > 0) {
        await FileVersion.deleteMany({ fileId: { $in: fileIds } }, { session });
      }

      await File.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } }, { session });
      await WorkspaceMember.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } }, { session });
      
      await ActivityLog.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } }, { session });

      await Workspace.deleteMany({ _id: { $in: ownedWorkspaceIds } }, { session });
    }

    await WorkspaceMember.deleteMany({ userId }, { session });

    await ActivityLog.deleteMany(
      { 
        $or: [
          { userId },
          { 'metadata.userId': userId },
          { 'metadata.username': targetUser.username }
        ] 
      }, 
      { session }
    );

    await File.updateMany(
      { createdBy: userId },
      { $set: { createdBy: null } },
      { session }
    );
    
    await File.updateMany(
      { lastEditedBy: userId },
      { $set: { lastEditedBy: null } },
      { session }
    );

    await User.findByIdAndDelete(userId, { session });

    await session.commitTransaction();
    session.endSession();

    return { 
      success: true, 
      message: 'User and all associated data successfully deleted',
      deletedWorkspacesCount: ownedWorkspaceIds.length
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

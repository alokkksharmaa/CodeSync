import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'USER_INVITED',
        'ROLE_CHANGED',
        'MEMBER_REMOVED',
        'OWNERSHIP_TRANSFERRED',
        'FILE_CREATED',
        'FILE_DELETED',
        'FILE_RENAMED',
        'WORKSPACE_UPDATED',
        'WORKSPACE_DELETED'
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { 
    timestamps: { createdAt: true, updatedAt: false } 
  }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;

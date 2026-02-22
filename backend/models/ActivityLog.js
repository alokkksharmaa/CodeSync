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
        'USER_JOINED',
        'USER_LEFT',
        'USER_INVITED',
        'ROLE_CHANGED',
        'MEMBER_REMOVED',
        'OWNERSHIP_TRANSFERRED',
        'FILE_CREATED',
        'FILE_DELETED',
        'FILE_RENAMED',
        'FILE_UPDATED',
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

activityLogSchema.index({ workspaceId: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;

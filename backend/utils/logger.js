import ActivityLog from '../models/ActivityLog.js';

/**
 * logActivity
 * Helper to log workspace actions asynchronously.
 * Does not block the main request flow.
 */
export const logActivity = (data) => {
  const { workspaceId, userId, actionType, targetId, metadata } = data;
  
  if (!workspaceId || !userId || !actionType) {
    console.error('[logActivity] Missing required fields:', { workspaceId, userId, actionType });
    return;
  }

  // Create log in background
  ActivityLog.create({
    workspaceId,
    userId,
    actionType,
    targetId,
    metadata: metadata || {}
  }).catch(err => {
    console.error('[logActivity error]', err.message);
  });
};

import api from './api';

/**
 * inviteMember
 * POST /api/workspaces/:id/invite
 */
export const inviteMember = async (workspaceId, data) => {
  const res = await api.post(`/api/workspaces/${workspaceId}/invite`, data);
  return res.data;
};

/**
 * updateMemberRole
 * PATCH /api/workspaces/:id/role
 */
export const updateMemberRole = async (workspaceId, data) => {
  const res = await api.patch(`/api/workspaces/${workspaceId}/role`, data);
  return res.data;
};

/**
 * removeMember
 * DELETE /api/workspaces/:id/member/:userId
 */
export const removeMember = async (workspaceId, userId) => {
  const res = await api.delete(`/api/workspaces/${workspaceId}/member/${userId}`);
  return res.data;
};

/**
 * transferOwnership
 * POST /api/workspaces/:id/transfer
 */
export const transferOwnership = async (workspaceId, targetUserId) => {
  const res = await api.post(`/api/workspaces/${workspaceId}/transfer`, { targetUserId });
  return res.data;
};

/**
 * updateWorkspaceSettings
 * PATCH /api/workspaces/:id/settings
 */
export const updateWorkspaceSettings = async (workspaceId, data) => {
  const res = await api.patch(`/api/workspaces/${workspaceId}/settings`, data);
  return res.data;
};

/**
 * deleteWorkspace
 * DELETE /api/workspaces/:id
 */
export const deleteWorkspace = async (workspaceId) => {
  const res = await api.delete(`/api/workspaces/${workspaceId}`);
  return res.data;
};

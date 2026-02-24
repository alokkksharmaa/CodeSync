import api from './api';

/**
 * Fetch all comments for a workspace
 */
export const fetchComments = async (workspaceId) => {
  const response = await api.get(`/api/comments/workspace/${workspaceId}`);
  return response.data.comments;
};

/**
 * Create a new comment
 */
export const createComment = async (workspaceId, text) => {
  const response = await api.post(`/api/comments/workspace/${workspaceId}`, { text });
  return response.data.comment;
};

/**
 * Update a comment
 */
export const updateComment = async (commentId, text) => {
  const response = await api.put(`/api/comments/${commentId}`, { text });
  return response.data.comment;
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId) => {
  const response = await api.delete(`/api/comments/${commentId}`);
  return response.data;
};

/**
 * Toggle emoji reaction on a comment
 */
export const toggleReaction = async (commentId, emoji) => {
  const response = await api.post(`/api/comments/${commentId}/reaction`, { emoji });
  return response.data.comment;
};

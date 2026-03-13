import api from './api'

/**
 * Create a new workspace.
 * @param {string} name
 * @param {string} language
 */
export const createWorkspace = async (name, language) => {
  const res = await api.post('/api/workspaces', { name, language })
  return res.data
}

/**
 * Fetch all workspaces the current user belongs to (owned + shared).
 * Returns [{ workspace, role, addedAt }]
 */
export const fetchWorkspaces = async () => {
  const res = await api.get('/api/workspaces')
  return res.data
}

/**
 * Fetch a single workspace by ID, including file content and member list.
 * @param {string} id
 */
export const fetchWorkspace = async (id) => {
  const res = await api.get(`/api/workspaces/${id}`)
  return res.data
}

/**
 * Share a workspace with a user by email.
 * @param {string} id  workspaceId
 * @param {string} email
 * @param {'editor'|'viewer'} role
 */
export const shareWorkspace = async (id, email, role) => {
  const res = await api.post(`/api/workspaces/${id}/share`, { email, role })
  return res.data
}

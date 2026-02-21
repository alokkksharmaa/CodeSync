import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { shareWorkspace } from '../services/workspaceApi'

const ROLE_OPTIONS = [
  { value: 'editor', label: 'Editor', desc: 'Can view and edit code' },
  { value: 'viewer', label: 'Viewer', desc: 'Can view code only' },
]

const ShareWorkspaceModal = ({ workspaceId, workspaceName, members: initialMembers, onClose }) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [members, setMembers] = useState(initialMembers || [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMembers(initialMembers || [])
  }, [initialMembers])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Email is required.')
      return
    }
    setLoading(true)
    try {
      const data = await shareWorkspace(workspaceId, email.trim(), role)
      toast.success(data.message)
      setMembers(data.members)
      setEmail('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share workspace.')
    } finally {
      setLoading(false)
    }
  }

  const roleColor = (r) => {
    if (r === 'owner') return 'badge-owner'
    if (r === 'editor') return 'badge-editor'
    return 'badge-viewer'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Share "{workspaceName}"</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Share form */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="share-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="share-email" className="form-label">Invite by email</label>
              <input
                id="share-email"
                type="email"
                className="form-input"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ minWidth: 140 }}>
              <label htmlFor="share-role" className="form-label">Role</label>
              <select
                id="share-role"
                className="form-input form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="form-label">&nbsp;</label>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : 'Invite'}
              </button>
            </div>
          </div>

          <p className="role-hint">
            {ROLE_OPTIONS.find((r) => r.value === role)?.desc}
          </p>
        </form>

        {/* Members list */}
        {members.length > 0 && (
          <div className="member-list">
            <p className="form-label" style={{ marginBottom: 8 }}>
              Members ({members.length})
            </p>
            {members.map((m) => (
              <div key={m._id} className="member-row">
                <div className="member-info">
                  <span className="member-avatar">
                    {m.userId?.username?.[0]?.toUpperCase() || '?'}
                  </span>
                  <div>
                    <p className="member-name">{m.userId?.username}</p>
                    <p className="member-email">{m.userId?.email}</p>
                  </div>
                </div>
                <span className={`role-badge ${roleColor(m.role)}`}>{m.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ShareWorkspaceModal

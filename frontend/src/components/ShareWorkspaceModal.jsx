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
    <div className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="modal w-full max-w-2xl bg-gray-900/80 backdrop-blur-xl border border-gray-700/60 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex items-center justify-between mb-6 shrink-0">
          <h2 className="modal-title text-xl md:text-2xl font-semibold font-display tracking-tight text-white pr-4 truncate">Share "{workspaceName}"</h2>
          <button className="modal-close text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Share form */}
        <form onSubmit={handleSubmit} className="modal-form flex flex-col gap-4 mb-8 shrink-0">
          <div className="share-row flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="form-group flex flex-col gap-1.5 flex-1 w-full">
              <label htmlFor="share-email" className="form-label text-sm font-medium text-gray-300">Invite by email</label>
              <input
                id="share-email"
                type="email"
                className="form-input h-12 w-full px-4 rounded-lg bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 hover:border-blue-500/40 transition-all"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group flex flex-col gap-1.5 w-full sm:w-[140px]">
              <label htmlFor="share-role" className="form-label text-sm font-medium text-gray-300">Role</label>
              <select
                id="share-role"
                className="form-input h-12 w-full px-4 rounded-lg bg-gray-800/60 border border-gray-700/60 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 hover:border-blue-500/40 transition-all appearance-none cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group w-full sm:w-auto mt-2 sm:mt-0">
              <button type="submit" className="btn btn-primary h-12 px-6 w-full min-w-[100px]" disabled={loading}>
                {loading ? <span className="btn-spinner w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Invite'}
              </button>
            </div>
          </div>

          <p className="role-hint text-sm text-gray-400 ml-1">
            {ROLE_OPTIONS.find((r) => r.value === role)?.desc}
          </p>
        </form>

        {/* Members list */}
        {members.length > 0 && (
          <div className="member-list flex-1 overflow-y-auto custom-scrollbar pr-2 border-t border-gray-800/60 pt-6">
            <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase mb-4">
              Members ({members.length})
            </h3>
            <div className="flex flex-col gap-2">
              {members.map((m) => (
                <div key={m._id} className="member-row flex items-center justify-between p-3 bg-gray-800/20 hover:bg-gray-800/40 border border-gray-800/60 rounded-xl transition-colors">
                  <div className="member-info flex items-center gap-3">
                    <span className="member-avatar w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold">
                      {m.userId?.username?.[0]?.toUpperCase() || '?'}
                    </span>
                    <div>
                      <p className="member-name text-sm font-medium text-gray-200">{m.userId?.username}</p>
                      <p className="member-email text-xs text-gray-500">{m.userId?.email}</p>
                    </div>
                  </div>
                  <span className={`role-badge px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${m.role === 'owner' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' : m.role === 'editor' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'}`}>{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShareWorkspaceModal

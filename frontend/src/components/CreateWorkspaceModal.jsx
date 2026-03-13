import { useState } from 'react'
import toast from 'react-hot-toast'
import { createWorkspace } from '../services/workspaceApi'

const LANGUAGES = [
  { value: 'javascript', label: 'JS',   color: '#f7df1e' },
  { value: 'typescript', label: 'TS',   color: '#3178c6' },
  { value: 'python',     label: 'Py',   color: '#3572a5' },
  { value: 'java',       label: 'Java', color: '#b07219' },
  { value: 'cpp',        label: 'C++',  color: '#f34b7d' },
  { value: 'go',         label: 'Go',   color: '#00add8' },
  { value: 'rust',       label: 'Rust', color: '#dea584' },
]

const CreateWorkspaceModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Workspace name is required.'); return }
    setLoading(true)
    try {
      const data = await createWorkspace(name.trim(), language)
      toast.success(`"${name}" created`)
      onCreated(data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="modal w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-700/60 rounded-2xl p-6 md:p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header flex items-center justify-between mb-6">
          <h2 className="modal-title text-xl md:text-2xl font-semibold font-display tracking-tight text-white">New Workspace</h2>
          <button className="modal-close text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form flex flex-col gap-6">
          <div className="form-group flex flex-col gap-1.5">
            <label htmlFor="ws-name" className="form-label text-sm font-medium text-gray-300">Workspace Name</label>
            <input
              id="ws-name"
              type="text"
              className="form-input h-12 w-full px-4 rounded-lg bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 hover:border-blue-500/40 transition-all"
              placeholder="My React App"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              disabled={loading}
              maxLength={80}
            />
          </div>

          <div className="form-group flex flex-col gap-2">
            <label className="form-label text-sm font-medium text-gray-300">Language</label>
            <div className="lang-grid grid grid-cols-4 sm:grid-cols-5 gap-3">
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  type="button"
                  className={`lang-pill flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all ${language === l.value ? 'bg-blue-500/15 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-gray-800/40 border-gray-700/60 text-gray-400 hover:bg-gray-700/50 hover:border-gray-500'}`}
                  onClick={() => setLanguage(l.value)}
                  disabled={loading}
                >
                  <span
                    className="lang-dot w-2 h-2 rounded-full"
                    style={{ background: l.color }}
                  />
                  <span className="text-xs font-medium">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions flex items-center justify-center gap-3 mt-4">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary min-w-[100px]" disabled={loading}>
              {loading ? <span className="btn-spinner w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateWorkspaceModal

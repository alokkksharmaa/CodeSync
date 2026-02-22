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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Workspace</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="ws-name" className="form-label">Workspace Name</label>
            <input
              id="ws-name"
              type="text"
              className="form-input"
              placeholder="My React App"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              disabled={loading}
              maxLength={80}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Language</label>
            <div className="lang-grid">
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  type="button"
                  className={`lang-pill ${language === l.value ? 'selected' : ''}`}
                  onClick={() => setLanguage(l.value)}
                  disabled={loading}
                >
                  <span
                    className="lang-dot"
                    style={{ background: l.color }}
                  />
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateWorkspaceModal

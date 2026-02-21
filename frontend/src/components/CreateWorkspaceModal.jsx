import { useState } from 'react'
import toast from 'react-hot-toast'
import { createWorkspace } from '../services/workspaceApi'

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
]

const CreateWorkspaceModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Workspace name is required.')
      return
    }
    setLoading(true)
    try {
      const data = await createWorkspace(name.trim(), language)
      toast.success(`Workspace "${name}" created!`)
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
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Workspace</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="ws-name" className="form-label">Workspace Name</label>
            <input
              id="ws-name"
              type="text"
              className="form-input"
              placeholder="e.g. My React Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={loading}
              maxLength={80}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ws-lang" className="form-label">Language</label>
            <select
              id="ws-lang"
              className="form-input form-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateWorkspaceModal

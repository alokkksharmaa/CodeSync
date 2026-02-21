import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { fetchWorkspaces } from '../services/workspaceApi'
import CreateWorkspaceModal from '../components/CreateWorkspaceModal'

const LANG_COLORS = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3572a5',
  java: '#b07219',
  cpp: '#f34b7d',
  go: '#00add8',
  rust: '#dea584',
  html: '#e34c26',
  css: '#563d7c',
  json: '#8bc4d6',
}

const WorkspaceCard = ({ workspace, role, onClick }) => {
  const updatedAt = new Date(workspace.updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="ws-card" onClick={onClick}>
      <div className="ws-card-top">
        <span
          className="language-badge"
          style={{ background: LANG_COLORS[workspace.language] + '22', color: LANG_COLORS[workspace.language] }}
        >
          {workspace.language}
        </span>
        <span className={`role-badge ${role === 'owner' ? 'badge-owner' : role === 'editor' ? 'badge-editor' : 'badge-viewer'}`}>
          {role}
        </span>
      </div>
      <h3 className="ws-card-name">{workspace.name}</h3>
      <p className="ws-card-meta">
        {role !== 'owner' && workspace.owner?.username
          ? `by @${workspace.owner.username} · `
          : ''}
        Updated {updatedAt}
      </p>
      <div className="ws-card-footer">
        <button className="btn btn-primary btn-sm">Open →</button>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    setLoading(true)
    try {
      const data = await fetchWorkspaces()
      setWorkspaces(data)
    } catch (err) {
      toast.error('Failed to load workspaces.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully.')
    navigate('/login')
  }

  const handleCreated = (data) => {
    // Optimistically add the new workspace to the list
    setWorkspaces((prev) => [
      { workspace: data.workspace, role: 'owner', addedAt: new Date() },
      ...prev,
    ])
  }

  const myWorkspaces = workspaces.filter((w) => w.role === 'owner')
  const sharedWorkspaces = workspaces.filter((w) => w.role !== 'owner')

  return (
    <div className="dashboard-page">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="dashboard-nav">
        <div className="nav-brand">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">CodeSync</span>
        </div>
        <div className="nav-right">
          <span className="nav-username">@{user?.username}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <div>
            <h1 className="dashboard-title">
              Hello, <span className="accent">{user?.username}</span> 👋
            </h1>
            <p className="dashboard-subtitle">Manage and open your collaborative workspaces.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Workspace
          </button>
        </div>

        {loading ? (
          <div className="ws-loading">
            <div className="spinner" />
            <p>Loading workspaces…</p>
          </div>
        ) : (
          <>
            {/* My Workspaces */}
            <section className="ws-section">
              <h2 className="ws-section-title">My Workspaces</h2>
              {myWorkspaces.length === 0 ? (
                <div className="ws-empty">
                  <p>You haven't created any workspaces yet.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                    Create one →
                  </button>
                </div>
              ) : (
                <div className="workspace-grid">
                  {myWorkspaces.map(({ workspace, role }) => (
                    <WorkspaceCard
                      key={workspace._id}
                      workspace={workspace}
                      role={role}
                      onClick={() => navigate(`/workspace/${workspace._id}`)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Shared With Me */}
            {sharedWorkspaces.length > 0 && (
              <section className="ws-section">
                <h2 className="ws-section-title">Shared With Me</h2>
                <div className="workspace-grid">
                  {sharedWorkspaces.map(({ workspace, role }) => (
                    <WorkspaceCard
                      key={workspace._id}
                      workspace={workspace}
                      role={role}
                      onClick={() => navigate(`/workspace/${workspace._id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── Create Modal ─────────────────────────────────────────── */}
      {showCreate && (
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

export default Dashboard

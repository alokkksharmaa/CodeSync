import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { fetchWorkspaces, fetchWorkspace } from '../services/workspaceApi'
import api from '../services/api'
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

  const handlePrefetch = () => {
    // Prefetch workspace data on hover to speed up navigation
    fetchWorkspace(workspace._id).catch(() => {});
  }

  return (
    <div className="ws-card" onMouseEnter={handlePrefetch}>
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
      <h3 className="ws-card-name" title={workspace.name}>{workspace.name}</h3>
      <p className="ws-card-meta">
        {role !== 'owner' && workspace.owner?.username
          ? `by @${workspace.owner.username} · `
          : ''}
        Updated {updatedAt}
      </p>
      <div className="ws-card-footer">
        <button className="btn btn-primary btn-sm btn-full" onClick={onClick}>
          Quick Join →
        </button>
      </div>
    </div>
  )
}

const RecentActivity = ({ workspaces }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    // Fetch unique workspace IDs from memberships
    const wsIds = workspaces.map(w => w.workspace._id)
    if (wsIds.length === 0) {
      setLoading(false)
      return
    }

    try {
      // In this version, we fetch global activities relevant to user's workspaces
      // or we can aggregate from individual /api/workspaces/:id/activity
      // For simplicity & performance, we'll fetch from a combined endpoint or mock aggregator
      const allActivities = await Promise.all(
        wsIds.slice(0, 5).map(id => api.get(`/api/workspaces/${id}/activity`).then(res => res.data))
      )
      const combined = allActivities.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10)
      setActivities(combined)
    } catch (err) {
      console.error('Failed to fetch dashboard activity', err)
    } finally {
      setLoading(false)
    }
  }, [workspaces])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const formatTime = (date) => {
    const now = new Date()
    const diff = Math.floor((now - new Date(date)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(date).toLocaleDateString()
  }

  if (loading) return (
    <section className="ws-section">
      <h2 className="ws-section-title">Recent Activity</h2>
      <div className="activity-skeleton">
        {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-activity" />)}
      </div>
    </section>
  )

  return (
    <section className="ws-section">
      <h2 className="ws-section-title">Recent Activity</h2>
      <div className="activity-list-mini">
        {activities.length === 0 ? (
          <p className="no-activity-mini">No recent activity</p>
        ) : (
          activities.map(act => (
            <div key={act._id} className="activity-item-mini">
              <span className="activity-dot"></span>
              <span className="activity-text">
                <strong>{act.metadata?.username || 'User'}</strong> {
                  act.actionType === 'FILE_UPDATED' ? 'edited a file' : 
                  act.actionType === 'USER_JOINED' ? 'joined workspace' : 
                  act.actionType === 'FILE_CREATED' ? 'created a file' : 
                  act.actionType === 'USER_LEFT' ? 'left workspace' : 'performed an action'
                }
              </span>
              <span className="activity-time">{formatTime(act.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </section>
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
          <div className="workspace-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="ws-card skeleton skeleton-card" />
            ))}
          </div>
        ) : (
          <div className="dashboard-content-layout">
            <div className="workspaces-column">
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
            </div>

            <div className="activity-column">
              <RecentActivity workspaces={workspaces} />
            </div>
          </div>
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

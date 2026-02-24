import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { fetchWorkspaces, fetchWorkspace } from '../services/workspaceApi'
import api from '../services/api'
import { io } from 'socket.io-client'
import CreateWorkspaceModal from '../components/CreateWorkspaceModal'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

const LANG_COLORS = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3572a5',
  java: '#b07219', cpp: '#f34b7d', go: '#00add8', rust: '#dea584',
}

const TIME_AGO = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Workspace Card ───────────────────────────────────────────────────────────
const WorkspaceCard = ({ workspace, role, onClick }) => {
  const langColor = LANG_COLORS[workspace.language] || '#635bff'

  const handlePrefetch = () => fetchWorkspace(workspace._id).catch(() => {})

  return (
    <div className="ws-card flex flex-col p-5 gap-3 rounded-xl border border-gray-700/60 bg-gray-800/60 hover:border-blue-500/40 hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer backdrop-blur-sm" onMouseEnter={handlePrefetch} onClick={onClick}>
      <div className="ws-card-top flex items-center justify-between mb-2">
        <span
          className="language-badge px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            background: langColor + '1a',
            color: langColor,
            border: `1px solid ${langColor}30`,
          }}
        >
          {workspace.language || 'js'}
        </span>
        <span className={`role-badge px-2.5 py-1 rounded-full text-xs font-semibold ${role === 'owner' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' : role === 'editor' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'}`}>
          {role}
        </span>
      </div>
      <h3 className="ws-card-name text-lg font-semibold text-gray-100 truncate" title={workspace.name}>{workspace.name}</h3>
      <p className="ws-card-meta text-sm text-gray-400 flex items-center gap-1.5">
        {role !== 'owner' && workspace.owner?.username
          ? `@${workspace.owner.username} · ` : ''}
        {TIME_AGO(workspace.updatedAt)}
      </p>
    </div>
  )
}

// ─── Recent Activity ─────────────────────────────────────────────────────────
const RecentActivity = ({ workspaces, refreshTrigger }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    const wsIds = workspaces.map(w => w.workspace._id)
    if (wsIds.length === 0) { setLoading(false); return }
    try {
      const all = await Promise.all(
        wsIds.slice(0, 5).map(id => api.get(`/api/workspaces/${id}/activity`).then(r => r.data))
      )
      const combined = all.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 12)
      setActivities(combined)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [workspaces])

  useEffect(() => { fetchActivities() }, [fetchActivities, refreshTrigger])

  const ACTION_LABEL = {
    FILE_UPDATED: 'edited',
    FILE_CREATED: 'created',
    FILE_DELETED: 'deleted',
    FILE_RENAMED: 'renamed',
    FOLDER_CREATED: 'created folder',
    USER_JOINED: 'joined',
    USER_LEFT: 'left',
  }

  return (
    <div className="activity-panel rounded-xl border border-gray-700/60 bg-gray-800/40 backdrop-blur-md overflow-hidden">
      <div className="activity-panel-header px-5 py-4 border-b border-gray-700/60 text-lg font-semibold text-gray-200">Recent Activity</div>
      <div className="activity-list-mini p-3">
        {loading ? (
          <div style={{ padding: '12px 16px' }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-activity" />)}
          </div>
        ) : activities.length === 0 ? (
          <p className="no-activity-mini text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          activities.map(act => (
            <div key={act._id} className="activity-item-mini flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition">
              <span className="activity-dot mt-1.5 w-2 h-2 rounded-full bg-blue-500/50 flex-shrink-0" />
              <span className="activity-text text-sm text-gray-300 flex-1 leading-relaxed">
                <strong className="text-gray-200 font-medium">{act.metadata?.username || 'User'}</strong>{' '}
                <span className="text-gray-400">{ACTION_LABEL[act.actionType] || 'acted'}</span>
                {act.metadata?.name ? <span className="text-gray-300 ml-1"> {act.metadata.name}</span> : ''}
              </span>
              <span className="activity-time text-xs text-gray-500 whitespace-nowrap">{TIME_AGO(act.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ user, workspaceCount, activeTab, onTabChange, onLogout, onRefresh }) => (
  <aside className="sidebar w-64 bg-gray-900/80 backdrop-blur-xl border-r border-gray-700/60 flex flex-col flex-shrink-0 h-screen sticky top-0 z-10">
    <div className="sidebar-logo flex items-center gap-3 px-6 py-5 border-b border-gray-700/60 cursor-pointer hover:bg-white/5 transition" onClick={onRefresh} title="Refresh workspaces">
      <span className="logo-icon text-yellow-400 text-xl">⚡</span>
      <span className="logo-text text-xl font-bold tracking-tight text-white font-display">CodeSync</span>
    </div>

    <nav className="sidebar-nav flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
      <span className="sidebar-section-label text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Navigation</span>

      <div
        className={`sidebar-item flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${activeTab === 'my' ? 'bg-blue-500/15 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
        onClick={() => onTabChange('my')}
      >
        <div className="flex items-center gap-3">
          <span className={`sidebar-item-icon text-lg transition-colors ${activeTab === 'my' ? 'text-blue-500' : 'text-gray-500 group-hover:text-blue-400'}`}>⊞</span>
          <span className="font-medium">My Workspaces</span>
        </div>
        {workspaceCount.my > 0 && (
          <span className={`sidebar-item-count px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === 'my' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-800 text-gray-400'}`}>{workspaceCount.my}</span>
        )}
      </div>

      <div
        className={`sidebar-item flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${activeTab === 'shared' ? 'bg-blue-500/15 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
        onClick={() => onTabChange('shared')}
      >
        <div className="flex items-center gap-3">
          <span className={`sidebar-item-icon text-lg transition-colors ${activeTab === 'shared' ? 'text-blue-500' : 'text-gray-500 group-hover:text-blue-400'}`}>👥</span>
          <span className="font-medium">Shared With Me</span>
        </div>
        {workspaceCount.shared > 0 && (
          <span className={`sidebar-item-count px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === 'shared' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-800 text-gray-400'}`}>{workspaceCount.shared}</span>
        )}
      </div>
    </nav>

    <div className="sidebar-footer p-4 border-t border-gray-700/60 bg-gray-900/40">
      <div className="sidebar-user flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition mb-2">
        <div className="sidebar-avatar w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-glow)' }}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="sidebar-user-info flex-1 overflow-hidden">
          <div className="sidebar-username text-sm font-semibold text-white truncate">@{user?.username}</div>
          <div className="sidebar-user-role text-xs text-gray-400 truncate">{user?.email}</div>
        </div>
      </div>
      <button
        className="btn btn-ghost btn-error w-full flex items-center justify-start gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition"
        onClick={onLogout}
      >
        Sign out
      </button>
    </div>
  </aside>
)

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [refreshActivity, setRefreshActivity] = useState(0)
  const [activeTab, setActiveTab] = useState('my')

  const loadWorkspaces = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchWorkspaces()
      setWorkspaces(data)
    } catch {
      toast.error('Failed to load workspaces.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadWorkspaces() }, [loadWorkspaces])

  // Socket: listen for activity updates across all workspaces
  useEffect(() => {
    if (workspaces.length === 0) return
    const socket = io(BACKEND_URL, { transports: ['websocket'] })
    socket.on('connect', () => {
      workspaces.forEach(({ workspace }) => {
        socket.emit('join_workspace', { workspaceId: workspace._id, username: user?.username, userId: user?.id })
      })
    })
    socket.on('activity_update', () => setRefreshActivity(prev => prev + 1))
    return () => socket.disconnect()
  }, [workspaces, user])

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login') }
  const handleCreated = (data) => {
    setWorkspaces(prev => [{ workspace: data.workspace, role: 'owner', addedAt: new Date() }, ...prev])
  }

  const myWorkspaces = workspaces.filter(w => w.role === 'owner')
  const sharedWorkspaces = workspaces.filter(w => w.role !== 'owner')
  const shown = activeTab === 'my' ? myWorkspaces : sharedWorkspaces

  return (
    <div className="dashboard-page">
      <Sidebar
        user={user}
        workspaceCount={{ my: myWorkspaces.length, shared: sharedWorkspaces.length }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        onRefresh={loadWorkspaces}
      />

      <main className="dashboard-main flex-1 flex flex-col min-w-0 bg-[#0B0C10]">
        <div className="dashboard-header px-8 py-8 md:py-10 border-b border-gray-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/20 backdrop-blur-sm sticky top-0 z-0">
          <div>
            <h1 className="dashboard-heading text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2 font-display">
              {activeTab === 'my' ? 'My Workspaces' : 'Shared With Me'}
            </h1>
            <p className="dashboard-meta text-lg text-gray-400">
              {!loading && `${shown.length} workspace${shown.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="btn btn-primary px-5 py-2.5 rounded-lg shadow-lg transition-all hover:-translate-y-0.5" onClick={() => setShowCreate(true)}>
            + New Workspace
          </button>
        </div>

        <div className="dashboard-content-layout flex-1 p-8 grid lg:grid-cols-[1fr_320px] gap-8 overflow-y-auto">
          <div className="workspaces-column">
            <div className="ws-section">
              {loading ? (
                <div className="workspace-grid">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="ws-card skeleton skeleton-card" />
                  ))}
                </div>
              ) : shown.length === 0 ? (
                <div className="ws-empty flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-gray-700/60 rounded-2xl bg-gray-800/20">
                  <span className="text-4xl mb-4 text-gray-600">
                    {activeTab === 'my' ? '⊞' : '👥'}
                  </span>
                  <p className="text-lg text-gray-400 mb-6">
                    {activeTab === 'my'
                      ? "You haven't created any workspaces yet."
                      : "No workspaces have been shared with you."}
                  </p>
                  {activeTab === 'my' && (
                    <button className="btn btn-secondary px-4 py-2 rounded-lg transition" onClick={() => setShowCreate(true)}>
                      Create workspace
                    </button>
                  )}
                </div>
              ) : (
                <div className="workspace-grid grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {shown.map(({ workspace, role }) => (
                    <WorkspaceCard
                      key={workspace._id}
                      workspace={workspace}
                      role={role}
                      onClick={() => navigate(`/workspace/${workspace._id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="activity-column">
            <RecentActivity workspaces={workspaces} refreshTrigger={refreshActivity} />
          </div>
        </div>
      </main>

      {showCreate && (
        <CreateWorkspaceModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}

export default Dashboard

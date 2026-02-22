import { useState, useEffect } from 'react'
import api from '../services/api'

const ACTION_LABELS = {
  FILE_CREATED: { verb: 'created', icon: '📄' },
  FILE_DELETED: { verb: 'deleted', icon: '🗑' },
  FILE_RENAMED: { verb: 'renamed', icon: '✎' },
  FILE_UPDATED: { verb: 'edited', icon: '✏️' },
  FOLDER_CREATED: { verb: 'created folder', icon: '📁' },
  FOLDER_DELETED: { verb: 'deleted folder', icon: '📁' },
  USER_JOINED:  { verb: 'joined', icon: '→' },
  USER_LEFT:    { verb: 'left', icon: '←' },
}

const ActivityFeed = ({ socket, workspaceId }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const loadActivities = async () => {
    try {
      const res = await api.get(`/api/workspaces/${workspaceId}/activity`)
      setActivities(res.data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadActivities() }, [workspaceId])

  useEffect(() => {
    if (!socket) return
    const refresh = () => loadActivities()
    socket.on('activity_update', refresh)
    return () => socket.off('activity_update', refresh)
  }, [socket, workspaceId])

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="activity-feed-panel">
      <div className="panel-header">
        <span className="panel-title">Activity</span>
      </div>
      <div className="panel-list">
        {loading ? (
          <div style={{ padding: '12px 16px' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-activity" />)}
          </div>
        ) : activities.length === 0 ? (
          <p className="activity-empty">No recent activity</p>
        ) : (
          <div className="activity-list">
            {activities.map((act, i) => {
              const def = ACTION_LABELS[act.actionType] || { verb: 'acted', icon: '·' }
              return (
                <div key={i} className="activity-item">
                  <span className="activity-time">{formatTime(act.createdAt)}</span>
                  <div className="activity-content">
                    <span style={{ marginRight: '4px', opacity: 0.6 }}>{def.icon}</span>
                    <strong>{act.metadata?.username || 'User'}</strong>{' '}
                    {def.verb}
                    {act.metadata?.name ? (
                      <span style={{ color: 'var(--text-muted)', marginLeft: '3px', fontFamily: 'monospace', fontSize: '11px' }}>
                        {act.metadata.name}
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityFeed

import { useState, useEffect } from 'react'
import api from '../services/api'

const ActivityFeed = ({ socket, workspaceId }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await api.get(`/api/workspaces/${workspaceId}/activity`)
        setActivities(res.data.map(a => ({
          ...a,
          time: a.createdAt,
          user: a.metadata?.username || 'User',
          file: a.metadata?.filename || a.targetId
        })))
      } catch (err) {
        console.error('Failed to load initial activity', err)
      } finally {
        setLoading(false)
      }
    }
    fetchInitial()
  }, [workspaceId])

  useEffect(() => {
    if (!socket) return

    const handleActivityUpdate = () => {
      // Refresh list when server signals an activity occurred
      api.get(`/api/workspaces/${workspaceId}/activity`).then(res => {
        setActivities(res.data.map(a => ({
          ...a,
          time: a.createdAt,
          user: a.metadata?.username || 'User',
          file: a.metadata?.filename || a.targetId
        })))
      })
    }

    socket.on('activity_update', handleActivityUpdate)

    return () => {
      socket.off('activity_update', handleActivityUpdate)
    }
  }, [socket, workspaceId])

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="activity-feed-panel">
      <h3 className="panel-title">Workspace Activity</h3>
      <div className="activity-list">
        {activities.length === 0 ? (
          <p className="activity-empty">No recent activity</p>
        ) : (
          activities.map((act, i) => (
            <div key={i} className="activity-item">
              <span className="activity-time">{formatTime(act.time)}</span>
              <div className="activity-content">
                <strong>{act.user}</strong> 
                {act.actionType === 'USER_JOINED' && ' joined the workspace'}
                {act.actionType === 'USER_LEFT' && ' left the workspace'}
                {act.actionType === 'FILE_CREATED' && ` created file: ${act.file}`}
                {act.actionType === 'FILE_DELETED' && ` deleted file: ${act.file}`}
                {act.actionType === 'FILE_UPDATED' && ` edited file: ${act.file}`}
                {act.actionType === 'WORKSPACE_UPDATED' && ' updated workspace settings'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ActivityFeed

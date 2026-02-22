import { useState, useEffect } from 'react'

const ActivityFeed = ({ socket, workspaceId }) => {
  const [activities, setActivities] = useState([])

  useEffect(() => {
    if (!socket) return

    // Fetch initial activity or wait for events
    // For now we listen for activity_update which triggers a refresh if we had an API
    // But we can also listen for specific events broadcasted from server.js

    const handleUserJoined = (data) => {
      addActivity({ type: 'USER_JOINED', user: data.username, time: new Date() })
    }

    const handleUserLeft = (data) => {
      addActivity({ type: 'USER_LEFT', user: data.username, time: new Date() })
    }

    const handleFileCreated = (data) => {
      addActivity({ type: 'FILE_CREATED', user: 'Someone', file: data.name, time: new Date() })
    }

    const handleFileDeleted = (data) => {
      addActivity({ type: 'FILE_DELETED', user: 'Someone', file: data.fileId, time: new Date() })
    }

    socket.on('user_joined', handleUserJoined)
    socket.on('user_left', handleUserLeft)
    socket.on('file_created', handleFileCreated)
    socket.on('file_deleted', handleFileDeleted)

    return () => {
      socket.off('user_joined', handleUserJoined)
      socket.off('user_left', handleUserLeft)
      socket.off('file_created', handleFileCreated)
      socket.off('file_deleted', handleFileDeleted)
    }
  }, [socket])

  const addActivity = (activity) => {
    setActivities(prev => [activity, ...prev].slice(0, 20))
  }

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
                {act.type === 'USER_JOINED' && ' joined the workspace'}
                {act.type === 'USER_LEFT' && ' left the workspace'}
                {act.type === 'FILE_CREATED' && ` created file: ${act.file}`}
                {act.type === 'FILE_DELETED' && ` deleted file: ${act.file}`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ActivityFeed

import { useState, useEffect } from 'react'
import api from '../services/api'

const ACTION_LABELS = {
  FILE_CREATED: { verb: 'created', icon: '📄' },
  FILE_DELETED: { verb: 'deleted', icon: '🗑' },
  FILE_RENAMED: { verb: 'renamed', icon: '✎' },
  FILE_UPDATED: { verb: 'edited', icon: '✏️' },
  FOLDER_CREATED: { verb: 'created folder', icon: '📁' },
  FOLDER_DELETED: { verb: 'deleted folder', icon: '📁' },
  USER_JOINED:  { verb: 'joined the workspace', icon: '👋' },
  USER_LEFT:    { verb: 'left the workspace', icon: '👋' },
  USER_INVITED: { verb: 'invited', icon: '✉️' },
  MEMBER_REMOVED: { verb: 'removed', icon: '🚫' },
  ROLE_CHANGED: { verb: 'changed role for', icon: '🔄' },
}

const ActivityFeed = ({ socket, workspaceId }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  console.log('[ActivityFeed] Render - workspaceId:', workspaceId, 'activities count:', activities.length, 'loading:', loading);

  const loadActivities = async () => {
    try {
      console.log('[ActivityFeed] Loading activities for workspace:', workspaceId);
      const res = await api.get(`/api/workspaces/${workspaceId}/activity`)
      console.log('[ActivityFeed] Received activities:', res.data);
      console.log('[ActivityFeed] Activities count:', res.data?.length);
      setActivities(res.data)
    } catch (error) { 
      console.error('[ActivityFeed] Error loading activities:', error);
    }
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
    <div className="activity-feed-panel w-72 bg-gray-900/60 backdrop-blur-md border-l border-gray-800/60 flex flex-col shrink-0 text-gray-300">
      <div className="panel-header flex items-center justify-between px-4 py-3 border-b border-gray-800/60 mb-2">
        <span className="panel-title text-xs font-semibold tracking-wider text-gray-500 uppercase">Activity</span>
      </div>
      <div className="panel-list flex-1 overflow-y-auto p-2 custom-scrollbar">
        {loading ? (
          <div className="p-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-activity h-10 w-full mb-2 rounded bg-white/5" />)}
          </div>
        ) : activities.length === 0 ? (
          <p className="activity-empty text-sm text-gray-500 text-center p-6 italic">No recent activity</p>
        ) : (
          <div className="activity-list flex flex-col gap-1.5">
            {activities.map((act, i) => {
              const def = ACTION_LABELS[act.actionType] || { verb: 'acted', icon: '·' }
              const isMemberActivity = ['USER_JOINED', 'USER_LEFT'].includes(act.actionType)
              const isInviteActivity = act.actionType === 'USER_INVITED'
              const isRoleChangeActivity = act.actionType === 'ROLE_CHANGED'
              const isMemberRemovedActivity = act.actionType === 'MEMBER_REMOVED'
              
              return (
                <div key={act._id || i} className="activity-item flex flex-col p-2 hover:bg-white/5 rounded-lg transition group">
                  <span className="activity-time text-xs text-gray-500 mb-1 font-medium">{formatTime(act.createdAt)}</span>
                  <div className="activity-content text-sm text-gray-300 flex items-start gap-2 leading-tight">
                    <span className="mt-0.5 text-gray-400 opacity-80">{def.icon}</span>
                    <div className="flex-1">
                      <strong className="font-semibold text-gray-200">{act.metadata?.username || 'User'}</strong>{' '}
                      <span className="text-gray-400">{def.verb}</span>
                      {isInviteActivity && act.metadata?.invitedUsername ? (
                        <span className="text-blue-400/80 ml-1">
                          {act.metadata.invitedUsername}
                        </span>
                      ) : null}
                      {isRoleChangeActivity && act.metadata?.targetUsername ? (
                        <>
                          <span className="text-blue-400/80 ml-1">{act.metadata.targetUsername}</span>
                          <span className="text-gray-500 ml-1 text-xs">
                            ({act.metadata.oldRole} → {act.metadata.newRole})
                          </span>
                        </>
                      ) : null}
                      {isMemberRemovedActivity && act.metadata?.removedUsername ? (
                        <span className="text-red-400/80 ml-1">{act.metadata.removedUsername}</span>
                      ) : null}
                      {!isMemberActivity && !isInviteActivity && !isRoleChangeActivity && !isMemberRemovedActivity && act.metadata?.name ? (
                        <span className="text-blue-400/80 ml-1 font-mono text-xs bg-blue-500/10 px-1 rounded break-all">
                          {act.metadata.name}
                        </span>
                      ) : null}
                      {act.metadata?.role && act.actionType === 'USER_JOINED' ? (
                        <span className="text-green-400/80 ml-1 text-xs">
                          as {act.metadata.role}
                        </span>
                      ) : null}
                    </div>
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

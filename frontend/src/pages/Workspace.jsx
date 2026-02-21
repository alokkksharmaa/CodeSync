import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import { fetchWorkspace } from '../services/workspaceApi'
import ShareWorkspaceModal from '../components/ShareWorkspaceModal'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

// Assign a random color to this user's cursor
const USER_COLORS = ['#7c6aff', '#f87171', '#4ade80', '#facc15', '#38bdf8', '#fb923c', '#c084fc']
const randomColor = () => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]

const Workspace = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [workspace, setWorkspace] = useState(null)
  const [members, setMembers] = useState([])
  const [myRole, setMyRole] = useState('viewer')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [showShare, setShowShare] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])

  const socketRef = useRef(null)
  const colorRef = useRef(randomColor())
  const isRemoteChange = useRef(false)
  const saveTimer = useRef(null)

  // ── Load workspace data ───────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWorkspace(id)
        setWorkspace(data.workspace)
        setMembers(data.members)
        setMyRole(data.myRole)
        setCode(data.file?.content || '')
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load workspace.'
        toast.error(msg)
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // ── Socket.IO ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !workspace) return

    const socket = io(BACKEND_URL, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_workspace', {
        workspaceId: id,
        username: user?.username,
        color: colorRef.current,
      })
    })

    // Server confirms join + sends saved code
    socket.on('workspace_joined', ({ code: savedCode }) => {
      setCode(savedCode)
    })

    // Remote code update from another user
    socket.on('code_update', ({ code: remoteCode }) => {
      isRemoteChange.current = true
      setCode(remoteCode)
    })

    socket.on('user_joined', ({ username }) => {
      toast(`${username} joined the workspace`, { icon: '👋' })
      setConnectedUsers((prev) =>
        prev.find((u) => u.username === username) ? prev : [...prev, { username }]
      )
    })

    socket.on('user_left', ({ username }) => {
      toast(`${username} left`, { icon: '👋' })
      setConnectedUsers((prev) => prev.filter((u) => u.username !== username))
    })

    return () => {
      socket.emit('leave_workspace', { workspaceId: id })
      socket.disconnect()
    }
  }, [loading, workspace, id, user])

  // ── Code change handler ───────────────────────────────────────────────────
  const handleCodeChange = useCallback(
    (e) => {
      const newCode = e.target.value
      setCode(newCode)

      if (isRemoteChange.current) {
        isRemoteChange.current = false
        return
      }

      if (myRole === 'viewer') return

      if (socketRef.current) {
        socketRef.current.emit('code_change', {
          workspaceId: id,
          code: newCode,
          userId: user?.id,
        })
      }
    },
    [id, myRole, user]
  )

  // ── Determine Monaco-compatible language ──────────────────────────────────
  const editorLang = workspace?.language || 'javascript'

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  const canEdit = myRole === 'owner' || myRole === 'editor'

  return (
    <div className="workspace-page">
      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <header className="ws-topbar">
        <div className="ws-topbar-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
          <div className="ws-name-badge">
            <span className="ws-topbar-name">{workspace?.name}</span>
            <span
              className="language-badge"
              style={{ fontSize: 11 }}
            >
              {editorLang}
            </span>
          </div>
        </div>

        <div className="ws-topbar-right">
          {/* Connected users presence */}
          {connectedUsers.length > 0 && (
            <div className="presence-row">
              {connectedUsers.map((u) => (
                <span key={u.username} className="presence-avatar" title={u.username}>
                  {u.username[0].toUpperCase()}
                </span>
              ))}
            </div>
          )}

          <span className={`role-badge ${myRole === 'owner' ? 'badge-owner' : myRole === 'editor' ? 'badge-editor' : 'badge-viewer'}`}>
            {myRole}
          </span>

          {myRole === 'owner' && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowShare(true)}>
              ⬆ Share
            </button>
          )}
        </div>
      </header>

      {/* ── Editor ───────────────────────────────────────────────── */}
      <div className="editor-container">
        {!canEdit && (
          <div className="viewer-banner">
            👁 You have viewer access — editing is disabled.
          </div>
        )}
        <textarea
          className="code-editor"
          value={code}
          onChange={handleCodeChange}
          readOnly={!canEdit}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={`// Start coding in ${editorLang}...\n// Share this workspace to collaborate in real time.`}
        />
      </div>

      {/* ── Share Modal ───────────────────────────────────────────── */}
      {showShare && (
        <ShareWorkspaceModal
          workspaceId={id}
          workspaceName={workspace?.name}
          members={members}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}

export default Workspace

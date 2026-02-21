import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully.')
    navigate('/login')
  }

  const handleCopyRoomId = () => {
    if (user?.roomId) {
      navigator.clipboard.writeText(user.roomId)
      setCopied(true)
      toast.success('Room ID copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleEnterRoom = () => {
    if (user?.roomId) {
      toast.success(`Joining room ${user.roomId}...`)
      // Navigate to the editor room — adjust this path to match your routing
      navigate(`/room/${user.roomId}`)
    }
  }

  return (
    <div className="dashboard-page">
      {/* ── Top Nav ─────────────────────────────────────────────── */}
      <header className="dashboard-nav">
        <div className="nav-brand">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">CodeSync</span>
        </div>
        <div className="nav-right">
          <span className="nav-username">@{user?.username}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <h1 className="dashboard-title">
            Hello, <span className="accent">{user?.username}</span> 👋
          </h1>
          <p className="dashboard-subtitle">
            Your collaboration session is ready. Share your room ID to code together.
          </p>
        </div>

        {/* ── Room Card ────────────────────────────────────────────── */}
        <div className="room-card">
          <div className="room-card-header">
            <div className="room-status-dot" />
            <span className="room-status-label">Ready to collaborate</span>
          </div>

          <div className="room-id-section">
            <p className="room-id-label">Your Room ID</p>
            <div className="room-id-display">
              <span className="room-id-value">{user?.roomId || '—'}</span>
              <button
                className={`btn btn-ghost btn-sm ${copied ? 'btn-success' : ''}`}
                onClick={handleCopyRoomId}
                title="Copy room ID"
              >
                {copied ? '✓ Copied' : '⎘ Copy'}
              </button>
            </div>
            <p className="room-id-hint">
              Share this ID with teammates to collaborate in real time
            </p>
          </div>

          <button className="btn btn-primary btn-full" onClick={handleEnterRoom}>
            Enter Room →
          </button>
        </div>

        {/* ── Info Cards ───────────────────────────────────────────── */}
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">🔐</div>
            <h3 className="info-title">Secure Session</h3>
            <p className="info-desc">
              Your session is protected with a JWT token valid for 7 days.
            </p>
          </div>
          <div className="info-card">
            <div className="info-icon">⚡</div>
            <h3 className="info-title">Real-time Sync</h3>
            <p className="info-desc">
              Code updates are synced instantly via Socket.IO across all collaborators.
            </p>
          </div>
          <div className="info-card">
            <div className="info-icon">🎯</div>
            <h3 className="info-title">Cursor Presence</h3>
            <p className="info-desc">
              See where everyone is in the file with live colored cursor indicators.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard

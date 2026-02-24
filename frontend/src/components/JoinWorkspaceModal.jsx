import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { joinWorkspace } from '../services/workspaceApi'

const JoinWorkspaceModal = ({ onClose, onJoined }) => {
  const [roomId, setRoomId] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!roomId.trim()) { 
      toast.error('Room ID is required.')
      return 
    }
    
    setLoading(true)
    try {
      const data = await joinWorkspace(roomId.trim())
      toast.success(data.message || 'Joined workspace successfully!')
      onJoined(data)
      onClose()
      navigate(`/workspace/${data.workspaceId}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join workspace. Invalid Room ID?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="modal w-full max-w-sm bg-gray-900/80 backdrop-blur-xl border border-gray-700/60 rounded-2xl p-6 md:p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header flex items-center justify-between mb-6">
          <h2 className="modal-title text-xl md:text-2xl font-semibold font-display tracking-tight text-white">Join Workspace</h2>
          <button className="modal-close text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form flex flex-col gap-6">
          <div className="form-group flex flex-col gap-1.5">
            <label htmlFor="room-id" className="form-label text-sm font-medium text-gray-300">Room ID</label>
            <input
              id="room-id"
              type="text"
              className="form-input h-12 w-full px-4 rounded-lg bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 hover:border-blue-500/40 transition-all font-mono"
              placeholder="e.g. 64b8f...21a"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Ask the owner for their Workspace ID to join.</p>
          </div>

          <div className="modal-actions flex items-center justify-center gap-3 mt-4">
            <button type="button" className="btn btn-ghost rounded-lg" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary min-w-[100px] rounded-lg" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Join Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default JoinWorkspaceModal

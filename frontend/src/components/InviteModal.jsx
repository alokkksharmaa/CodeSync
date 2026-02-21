import { useState } from 'react';
import toast from 'react-hot-toast';
import { inviteMember } from '../services/memberApi';

const InviteModal = ({ workspaceId, workspaceName, onInviteSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const data = await inviteMember(workspaceId, { email: email.trim(), role });
      toast.success(data.message);
      onInviteSuccess(data.member);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invite to {workspaceName}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>User Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select 
              className="form-input" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="editor">Editor (Can edit files)</option>
              <option value="viewer">Viewer (Read-only)</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;

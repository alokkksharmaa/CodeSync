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
    <div className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="modal-content w-full max-w-sm bg-gray-900/80 backdrop-blur-xl border border-gray-700/60 rounded-2xl p-6 md:p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-semibold font-display tracking-tight text-white truncate pr-4">Invite to {workspaceName}</h2>
          <button className="btn-close text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form flex flex-col gap-5">
          <div className="form-group flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">User Email</label>
            <input
              type="email"
              className="form-input h-12 w-full px-4 rounded-lg bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 hover:border-blue-500/40 transition-all"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Role</label>
            <select 
              className="form-input h-12 w-full px-4 rounded-lg bg-gray-800/60 border border-gray-700/60 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 hover:border-blue-500/40 transition-all appearance-none cursor-pointer" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="editor">Editor (Can edit files)</option>
              <option value="viewer">Viewer (Read-only)</option>
            </select>
          </div>

          <div className="modal-actions flex items-center justify-center gap-3 mt-4">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary min-w-[120px]" disabled={loading}>
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;

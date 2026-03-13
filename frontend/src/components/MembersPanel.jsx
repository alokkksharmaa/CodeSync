import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateMemberRole, removeMember } from '../services/memberApi';

const MembersPanel = ({ workspaceId, members, myRole, onMembersChange }) => {
  const [loadingId, setLoadingId] = useState(null);
  const isOwner = myRole === 'owner';

  const handleRoleChange = async (userId, newRole) => {
    setLoadingId(userId);
    try {
      await updateMemberRole(workspaceId, { userId, role: newRole });
      onMembersChange(members.map(m => m.user._id === userId ? { ...m, role: newRole } : m));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
    finally { setLoadingId(null); }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    setLoadingId(userId);
    try {
      await removeMember(workspaceId, userId);
      onMembersChange(members.filter(m => m.user._id !== userId));
      toast.success('Member removed');
    } catch { toast.error('Failed to remove'); }
    finally { setLoadingId(null); }
  };

  return (
    <div className="members-panel w-72 bg-gray-900/60 backdrop-blur-md border-l border-gray-800/60 flex flex-col shrink-0 text-gray-300">
      <div className="panel-header flex items-center justify-between px-4 py-3 border-b border-gray-800/60 mb-2">
        <span className="panel-title text-xs font-semibold tracking-wider text-gray-500 uppercase">Members</span>
        <span className="text-xs font-medium text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full">{members.length}</span>
      </div>

      <div className="panel-list flex-1 overflow-y-auto p-2 custom-scrollbar">
        {members.map(m => (
          <div key={m.user._id} className="member-row flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors group">
            <div className="member-info flex items-center gap-3 overflow-hidden">
              <div className="member-avatar w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center text-xs font-bold shrink-0">{m.user.username[0].toUpperCase()}</div>
              <div className="overflow-hidden">
                <div className="member-name text-sm font-medium text-gray-200 truncate">{m.user.username}</div>
                <div className="member-email text-xs text-gray-500 truncate">{m.user.email}</div>
              </div>
            </div>

            <div className="member-actions flex items-center gap-2 shrink-0">
              {isOwner && m.role !== 'owner' ? (
                <>
                  <select
                    className="form-input bg-gray-800/60 border border-gray-700/60 text-gray-300 text-xs rounded outline-none focus:border-blue-500/50 appearance-none pl-2 pr-6 py-1 cursor-pointer"
                    value={m.role}
                    disabled={loadingId === m.user._id}
                    onChange={e => handleRoleChange(m.user._id, e.target.value)}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    className="btn-icon-tiny btn-delete-tiny text-gray-400 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Remove member"
                    disabled={loadingId === m.user._id}
                    onClick={() => handleRemove(m.user._id)}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span className={`role-badge px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${m.role === 'owner' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' : m.role === 'editor' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'}`}>{m.role}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersPanel;

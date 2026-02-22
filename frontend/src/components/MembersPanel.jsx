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
    <div className="members-panel">
      <div className="panel-header">
        <span className="panel-title">Members</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{members.length}</span>
      </div>

      <div className="panel-list">
        {members.map(m => (
          <div key={m.user._id} className="member-row">
            <div className="member-info">
              <div className="member-avatar">{m.user.username[0].toUpperCase()}</div>
              <div>
                <div className="member-name">{m.user.username}</div>
                <div className="member-email">{m.user.email}</div>
              </div>
            </div>

            <div className="member-actions">
              {isOwner && m.role !== 'owner' ? (
                <>
                  <select
                    className="form-input"
                    style={{ padding: '3px 6px', fontSize: '11px', height: 'auto', width: 'auto' }}
                    value={m.role}
                    disabled={loadingId === m.user._id}
                    onChange={e => handleRoleChange(m.user._id, e.target.value)}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    className="btn-icon-tiny btn-delete-tiny"
                    title="Remove member"
                    disabled={loadingId === m.user._id}
                    onClick={() => handleRemove(m.user._id)}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span className={`role-badge badge-${m.role}`}>{m.role}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersPanel;

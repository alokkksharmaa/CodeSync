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
      const updated = members.map(m => 
        m.user._id === userId ? { ...m, role: newRole } : m
      );
      onMembersChange(updated);
      toast.success('Role updated');
    } catch (err) {
      toast.error('Failed to update role');
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member from workspace?')) return;
    setLoadingId(userId);
    try {
      await removeMember(workspaceId, userId);
      onMembersChange(members.filter(m => m.user._id !== userId));
      toast.success('Member removed');
    } catch (err) {
      toast.error('Failed to remove member');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="members-panel">
      <div className="members-header">
        <span className="members-title">Members ({members.length})</span>
      </div>

      <div className="members-list">
        {members.map((m) => (
          <div key={m.user._id} className="member-item">
            <div className="member-info">
              <span className="member-avatar">
                {m.user.username[0].toUpperCase()}
              </span>
              <div className="member-details">
                <span className="member-name">{m.user.username}</span>
                <span className="member-email">{m.user.email}</span>
              </div>
            </div>

            <div className="member-actions">
              {isOwner && m.role !== 'owner' ? (
                <>
                  <select
                    className="role-select-tiny"
                    value={m.role}
                    disabled={loadingId === m.user._id}
                    onChange={(e) => handleRoleChange(m.user._id, e.target.value)}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    className="btn-remove-member"
                    title="Remove member"
                    disabled={loadingId === m.user._id}
                    onClick={() => handleRemove(m.user._id)}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span className={`role-badge-tiny badge-${m.role}`}>
                  {m.role}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersPanel;

import { useState } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { updateMemberRole, removeMember } from "../services/memberApi";

const roleBadgeClass = (role) => {
  if (role === "owner") return "badge-owner";
  if (role === "editor") return "badge-editor";
  return "badge-viewer";
};

const MembersPanel = ({ workspaceId, members, myRole, onMembersChange }) => {
  const [loadingId, setLoadingId] = useState(null);
  const isOwner = myRole === "owner";

  const handleRoleChange = async (userId, newRole) => {
    setLoadingId(userId);
    try {
      await updateMemberRole(workspaceId, { userId, role: newRole });
      onMembersChange(
        members.map((m) =>
          m.user._id === userId ? { ...m, role: newRole } : m,
        ),
      );
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Remove this member?")) return;
    setLoadingId(userId);
    try {
      await removeMember(workspaceId, userId);
      onMembersChange(members.filter((m) => m.user._id !== userId));
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="members-panel">
      <div className="panel-header">
        <span className="panel-title">Members</span>
        <span className="badge">{members.length}</span>
      </div>

      <div className="panel-list custom-scrollbar">
        {members.map((m) => (
          <div key={m.user._id} className="member-row group">
            <div className="member-info">
              <div className="member-avatar">
                {m.user.username[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="member-name">{m.user.username}</div>
                <div className="member-email">{m.user.email}</div>
              </div>
            </div>

            <div className="member-actions">
              {isOwner && m.role !== "owner" ? (
                <>
                  <select
                    className="form-select py-1.5 px-2 text-xs w-24"
                    value={m.role}
                    disabled={loadingId === m.user._id}
                    onChange={(e) =>
                      handleRoleChange(m.user._id, e.target.value)
                    }
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    className="btn-icon-tiny btn-delete-tiny opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Remove member"
                    disabled={loadingId === m.user._id}
                    onClick={() => handleRemove(m.user._id)}
                  >
                    <X size={13} />
                  </button>
                </>
              ) : (
                <span className={`role-badge ${roleBadgeClass(m.role)}`}>
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

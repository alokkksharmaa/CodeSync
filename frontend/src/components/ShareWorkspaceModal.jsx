import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X, Link2, Copy } from "lucide-react";
import { shareWorkspace } from "../services/workspaceApi";

const ROLE_OPTIONS = [
  { value: "editor", label: "Editor", desc: "Can view and edit code" },
  { value: "viewer", label: "Viewer", desc: "Can view code only" },
];

const roleBadgeClass = (role) => {
  if (role === "owner") return "badge-owner";
  if (role === "editor") return "badge-editor";
  return "badge-viewer";
};

const ShareWorkspaceModal = ({
  workspaceId,
  workspaceName,
  members: initialMembers,
  onClose,
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [members, setMembers] = useState(initialMembers || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMembers(initialMembers || []);
  }, [initialMembers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    setLoading(true);
    try {
      const data = await shareWorkspace(workspaceId, email.trim(), role);
      toast.success(data.message);
      setMembers(data.members);
      setEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to share workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header shrink-0">
          <h2 className="modal-title truncate pr-4">Share "{workspaceName}"</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form mb-6 shrink-0">
          <div className="share-row">
            <div className="form-group flex-1">
              <label htmlFor="share-email" className="form-label">
                Invite by email
              </label>
              <input
                id="share-email"
                type="email"
                className="form-input"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group w-36">
              <label htmlFor="share-role" className="form-label">
                Role
              </label>
              <select
                id="share-role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mt-auto">
              <button
                type="submit"
                className="btn btn-primary h-12 px-6"
                disabled={loading}
              >
                {loading ? <span className="btn-spinner" /> : "Invite"}
              </button>
            </div>
          </div>

          <p className="text-sm text-text-secondary ml-1">
            {ROLE_OPTIONS.find((r) => r.value === role)?.desc}
          </p>
        </form>

        <div className="border-t border-border-subtle pt-4 mt-2 shrink-0">
          <h3 className="panel-title mb-3 flex items-center gap-1.5">
            <Link2 size={13} /> Share Link
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              className="form-input flex-1 h-10 px-3 text-sm text-text-secondary select-all"
              value={`${window.location.origin}/workspace/${workspaceId}`}
              readOnly
              onClick={(e) => e.target.select()}
            />
            <button
              type="button"
              className="btn btn-primary h-10 px-4 text-sm flex items-center gap-1.5"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/workspace/${workspaceId}`,
                  );
                  toast.success("Link copied to clipboard!");
                } catch (err) {
                  toast.error("Failed to copy link. Please copy manually.");
                }
              }}
            >
              <Copy size={14} /> Copy
            </button>
          </div>
        </div>

        {members.length > 0 && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 border-t border-border-subtle pt-6 mt-4">
            <h3 className="panel-title mb-4">Members ({members.length})</h3>
            <div className="flex flex-col gap-2">
              {members.map((m) => (
                <div
                  key={m._id}
                  className="member-row border border-border-subtle rounded-xl bg-surface-raised/20 hover:bg-surface-raised/40"
                >
                  <div className="member-info">
                    <span className="member-avatar w-10 h-10 text-base">
                      {m.userId?.username?.[0]?.toUpperCase() || "?"}
                    </span>
                    <div>
                      <p className="member-name">{m.userId?.username}</p>
                      <p className="member-email">{m.userId?.email}</p>
                    </div>
                  </div>
                  <span className={`role-badge ${roleBadgeClass(m.role)}`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareWorkspaceModal;

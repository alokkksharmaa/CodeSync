import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { fetchWorkspaces, fetchWorkspace } from "../services/workspaceApi";
import api from "../services/api";
import { io } from "socket.io-client";
import CreateWorkspaceModal from "../components/CreateWorkspaceModal";
import {
  Zap,
  LayoutGrid,
  Users,
  Settings,
  LogOut,
  Plus,
  FolderPlus,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const LANG_COLORS = {
  javascript: "#f7df1e",
  typescript: "#3178c6",
  python: "#3572a5",
  java: "#b07219",
  cpp: "#f34b7d",
  go: "#00add8",
  rust: "#dea584",
};

const TIME_AGO = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const roleBadgeClass = (role) => {
  if (role === "owner") return "badge-owner";
  if (role === "editor") return "badge-editor";
  return "badge-viewer";
};

// ─── Workspace Card ───────────────────────────────────────────────────────────
const WorkspaceCard = ({ workspace, role, onClick }) => {
  const langColor = LANG_COLORS[workspace.language] || "#8b5cf6";

  const handlePrefetch = () => fetchWorkspace(workspace._id).catch(() => {});

  return (
    <div className="ws-card" onMouseEnter={handlePrefetch} onClick={onClick}>
      <div className="ws-card-top">
        <span
          className="language-badge"
          style={{
            background: `${langColor}1a`,
            color: langColor,
            border: `1px solid ${langColor}35`,
          }}
        >
          {workspace.language || "js"}
        </span>
        <span className={`role-badge ${roleBadgeClass(role)}`}>{role}</span>
      </div>
      <h3 className="ws-card-name" title={workspace.name}>
        {workspace.name}
      </h3>
      <p className="ws-card-meta">
        {role !== "owner" && workspace.owner?.username
          ? `@${workspace.owner.username} · `
          : ""}
        {TIME_AGO(workspace.updatedAt)}
      </p>
    </div>
  );
};

// ─── Recent Activity ─────────────────────────────────────────────────────────
const RecentActivity = ({ workspaces, refreshTrigger }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    const wsIds = workspaces.map((w) => w.workspace._id);
    if (wsIds.length === 0) {
      setLoading(false);
      return;
    }
    try {
      const all = await Promise.all(
        wsIds
          .slice(0, 5)
          .map((id) =>
            api.get(`/api/workspaces/${id}/activity`).then((r) => r.data),
          ),
      );
      const combined = all
        .flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 12);
      setActivities(combined);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [workspaces]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities, refreshTrigger]);

  const ACTION_LABEL = {
    FILE_UPDATED: "edited",
    FILE_CREATED: "created",
    FILE_DELETED: "deleted",
    FILE_RENAMED: "renamed",
    FOLDER_CREATED: "created folder",
    USER_JOINED: "joined",
    USER_LEFT: "left",
  };

  return (
    <div className="activity-panel">
      <div className="activity-panel-header">Recent Activity</div>
      <div className="activity-list-mini">
        {loading ? (
          <div className="activity-loading">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton skeleton-activity" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="no-activity-mini">No recent activity</p>
        ) : (
          activities.map((act) => (
            <div key={act._id} className="activity-item-mini">
              <span className="activity-dot" />
              <span className="activity-text">
                <strong>{act.metadata?.username || "User"}</strong>{" "}
                <span>{ACTION_LABEL[act.actionType] || "acted"}</span>
                {act.metadata?.name ? <span> {act.metadata.name}</span> : null}
              </span>
              <span className="activity-time">{TIME_AGO(act.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({
  user,
  workspaceCount,
  activeTab,
  onTabChange,
  onLogout,
  onRefresh,
  onSettings,
}) => (
  <aside className="sidebar">
    <div
      className="sidebar-logo"
      onClick={onRefresh}
      title="Refresh workspaces"
    >
      <span className="logo-icon">
        <Zap size={16} strokeWidth={2.5} />
      </span>
      <span className="logo-text">CodeSync</span>
    </div>

    <nav className="sidebar-nav">
      <span className="sidebar-section-label">Navigation</span>

      <div
        className={`sidebar-item ${activeTab === "my" ? "active" : ""}`}
        onClick={() => onTabChange("my")}
      >
        <LayoutGrid size={17} className="sidebar-item-icon" />
        <span>My Workspaces</span>
        {workspaceCount.my > 0 && (
          <span className="sidebar-item-count">{workspaceCount.my}</span>
        )}
      </div>

      <div
        className={`sidebar-item ${activeTab === "shared" ? "active" : ""}`}
        onClick={() => onTabChange("shared")}
      >
        <Users size={17} className="sidebar-item-icon" />
        <span>Shared With Me</span>
        {workspaceCount.shared > 0 && (
          <span className="sidebar-item-count">{workspaceCount.shared}</span>
        )}
      </div>
    </nav>

    <div className="sidebar-footer">
      <div className="sidebar-user" onClick={onSettings}>
        <div className="sidebar-avatar">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-username">@{user?.username}</div>
          <div className="sidebar-user-role">{user?.email}</div>
        </div>
      </div>
      <button
        className="btn btn-ghost w-full justify-start gap-2"
        onClick={onSettings}
      >
        <Settings size={15} /> Settings
      </button>
      <button
        className="btn btn-ghost btn-error w-full justify-start gap-2"
        onClick={onLogout}
      >
        <LogOut size={15} /> Sign out
      </button>
    </div>
  </aside>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshActivity, setRefreshActivity] = useState(0);
  const [activeTab, setActiveTab] = useState("my");

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWorkspaces();
      setWorkspaces(data);
    } catch {
      toast.error("Failed to load workspaces.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (workspaces.length === 0) return;
    const socket = io(BACKEND_URL, { transports: ["websocket"] });
    socket.on("connect", () => {
      workspaces.forEach(({ workspace }) => {
        socket.emit("join_workspace", {
          workspaceId: workspace._id,
          username: user?.username,
          userId: user?.id,
        });
      });
    });
    socket.on("activity_update", () => setRefreshActivity((prev) => prev + 1));
    return () => socket.disconnect();
  }, [workspaces, user]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const handleCreated = (data) => {
    setWorkspaces((prev) => [
      { workspace: data.workspace, role: "owner", addedAt: new Date() },
      ...prev,
    ]);
  };

  const myWorkspaces = workspaces.filter((w) => w.role === "owner");
  const sharedWorkspaces = workspaces.filter((w) => w.role !== "owner");
  const shown = activeTab === "my" ? myWorkspaces : sharedWorkspaces;

  return (
    <div className="dashboard-page">
      <Sidebar
        user={user}
        workspaceCount={{
          my: myWorkspaces.length,
          shared: sharedWorkspaces.length,
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        onRefresh={loadWorkspaces}
        onSettings={() => navigate("/settings")}
      />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-heading">
              {activeTab === "my" ? "My Workspaces" : "Shared With Me"}
            </h1>
            <p className="dashboard-meta">
              {!loading &&
                `${shown.length} workspace${shown.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} strokeWidth={2.5} /> New Workspace
          </button>
        </div>

        <div className="dashboard-content-layout">
          <div className="workspaces-column">
            <div className="ws-section">
              {loading ? (
                <div className="workspace-grid">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="ws-card skeleton skeleton-card" />
                  ))}
                </div>
              ) : shown.length === 0 ? (
                <div className="ws-empty">
                  <span className="w-14 h-14 rounded-full flex items-center justify-center bg-elevated text-muted">
                    {activeTab === "my" ? (
                      <FolderPlus size={24} />
                    ) : (
                      <Users size={24} />
                    )}
                  </span>
                  <p>
                    {activeTab === "my"
                      ? "You haven't created any workspaces yet."
                      : "No workspaces have been shared with you."}
                  </p>
                  {activeTab === "my" && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowCreate(true)}
                    >
                      Create workspace
                    </button>
                  )}
                </div>
              ) : (
                <div className="workspace-grid">
                  {shown.map(({ workspace, role }) => (
                    <WorkspaceCard
                      key={workspace._id}
                      workspace={workspace}
                      role={role}
                      onClick={() => navigate(`/workspace/${workspace._id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="activity-column">
            <RecentActivity
              workspaces={workspaces}
              refreshTrigger={refreshActivity}
            />
          </div>
        </div>
      </main>

      {showCreate && (
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;

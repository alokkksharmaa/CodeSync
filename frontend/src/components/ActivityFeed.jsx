import { useState, useEffect } from "react";
import api from "../services/api";
import {
  FilePlus,
  Trash2,
  Pencil,
  FileEdit,
  FolderPlus,
  LogIn,
  Mail,
  Ban,
  RotateCcw,
  Activity,
} from "lucide-react";

const ACTION_LABELS = {
  FILE_CREATED: { verb: "created", icon: FilePlus },
  FILE_DELETED: { verb: "deleted", icon: Trash2 },
  FILE_RENAMED: { verb: "renamed", icon: Pencil },
  FILE_UPDATED: { verb: "edited", icon: FileEdit },
  FOLDER_CREATED: { verb: "created folder", icon: FolderPlus },
  FOLDER_DELETED: { verb: "deleted folder", icon: FolderPlus },
  USER_JOINED: { verb: "joined the workspace", icon: LogIn },
  USER_LEFT: { verb: "left the workspace", icon: LogIn },
  USER_INVITED: { verb: "invited", icon: Mail },
  MEMBER_REMOVED: { verb: "removed", icon: Ban },
  ROLE_CHANGED: { verb: "changed role for", icon: RotateCcw },
};

const ActivityFeed = ({ socket, workspaceId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    try {
      const res = await api.get(`/api/workspaces/${workspaceId}/activity`);
      setActivities(res.data);
    } catch (error) {
      console.error("[ActivityFeed] Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [workspaceId]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => loadActivities();
    socket.on("activity_update", refresh);
    return () => socket.off("activity_update", refresh);
  }, [socket, workspaceId]);

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="activity-feed-panel">
      <div className="panel-header">
        <span className="panel-title">
          <Activity size={13} /> Activity
        </span>
      </div>
      <div className="panel-list custom-scrollbar">
        {loading ? (
          <div className="p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-activity" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="activity-empty">No recent activity</p>
        ) : (
          <div className="activity-list">
            {activities.map((act, i) => {
              const def = ACTION_LABELS[act.actionType] || {
                verb: "acted",
                icon: Activity,
              };
              const Icon = def.icon;
              const isMemberActivity = ["USER_JOINED", "USER_LEFT"].includes(
                act.actionType,
              );
              const isInviteActivity = act.actionType === "USER_INVITED";
              const isRoleChangeActivity = act.actionType === "ROLE_CHANGED";
              const isMemberRemovedActivity =
                act.actionType === "MEMBER_REMOVED";

              return (
                <div key={act._id || i} className="activity-item">
                  <span className="activity-time">
                    {formatTime(act.createdAt)}
                  </span>
                  <div className="activity-content">
                    <span className="mt-0.5 text-text-muted opacity-80 shrink-0 inline-block mr-2">
                      <Icon size={13} />
                    </span>
                    <div className="inline">
                      <strong>{act.metadata?.username || "User"}</strong>{" "}
                      <span>{def.verb}</span>
                      {isInviteActivity && act.metadata?.invitedUsername ? (
                        <span className="text-secondary-hover ml-1">
                          {act.metadata.invitedUsername}
                        </span>
                      ) : null}
                      {isRoleChangeActivity && act.metadata?.targetUsername ? (
                        <>
                          <span className="text-secondary-hover ml-1">
                            {act.metadata.targetUsername}
                          </span>
                          <span className="text-muted ml-1 text-xs">
                            ({act.metadata.oldRole} → {act.metadata.newRole})
                          </span>
                        </>
                      ) : null}
                      {isMemberRemovedActivity &&
                      act.metadata?.removedUsername ? (
                        <span className="text-error ml-1">
                          {act.metadata.removedUsername}
                        </span>
                      ) : null}
                      {!isMemberActivity &&
                      !isInviteActivity &&
                      !isRoleChangeActivity &&
                      !isMemberRemovedActivity &&
                      act.metadata?.name ? (
                        <span className="text-accent-hover ml-1 font-mono text-xs bg-accent-subtle px-1.5 py-0.5 rounded break-all">
                          {act.metadata.name}
                        </span>
                      ) : null}
                      {act.metadata?.role &&
                      act.actionType === "USER_JOINED" ? (
                        <span className="text-success ml-1 text-xs">
                          as {act.metadata.role}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;

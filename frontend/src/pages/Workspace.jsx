import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { fetchWorkspace } from "../services/workspaceApi";
import api from "../services/api";
import { fetchFileContent } from "../services/fileApi";
import { executeCode } from "../services/codeExecutionApi";
import FileExplorer from "../components/FileExplorer";
import VersionHistory from "../components/VersionHistory";
import MembersPanel from "../components/MembersPanel";
import InviteModal from "../components/InviteModal";
import ActivityFeed from "../components/ActivityFeed";
import CommentsPanel from "../components/CommentsPanel";
import CodeEditor from "../components/CodeEditor";
import CodeExecutionPanel from "../components/CodeExecutionPanel";
import VoiceInput from "../components/VoiceInput";
import VoiceChat from "../components/VoiceChat";
import {
  ArrowLeft,
  Play,
  Loader2,
  MessageSquare,
  Activity,
  History,
  Users,
  UserPlus,
  LogOut,
  Eye,
  FileCode,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const USER_COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#f43f5e",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
];
const randomColor = () =>
  USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

const roleBadgeClass = (role) => {
  if (role === "owner") return "badge-owner";
  if (role === "editor") return "badge-editor";
  return "badge-viewer";
};

const Workspace = () => {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState("viewer");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [executionOutput, setExecutionOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const socketRef = useRef(null);
  const colorRef = useRef(randomColor());
  const isRemoteChange = useRef(false);
  const previousFileRef = useRef(null);
  const currentCodeRef = useRef("");

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    toast.success("Refreshing workspace...", { duration: 1000 });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWorkspace(workspaceId);
        setWorkspace(data.workspace);
        setFiles(data.files || []);
        setMembers(data.members || []);
        setMyRole(data.myRole);

        if (data.files?.length > 0 && !activeFileId) {
          setActiveFileId(data.files[0]._id);
        }
      } catch (err) {
        toast.error("Failed to load workspace");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workspaceId, refreshKey]);

  useEffect(() => {
    if (!activeFileId || loading) return;

    const openFile = async () => {
      try {
        if (
          previousFileRef.current &&
          previousFileRef.current !== activeFileId &&
          currentCodeRef.current !== undefined
        ) {
          try {
            await api.put(`/api/files/${previousFileRef.current}`, {
              content: currentCodeRef.current,
            });
          } catch (saveErr) {
            console.error("[Workspace] Failed to save previous file:", saveErr);
          }
        }

        const file = await fetchFileContent(activeFileId);
        previousFileRef.current = activeFileId;
        currentCodeRef.current = file.content || "";
        isRemoteChange.current = true;
        setCode(file.content || "");

        if (socketRef.current) {
          socketRef.current.emit("join_file", { fileId: activeFileId });
        }
      } catch (err) {
        console.error("[Workspace] Failed to load file:", err);
        toast.error("Failed to load file content");
      }
    };
    openFile();
  }, [activeFileId, loading]);

  useEffect(() => {
    if (loading || !workspace) return;

    const socket = io(BACKEND_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_workspace", {
        workspaceId,
        username: user?.username,
        color: colorRef.current,
        userId: user?.id,
      });

      if (activeFileId) {
        socket.emit("join_file", { fileId: activeFileId });
      }
    });

    socket.on("file_joined", ({ fileId, code: savedCode }) => {
      if (fileId === activeFileId) {
        isRemoteChange.current = true;
        setCode(savedCode);
      }
    });

    socket.on("code_update", ({ fileId, code: remoteCode }) => {
      if (fileId === activeFileId) {
        isRemoteChange.current = true;
        setCode(remoteCode);
      }
    });

    socket.on("file_created", (newFile) => {
      setFiles((prev) => {
        const exists = prev.some((f) => String(f._id) === String(newFile._id));
        if (exists) return prev;
        return [...prev, newFile];
      });
    });

    socket.on("folder_created", (newFolder) => {
      setFiles((prev) => {
        const exists = prev.some(
          (f) => String(f._id) === String(newFolder._id),
        );
        if (exists) return prev;
        return [...prev, newFolder];
      });
    });

    socket.on("file_deleted", ({ fileId, deletedIds }) => {
      const idsToRemove = deletedIds || [fileId];
      setFiles((prev) =>
        prev.filter((f) => !idsToRemove.includes(String(f._id))),
      );
      if (idsToRemove.includes(String(activeFileId))) setActiveFileId(null);
    });

    socket.on("file_renamed", (updatedFile) => {
      setFiles((prev) =>
        prev.map((f) => (f._id === updatedFile._id ? updatedFile : f)),
      );
    });

    socket.on("user_joined", ({ username, role }) => {
      setConnectedUsers((prev) =>
        prev.find((u) => u.username === username)
          ? prev
          : [...prev, { username, role }],
      );
    });

    socket.on("user_left", ({ username }) => {
      setConnectedUsers((prev) => prev.filter((u) => u.username !== username));
    });

    socket.on("member_updated", ({ userId, role }) => {
      setMembers((prev) =>
        prev.map((m) => (m.user._id === userId ? { ...m, role } : m)),
      );

      if (userId === user?.id) {
        setMyRole(role);
        toast(`Your role has been updated to ${role}`, { icon: "🔐" });
        socket.emit("role_sync", { role });
      }
    });

    socket.on("member_removed", ({ userId }) => {
      setMembers((prev) => prev.filter((m) => m.user._id !== userId));

      if (userId === user?.id) {
        toast.error("You have been removed from this workspace");
        navigate("/dashboard");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [loading, workspace, workspaceId, user, activeFileId]);

  const handleCodeChange = useCallback(
    (e) => {
      const newCode = e.target.value;
      setCode(newCode);
      currentCodeRef.current = newCode;

      if (isRemoteChange.current) {
        isRemoteChange.current = false;
        return;
      }

      if (myRole === "viewer") return;

      if (socketRef.current && activeFileId) {
        socketRef.current.emit("code_change", {
          fileId: activeFileId,
          code: newCode,
          userId: user?.id,
        });
      }
    },
    [activeFileId, myRole, user],
  );

  const handleLeaveSession = async () => {
    if (!window.confirm("Are you sure you want to leave this session?")) return;

    try {
      await api.delete(`/api/workspaces/${workspaceId}/session`);
      toast.success("Left workspace session");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Failed to leave session");
      navigate("/dashboard");
    }
  };

  const handleExecuteCode = async () => {
    if (!code.trim()) {
      toast.error("No code to execute");
      return;
    }

    setIsExecuting(true);
    setExecutionOutput("");

    try {
      const result = await executeCode(
        code,
        activeFile?.language || "javascript",
      );

      if (result.error) {
        setExecutionOutput(`Error:\n${result.error}`);
        toast.error("Execution failed");
      } else {
        setExecutionOutput(
          result.output || "Code executed successfully (no output)",
        );
        toast.success("Code executed");
      }
    } catch (err) {
      setExecutionOutput(`Execution Error:\n${err.message}`);
      toast.error(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const activeFile = files.find((f) => f._id === activeFileId);
  const canEdit = myRole === "owner" || myRole === "editor";
  const isOwner = myRole === "owner";

  const handleVoiceTranscript = useCallback(
    (transcript) => {
      if (!canEdit || !activeFileId) return;

      const newCode = code + transcript + " ";
      setCode(newCode);
      currentCodeRef.current = newCode;

      if (socketRef.current && activeFileId) {
        socketRef.current.emit("code_change", {
          fileId: activeFileId,
          code: newCode,
          userId: user?.id,
        });
      }
    },
    [code, canEdit, activeFileId, user],
  );

  if (loading)
    return (
      <div className="workspace-page">
        <header className="ws-topbar skeleton ws-topbar-skeleton" />
        <div className="ws-skeleton-layout">
          <div className="skeleton ws-sidebar-skeleton" />
          <div className="skeleton skeleton-editor" />
        </div>
      </div>
    );

  return (
    <div className="workspace-page">
      <header className="ws-topbar">
        <div className="ws-topbar-left">
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => navigate("/dashboard")}
            title="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="ws-breadcrumb">
            <span
              className="ws-breadcrumb-ws"
              onClick={handleRefresh}
              title="Click to refresh"
            >
              {workspace?.name}
            </span>
            {activeFile && (
              <>
                <span className="ws-breadcrumb-sep">/</span>
                <span className="ws-breadcrumb-file">{activeFile.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="ws-topbar-right">
          <div className="presence-row">
            {connectedUsers.map((u, i) => (
              <span
                key={i}
                className={`presence-avatar ${u.role === "owner" ? "owner" : ""}`}
                title={`${u.username} (${u.role})`}
              >
                {u.username[0].toUpperCase()}
              </span>
            ))}
          </div>

          {connectedUsers.length > 0 && <span className="topbar-divider" />}

          <span className={`role-badge ${roleBadgeClass(myRole)}`}>
            {myRole}
          </span>

          <span className="topbar-divider" />

          <VoiceChat
            socket={socketRef.current}
            workspaceId={workspaceId}
            userId={user?.id}
            username={user?.username}
          />

          <span className="topbar-divider" />

          <div className="topbar-actions">
            {activeFileId && canEdit && (
              <>
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  disabled={!canEdit || !activeFileId}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleExecuteCode}
                  disabled={isExecuting}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Running...
                    </>
                  ) : (
                    <>
                      <Play size={14} fill="currentColor" /> Run
                    </>
                  )}
                </button>
                <span className="topbar-divider" />
              </>
            )}
            <button
              className={`btn btn-ghost ${showComments ? "active" : ""}`}
              onClick={() => {
                setShowMembers(false);
                setShowHistory(false);
                setShowActivity(false);
                setShowComments(!showComments);
              }}
            >
              <MessageSquare size={14} /> Comments
            </button>
            <button
              className={`btn btn-ghost ${showActivity ? "active" : ""}`}
              onClick={() => {
                setShowMembers(false);
                setShowHistory(false);
                setShowComments(false);
                setShowActivity(!showActivity);
              }}
            >
              <Activity size={14} /> Activity
            </button>
            <button
              className={`btn btn-ghost ${showHistory ? "active" : ""}`}
              onClick={() => {
                setShowMembers(false);
                setShowActivity(false);
                setShowComments(false);
                setShowHistory(!showHistory);
              }}
            >
              <History size={14} /> History
            </button>
            <button
              className={`btn btn-ghost ${showMembers ? "active" : ""}`}
              onClick={() => {
                setShowHistory(false);
                setShowActivity(false);
                setShowComments(false);
                setShowMembers(!showMembers);
              }}
            >
              <Users size={14} /> Members
            </button>
            {isOwner && (
              <button
                className="btn btn-primary"
                onClick={() => setShowInvite(true)}
              >
                <UserPlus size={14} /> Invite
              </button>
            )}
            <button
              className="btn btn-ghost btn-error"
              onClick={handleLeaveSession}
            >
              <LogOut size={14} /> Leave
            </button>
          </div>
        </div>
      </header>

      <div className="workspace-layout">
        <FileExplorer
          workspaceId={workspaceId}
          socket={socketRef.current}
          files={files}
          activeFileId={activeFileId}
          onFileSelect={setActiveFileId}
          onFilesChange={setFiles}
          canEdit={canEdit}
        />

        <div className="editor-container">
          {myRole === "viewer" && (
            <div className="viewer-banner">
              <Eye size={14} /> Read-only access — contact the owner to request
              edit permissions.
            </div>
          )}
          {!activeFileId ? (
            <div className="no-file-selected">
              <FileCode size={44} strokeWidth={1.5} className="opacity-40" />
              <p>Select a file to start coding</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  value={code}
                  onChange={handleCodeChange}
                  language={activeFile?.language || "javascript"}
                  readOnly={!canEdit}
                  onExecute={canEdit ? handleExecuteCode : null}
                  isExecuting={isExecuting}
                />
              </div>
              {activeFileId && (
                <CodeExecutionPanel
                  output={executionOutput}
                  isExecuting={isExecuting}
                  onClear={() => setExecutionOutput("")}
                />
              )}
            </>
          )}
        </div>

        {showHistory && activeFileId && (
          <VersionHistory
            fileId={activeFileId}
            canEdit={canEdit}
            onRestore={(restoredCode) => {
              setCode(restoredCode);
              socketRef.current?.emit("code_change", {
                fileId: activeFileId,
                code: restoredCode,
                userId: user?.id,
              });
            }}
          />
        )}

        {showMembers && (
          <MembersPanel
            workspaceId={workspaceId}
            members={members}
            myRole={myRole}
            onMembersChange={setMembers}
          />
        )}

        {showActivity && (
          <ActivityFeed socket={socketRef.current} workspaceId={workspaceId} />
        )}

        {showComments && (
          <CommentsPanel workspaceId={workspaceId} socket={socketRef.current} />
        )}
      </div>

      {showInvite && (
        <InviteModal
          workspaceId={workspaceId}
          workspaceName={workspace?.name}
          onInviteSuccess={(newMember) => setMembers([...members, newMember])}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
};

export default Workspace;

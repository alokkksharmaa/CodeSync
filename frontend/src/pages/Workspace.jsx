import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { fetchWorkspace } from '../services/workspaceApi';
import { fetchFileContent } from '../services/fileApi';
import ShareWorkspaceModal from '../components/ShareWorkspaceModal';
import FileExplorer from '../components/FileExplorer';
import VersionHistory from '../components/VersionHistory';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const USER_COLORS = ['#7c6aff', '#f87171', '#4ade80', '#facc15', '#38bdf8', '#fb923c', '#c084fc'];
const randomColor = () => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

const Workspace = () => {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState('viewer');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);

  const socketRef = useRef(null);
  const colorRef = useRef(randomColor());
  const isRemoteChange = useRef(false);

  // ── Load workspace & initial file list ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWorkspace(workspaceId);
        setWorkspace(data.workspace);
        setFiles(data.files || []);
        setMembers(data.members);
        setMyRole(data.myRole);
        
        // Auto-select first file if available
        if (data.files?.length > 0) {
          setActiveFileId(data.files[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load workspace');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workspaceId]);

  // ── Open specific file ───────────────────────────────────────────────────
  useEffect(() => {
    if (!activeFileId || loading) return;

    const openFile = async () => {
      try {
        const file = await fetchFileContent(activeFileId);
        setCode(file.content);
        
        if (socketRef.current) {
          socketRef.current.emit('join_file', { fileId: activeFileId });
        }
      } catch (err) {
        toast.error('Failed to load file content');
      }
    };
    openFile();
  }, [activeFileId, loading]);

  // ── Socket.IO Setup ───────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !workspace) return;

    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_workspace', {
        workspaceId,
        username: user?.username,
        color: colorRef.current,
      });
      
      if (activeFileId) {
        socket.emit('join_file', { fileId: activeFileId });
      }
    });

    socket.on('file_joined', ({ fileId, code: savedCode }) => {
      if (fileId === activeFileId) {
        isRemoteChange.current = true;
        setCode(savedCode);
      }
    });

    socket.on('code_update', ({ fileId, code: remoteCode }) => {
      if (fileId === activeFileId) {
        isRemoteChange.current = true;
        setCode(remoteCode);
      }
    });

    socket.on('user_joined', ({ username }) => {
      setConnectedUsers((prev) =>
        prev.find((u) => u.username === username) ? prev : [...prev, { username }]
      );
    });

    socket.on('user_left', ({ username }) => {
      setConnectedUsers((prev) => prev.filter((u) => u.username !== username));
    });

    return () => {
      socket.disconnect();
    };
  }, [loading, workspace, workspaceId, user]);

  const handleCodeChange = useCallback(
    (e) => {
      const newCode = e.target.value;
      setCode(newCode);

      if (isRemoteChange.current) {
        isRemoteChange.current = false;
        return;
      }

      if (myRole === 'viewer') return;

      if (socketRef.current) {
        socketRef.current.emit('code_change', {
          fileId: activeFileId,
          code: newCode,
          userId: user?.id,
        });
      }
    },
    [activeFileId, myRole, user]
  );

  const activeFile = files.find(f => f._id === activeFileId);
  const canEdit = myRole === 'owner' || myRole === 'editor';

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="workspace-page">
      <header className="ws-topbar">
        <div className="ws-topbar-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
          <div className="ws-name-badge">
            <span className="ws-topbar-name">{workspace?.name}</span>
            {activeFile && (
              <span className="active-file-badge">{activeFile.name}</span>
            )}
          </div>
        </div>

        <div className="ws-topbar-right">
          <div className="presence-row">
            {connectedUsers.map((u) => (
              <span key={u.username} className="presence-avatar" title={u.username}>
                {u.username[0].toUpperCase()}
              </span>
            ))}
          </div>

          <span className={`role-badge ${myRole === 'owner' ? 'badge-owner' : myRole === 'editor' ? 'badge-editor' : 'badge-viewer'}`}>
            {myRole}
          </span>

          <button className={`btn btn-ghost btn-sm ${showHistory ? 'active' : ''}`} onClick={() => setShowHistory(!showHistory)}>
            ⏳ History
          </button>

          {myRole === 'owner' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowShare(true)}>
              Share
            </button>
          )}
        </div>
      </header>

      <div className="workspace-layout">
        <FileExplorer
          workspaceId={workspaceId}
          files={files}
          activeFileId={activeFileId}
          onFileSelect={setActiveFileId}
          onFilesChange={setFiles}
          canEdit={canEdit}
        />

        <div className="editor-container">
          {!canEdit && (
            <div className="viewer-banner">
              👁 Read-only access — edits disabled.
            </div>
          )}
          {!activeFileId ? (
            <div className="no-file-selected">
              Select a file to start coding
            </div>
          ) : (
            <textarea
              className="code-editor"
              value={code}
              onChange={handleCodeChange}
              readOnly={!canEdit}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              placeholder={`// Coding in ${activeFile?.language}...`}
            />
          )}
        </div>

        {showHistory && activeFileId && (
          <VersionHistory
            fileId={activeFileId}
            canEdit={canEdit}
            onRestore={(restoredCode) => {
              setCode(restoredCode);
              socketRef.current?.emit('code_change', {
                fileId: activeFileId,
                code: restoredCode,
                userId: user?.id,
              });
            }}
          />
        )}
      </div>

      {showShare && (
        <ShareWorkspaceModal
          workspaceId={workspaceId}
          workspaceName={workspace?.name}
          members={members}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
};

export default Workspace;

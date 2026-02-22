import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { fetchWorkspace } from '../services/workspaceApi';
import api from '../services/api'; // Added for leaveSession
import { fetchFileContent } from '../services/fileApi';
import FileExplorer from '../components/FileExplorer';
import VersionHistory from '../components/VersionHistory';
import MembersPanel from '../components/MembersPanel';
import InviteModal from '../components/InviteModal';
import ActivityFeed from '../components/ActivityFeed';

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
  const [showInvite, setShowInvite] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const socketRef = useRef(null);
  const colorRef = useRef(randomColor());
  const isRemoteChange = useRef(false);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    toast.success('Refreshing workspace...', { duration: 1000 });
  }, []);

  // ── Load workspace & initial file list ────────────────────────────────────
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
        toast.error('Failed to load workspace');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workspaceId, refreshKey]);

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
        userId: user?.id
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

    socket.on('file_created', (newFile) => {
      setFiles(prev => prev.find(f => f._id === newFile._id) ? prev : [...prev, newFile]);
    });

    socket.on('file_deleted', ({ fileId }) => {
      setFiles(prev => prev.filter(f => f._id !== fileId));
      if (activeFileId === fileId) setActiveFileId(null);
    });

    socket.on('file_renamed', (updatedFile) => {
      setFiles(prev => prev.map(f => f._id === updatedFile._id ? updatedFile : f));
    });

    socket.on('user_joined', ({ username, role }) => {
      setConnectedUsers((prev) =>
        prev.find((u) => u.username === username) ? prev : [...prev, { username, role }]
      );
    });

    socket.on('user_left', ({ username }) => {
      setConnectedUsers((prev) => prev.filter((u) => u.username !== username));
    });

    socket.on('member_updated', ({ userId, role }) => {
      setMembers(prev => prev.map(m => 
        m.user._id === userId ? { ...m, role } : m
      ));

      if (userId === user?.id) {
        setMyRole(role);
        toast(`Your role has been updated to ${role}`, { icon: '🔐' });
        socket.emit('role_sync', { role });
      }
    });

    socket.on('member_removed', ({ userId }) => {
      setMembers(prev => prev.filter(m => m.user._id !== userId));
      
      if (userId === user?.id) {
        toast.error('You have been removed from this workspace');
        navigate('/dashboard');
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

  const handleLeaveSession = async () => {
    if (!window.confirm('Are you sure you want to leave this session?')) return;
    
    try {
      await api.delete(`/api/workspaces/${workspaceId}/session`);
      toast.success('Left workspace session');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to leave session');
      navigate('/dashboard');
    }
  };

  const activeFile = files.find(f => f._id === activeFileId);
  const canEdit = myRole === 'owner' || myRole === 'editor';
  const isOwner = myRole === 'owner';

  if (loading) return (
    <div className="workspace-page">
      <header className="ws-topbar skeleton" style={{ height: '64px', width: '100%', borderRadius: 0 }} />
      <div className="ws-skeleton-layout">
        <div className="file-explorer skeleton" style={{ width: '260px', height: '100%', borderRadius: 0 }} />
        <div className="editor-container skeleton skeleton-editor" style={{ borderRadius: 0 }} />
      </div>
    </div>
  );

  return (
    <div className="workspace-page">
      <header className="ws-topbar">
        <div className="ws-topbar-left" onClick={handleRefresh} style={{ cursor: 'pointer' }} title="Click to refresh workspace">
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate('/dashboard'); }}>
            ← Dashboard
          </button>
          <div className="ws-name-badge">
            <span className="ws-topbar-name">{workspace?.name}</span>
            {activeFile && (
              <span className="active-file-badge">{activeFile.name || 'main.js'}</span>
            )}
          </div>
        </div>

        <div className="ws-topbar-right">
          <div className="presence-row">
            {connectedUsers.map((u, i) => (
              <span key={i} className={`presence-avatar ${u.role === 'owner' ? 'ring-owner' : ''}`} title={`${u.username} (${u.role})`}>
                {u.username[0].toUpperCase()}
              </span>
            ))}
          </div>

          <span className={`role-badge ${myRole === 'owner' ? 'badge-owner' : myRole === 'editor' ? 'badge-editor' : 'badge-viewer'}`}>
            {myRole}
          </span>

          <div className="topbar-actions">
            <button className={`btn btn-ghost btn-sm ${showActivity ? 'active' : ''}`} onClick={() => { setShowMembers(false); setShowHistory(false); setShowActivity(!showActivity); }}>
              🔔 Activity
            </button>

            <button className={`btn btn-ghost btn-sm ${showHistory ? 'active' : ''}`} onClick={() => { setShowMembers(false); setShowActivity(false); setShowHistory(!showHistory); }}>
              ⏳ History
            </button>

            <button className={`btn btn-ghost btn-sm ${showMembers ? 'active' : ''}`} onClick={() => { setShowHistory(false); setShowActivity(false); setShowMembers(!showMembers); }}>
              👥 Members
            </button>

            {isOwner && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
                Invite
              </button>
            )}

            <button className="btn btn-ghost btn-sm btn-error" onClick={handleLeaveSession} title="Leave Session">
              Leave
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
          {myRole === 'viewer' && (
            <div className="viewer-banner">
              👁 Read-only access — contact the owner to request edit permissions.
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

        {showMembers && (
          <MembersPanel
            workspaceId={workspaceId}
            members={members}
            myRole={myRole}
            onMembersChange={setMembers}
          />
        )}

        {showActivity && (
          <ActivityFeed
            socket={socketRef.current}
            workspaceId={workspaceId}
          />
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


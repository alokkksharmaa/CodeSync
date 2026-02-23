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

    socket.on('folder_created', (newFolder) => {
      setFiles(prev => prev.find(f => f._id === newFolder._id) ? prev : [...prev, newFolder]);
    });

    socket.on('file_deleted', ({ fileId, deletedIds }) => {
      const idsToRemove = deletedIds || [fileId];
      setFiles(prev => prev.filter(f => !idsToRemove.includes(String(f._id))));
      if (idsToRemove.includes(String(activeFileId))) setActiveFileId(null);
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
      <header className="ws-topbar skeleton" style={{ height: 'var(--topbar-height)', borderRadius: 0 }} />
      <div className="ws-skeleton-layout">
        <div style={{ width: '220px', height: '100%' }} className="skeleton" />
        <div className="skeleton skeleton-editor" />
      </div>
    </div>
  );

  return (
    <div className="workspace-page flex flex-col h-screen bg-[#0B0C10] overflow-hidden">
      <header className="ws-topbar flex items-center justify-between px-4 sm:px-6 h-16 bg-gray-900/40 backdrop-blur-xl border-b border-gray-800/60 shrink-0 z-20">
        <div className="ws-topbar-left flex items-center gap-4">
          <button
            className="btn bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg transition"
            onClick={() => navigate('/dashboard')}
            title="Back to dashboard"
          >
            ←
          </button>
          <div className="ws-breadcrumb flex items-center gap-2">
            <span
              className="ws-breadcrumb-ws font-display text-lg font-semibold text-gray-200 hover:text-blue-400 cursor-pointer transition-colors"
              onClick={handleRefresh}
              title="Click to refresh"
            >
              {workspace?.name}
            </span>
            {activeFile && (
              <>
                <span className="ws-breadcrumb-sep text-gray-600">/</span>
                <span className="ws-breadcrumb-file text-gray-400 font-medium">{activeFile.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="ws-topbar-right flex items-center gap-4">
          <div className="presence-row flex items-center -space-x-2">
            {connectedUsers.map((u, i) => (
              <span
                key={i}
                className={`presence-avatar w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-[#0B0C10] shadow-sm ${u.role === 'owner' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}
                title={`${u.username} (${u.role})`}
              >
                {u.username[0].toUpperCase()}
              </span>
            ))}
          </div>

          {connectedUsers.length > 0 && <span className="topbar-divider w-px h-6 bg-gray-700/60" />}

          <span className={`role-badge px-2.5 py-1 rounded-full text-xs font-semibold ${myRole === 'owner' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' : myRole === 'editor' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'}`}>
            {myRole}
          </span>

          <span className="topbar-divider w-px h-6 bg-gray-700/60" />

          <div className="topbar-actions flex items-center gap-1.5">
            <button
              className={`btn px-3 py-1.5 rounded-lg text-sm font-medium transition ${showActivity ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
              onClick={() => { setShowMembers(false); setShowHistory(false); setShowActivity(!showActivity); }}
            >
              Activity
            </button>
            <button
              className={`btn px-3 py-1.5 rounded-lg text-sm font-medium transition ${showHistory ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
              onClick={() => { setShowMembers(false); setShowActivity(false); setShowHistory(!showHistory); }}
            >
              History
            </button>
            <button
              className={`btn px-3 py-1.5 rounded-lg text-sm font-medium transition ${showMembers ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
              onClick={() => { setShowHistory(false); setShowActivity(false); setShowMembers(!showMembers); }}
            >
              Members
            </button>
            {isOwner && (
              <button className="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-md shadow-blue-500/10 transition hover:-translate-y-0.5 ml-1" onClick={() => setShowInvite(true)}>
                Invite
              </button>
            )}
            <button className="btn px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition ml-1" onClick={handleLeaveSession}>
              Leave
            </button>
          </div>
        </div>
      </header>

      <div className="workspace-layout flex-1 flex overflow-hidden">
        <FileExplorer
          workspaceId={workspaceId}
          socket={socketRef.current}
          files={files}
          activeFileId={activeFileId}
          onFileSelect={setActiveFileId}
          onFilesChange={setFiles}
          canEdit={canEdit}
        />

        <div className="editor-container flex-1 flex flex-col relative bg-[#0B0C10]">
          {myRole === 'viewer' && (
            <div className="viewer-banner bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-400 text-sm py-2 px-4 flex items-center justify-center gap-2 backdrop-blur-md sticky top-0 z-10 font-medium">
              👁 Read-only access — contact the owner to request edit permissions.
            </div>
          )}
          {!activeFileId ? (
            <div className="no-file-selected flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
              <span className="text-5xl opacity-40 mb-4">📄</span>
              <p className="text-lg">Select a file to start coding</p>
            </div>
          ) : (
            <textarea
              className="code-editor flex-1 w-full bg-transparent text-gray-300 font-mono text-base leading-relaxed p-6 resize-none focus:outline-none placeholder-gray-700/50"
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


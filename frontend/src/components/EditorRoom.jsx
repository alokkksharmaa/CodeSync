import { useState, useEffect, useRef, useMemo } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import MonacoEditor from './MonacoEditor';
import { generateUsername, generateUserColor } from '../utils/userUtils';

function EditorRoom({ roomId, onLeave }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [userCount, setUserCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState([]);
  const isLocalChange = useRef(false);
  
  // Generate user identity once
  const userIdentity = useMemo(() => ({
    username: generateUsername(),
    color: generateUserColor()
  }), []);

  useEffect(() => {
    // Connect to socket server
    connectSocket();

    // Socket event listeners
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', {
        roomId,
        username: userIdentity.username,
        color: userIdentity.color
      });
    });

    socket.on('room_joined', ({ content, language: roomLanguage, users }) => {
      setCode(content);
      setLanguage(roomLanguage || 'javascript');
      // Initialize with existing users in room
      setRemoteCursors(users || []);
    });

    socket.on('code_update', ({ content }) => {
      // Mark as remote update to prevent cursor reset
      isLocalChange.current = false;
      setCode(content);
    });

    socket.on('user_joined', ({ userId, username, color, cursor, userCount: count }) => {
      setUserCount(count);
      // Add new user to remote cursors
      setRemoteCursors(prev => [...prev, { userId, username, color, cursor }]);
    });

    socket.on('user_left', ({ userId, userCount: count }) => {
      setUserCount(count);
      // Remove user from remote cursors
      setRemoteCursors(prev => prev.filter(user => user.userId !== userId));
    });

    socket.on('cursor_update', ({ userId, cursor }) => {
      // Update cursor position for specific user
      setRemoteCursors(prev =>
        prev.map(user =>
          user.userId === userId ? { ...user, cursor } : user
        )
      );
    });

    socket.on('language_update', ({ language: newLanguage }) => {
      // Update language when changed by another user
      setLanguage(newLanguage);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave_room', roomId);
      disconnectSocket();
    };
  }, [roomId]);

  /**
   * Handle code changes from Monaco editor
   * Debounced updates are emitted to server
   */
  const handleCodeChange = (newCode) => {
    // Mark as local change
    isLocalChange.current = true;
    setCode(newCode);
    
    // Emit change to server (already debounced in MonacoEditor)
    socket.emit('code_change', { roomId, content: newCode });
  };

  /**
   * Handle cursor position changes from Monaco editor
   * Throttled updates are emitted to server
   */
  const handleCursorChange = (cursor) => {
    socket.emit('cursor_position', { roomId, cursor });
  };

  /**
   * Handle language changes from dropdown
   * Emits language_change event to sync with other users
   */
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    socket.emit('language_change', { roomId, language: newLanguage });
  };

  const handleLeave = () => {
    socket.emit('leave_room', roomId);
    onLeave();
  };

  return (
    <div className="editor-container">
      <header className="editor-header">
        <div className="header-left">
          <h2>CodeSync</h2>
          <span className="room-badge">Room: {roomId}</span>
        </div>
        <div className="header-right">
          <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </span>
          <span className="user-count">{userCount} user{userCount !== 1 ? 's' : ''}</span>
          <button onClick={handleLeave} className="leave-button">
            Leave Room
          </button>
        </div>
      </header>
      
      {/* Language selector */}
      <div className="language-selector">
        <label htmlFor="language-dropdown">Language:</label>
        <select 
          id="language-dropdown"
          value={language} 
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="language-dropdown"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
        </select>
      </div>
      
      <MonacoEditor 
        code={code} 
        language={language}
        onChange={handleCodeChange}
        onCursorChange={handleCursorChange}
        remoteCursors={remoteCursors}
      />
    </div>
  );
}

export default EditorRoom;

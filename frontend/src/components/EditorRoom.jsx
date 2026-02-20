import { useState, useEffect, useRef } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import MonacoEditor from './MonacoEditor';
import ResizablePanel from './ResizablePanel';
import authService from '../services/authService';

function EditorRoom({ roomId, onLeave }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [userCount, setUserCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState([]);
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [outputLayout, setOutputLayout] = useState('horizontal'); // 'horizontal' or 'vertical'
  const isLocalChange = useRef(false);
  
  const user = authService.getUser();

  useEffect(() => {
    // Connect to socket server
    connectSocket();

    // Socket event listeners
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', { roomId });
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

    socket.on('execution_result', ({ username, result, timestamp }) => {
      // Display execution result
      const output = formatExecutionResult(username, result, timestamp);
      setOutput(output);
      setShowOutput(true);
      setIsExecuting(false);
    });

    socket.on('execution_error', ({ error }) => {
      setOutput(`Error: ${error}`);
      setShowOutput(true);
      setIsExecuting(false);
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
   * Updates are debounced in MonacoEditor before calling this
   */
  const handleCodeChange = (newCode) => {
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

  /**
   * Handle code execution
   */
  const handleExecuteCode = () => {
    setIsExecuting(true);
    setOutput('Executing...');
    setShowOutput(true);
    socket.emit('execute_code', { roomId, code, language });
  };

  /**
   * Format execution result for display
   */
  const formatExecutionResult = (username, result, timestamp) => {
    const time = new Date(timestamp).toLocaleTimeString();
    let output = `[${time}] Executed by ${username}\n`;
    output += `Status: ${result.status}\n`;
    output += `Time: ${result.time}s | Memory: ${result.memory}KB\n\n`;
    
    if (result.stdout) {
      output += `Output:\n${result.stdout}\n`;
    }
    
    if (result.stderr) {
      output += `\nErrors:\n${result.stderr}`;
    }
    
    return output;
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
        
        <button 
          onClick={handleExecuteCode}
          className="run-button"
          disabled={isExecuting || !code.trim()}
        >
          {isExecuting ? '⏳ Running...' : '▶ Run Code'}
        </button>

        <button 
          onClick={() => setShowOutput(!showOutput)}
          className="toggle-output-button"
        >
          {showOutput ? '📋 Hide Output' : '📋 Show Output'}
        </button>

        {showOutput && (
          <>
            <button 
              onClick={() => setOutputLayout('horizontal')}
              className={`layout-button ${outputLayout === 'horizontal' ? 'active' : ''}`}
              title="Side by side"
            >
              ⬌
            </button>
            <button 
              onClick={() => setOutputLayout('vertical')}
              className={`layout-button ${outputLayout === 'vertical' ? 'active' : ''}`}
              title="Top and bottom"
            >
              ⬍
            </button>
          </>
        )}
      </div>
      
      <div className="editor-layout">
        {showOutput ? (
          <ResizablePanel 
            direction={outputLayout}
            defaultSize={outputLayout === 'horizontal' ? 60 : 70}
            minSize={30}
            maxSize={80}
          >
            <MonacoEditor 
              code={code} 
              language={language}
              onChange={handleCodeChange}
              onCursorChange={handleCursorChange}
              remoteCursors={remoteCursors}
            />
            
            <div className="output-panel">
              <div className="output-header">
                <h3>Output</h3>
                <button 
                  onClick={() => setOutput('')}
                  className="clear-button"
                >
                  Clear
                </button>
              </div>
              <pre className="output-content">{output || 'No output yet. Click "Run Code" to execute.'}</pre>
            </div>
          </ResizablePanel>
        ) : (
          <MonacoEditor 
            code={code} 
            language={language}
            onChange={handleCodeChange}
            onCursorChange={handleCursorChange}
            remoteCursors={remoteCursors}
          />
        )}
      </div>
    </div>
  );
}

export default EditorRoom;

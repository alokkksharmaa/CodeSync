import { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import RemoteCursor from './RemoteCursor';
import { throttle } from '../utils/userUtils';

/**
 * MonacoEditor - Monaco-based code editor with real-time sync and cursor tracking
 * Handles cursor preservation, debounced updates, and remote cursor rendering
 */
function MonacoEditor({ code, onChange, onCursorChange, remoteCursors = [] }) {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const isRemoteChange = useRef(false);
  const debounceTimer = useRef(null);
  const [cursorPositions, setCursorPositions] = useState({});

  /**
   * Called when Monaco editor mounts
   */
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    
    // Focus editor on mount
    editor.focus();

    // Track cursor position changes (throttled to 100ms)
    const throttledCursorChange = throttle(() => {
      const position = editor.getPosition();
      if (position && onCursorChange) {
        onCursorChange({
          line: position.lineNumber,
          column: position.column
        });
      }
    }, 100);

    // Listen to cursor position changes
    editor.onDidChangeCursorPosition(throttledCursorChange);
  };

  /**
   * Handle local content changes (user typing)
   * Debounce to avoid flooding server with updates
   */
  const handleEditorChange = (value) => {
    // Skip if this change came from remote update
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }

    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce: emit after 300ms of no typing
    debounceTimer.current = setTimeout(() => {
      onChange(value || '');
    }, 300);
  };

  /**
   * Apply remote updates without resetting cursor
   */
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const currentValue = editor.getValue();

    // Only update if content actually changed
    if (currentValue !== code) {
      // Save cursor position
      const position = editor.getPosition();
      const scrollTop = editor.getScrollTop();

      // Mark as remote change to prevent echo
      isRemoteChange.current = true;

      // Update content
      editor.setValue(code);

      // Restore cursor position if valid
      if (position) {
        editor.setPosition(position);
      }
      editor.setScrollTop(scrollTop);
    }
  }, [code]);

  /**
   * Convert Monaco line/column to pixel coordinates for cursor rendering
   */
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const newPositions = {};

    remoteCursors.forEach(user => {
      if (user.cursor) {
        // Get pixel position from line/column
        const position = editor.getScrolledVisiblePosition({
          lineNumber: user.cursor.line,
          column: user.cursor.column
        });

        if (position) {
          newPositions[user.userId] = {
            left: position.left,
            top: position.top
          };
        }
      }
    });

    setCursorPositions(newPositions);
  }, [remoteCursors]);

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '100%' }}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        defaultValue={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
      
      {/* Render remote cursors */}
      {remoteCursors.map(user => (
        <RemoteCursor
          key={user.userId}
          username={user.username}
          color={user.color}
          position={cursorPositions[user.userId]}
        />
      ))}
    </div>
  );
}

export default MonacoEditor;

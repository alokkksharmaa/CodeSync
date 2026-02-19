# Monaco Editor Integration

## Changes Made

### 1. Dependencies
Added `@monaco-editor/react` to package.json

### 2. New Component: MonacoEditor.jsx
Created a reusable Monaco editor component with:

- **Client-side loading**: Monaco loads only in browser (Vite handles this automatically)
- **Cursor preservation**: Remote updates don't reset cursor position
- **Debounced updates**: 300ms debounce to avoid flooding server
- **Echo prevention**: Local changes don't trigger remote update handlers

### 3. Updated EditorRoom.jsx
- Replaced CodeEditor with MonacoEditor
- Added `isLocalChange` ref to track update source
- Integrated debounced change handler

## How It Works

### Local Changes (User Typing)
1. User types in Monaco editor
2. `handleEditorChange` is called
3. Debounce timer waits 300ms
4. After 300ms of no typing, `onChange` emits to server
5. Server broadcasts to other users

### Remote Changes (From Other Users)
1. Server sends `code_update` event
2. `isRemoteChange` flag is set
3. Monaco content updates via `setValue()`
4. Cursor position is preserved
5. Flag prevents echo back to server

## Monaco Configuration

```javascript
options={{
  minimap: { enabled: false },      // No minimap for cleaner UI
  fontSize: 14,                     // Readable font size
  lineNumbers: 'on',                // Show line numbers
  scrollBeyondLastLine: false,      // Cleaner scrolling
  automaticLayout: true,            // Auto-resize
  tabSize: 2,                       // 2-space tabs
  wordWrap: 'on',                   // Wrap long lines
}}
```

## Installation

```bash
cd frontend
npm install
npm run dev
```

Monaco will be automatically loaded by Vite.

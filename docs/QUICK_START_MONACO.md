# Quick Start: Monaco Editor & Code Execution

## Installation

```bash
# Install backend dependencies
cd backend
npm install

# Frontend already has Monaco Editor installed
```

## Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Try It Out

1. Open your workspace
2. Select or create a JavaScript file
3. Write some code:
   ```javascript
   console.log('Hello Monaco!');
   const result = 5 + 10;
   console.log('Result:', result);
   ```
4. Click **"▶️ Run"** or press **Ctrl+Enter**
5. See output in the panel below

## Features at a Glance

✅ Professional code editor (Monaco - same as VS Code)  
✅ Syntax highlighting for 20+ languages  
✅ IntelliSense & auto-completion  
✅ Code execution for JavaScript  
✅ Real-time collaboration still works  
✅ Output panel with error handling  
✅ Keyboard shortcuts (Ctrl+Enter to run)  

## What Changed

- Replaced `<textarea>` with Monaco Editor
- Added "Run" button in top bar
- Added execution output panel at bottom
- Created `/api/execute` endpoint
- Sandboxed code execution with vm2

That's it! Your collaborative workspace now has a professional code editor with execution capabilities. 🎉

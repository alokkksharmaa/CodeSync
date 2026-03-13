# Monaco Editor with Code Execution - Setup Guide

## What's New

Your workspace now includes:
- **Monaco Editor**: Professional code editor (same as VS Code)
- **Code Execution**: Run JavaScript code directly in the browser
- **Syntax Highlighting**: Support for 20+ languages
- **IntelliSense**: Auto-completion and suggestions
- **Keyboard Shortcuts**: Ctrl+Enter to run code

## Installation

### Backend
```bash
cd backend
npm install
```

This will install `vm2` for sandboxed JavaScript execution.

### Frontend
Monaco Editor is already installed (`@monaco-editor/react`), no additional installation needed.

## Features

### 1. Monaco Editor
- Full-featured code editor with syntax highlighting
- Supports: JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, Ruby, HTML, CSS, JSON, and more
- Minimap, line numbers, code folding
- Auto-formatting and bracket pair colorization
- Smooth scrolling and cursor animations

### 2. Code Execution
- **Run Button**: Click the "▶️ Run" button in the top bar
- **Keyboard Shortcut**: Press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
- **Output Panel**: View execution results at the bottom
- **Error Handling**: See errors with stack traces
- **Timeout Protection**: 5-second execution limit

### 3. Supported Languages

#### Currently Supported
- **JavaScript/Node.js**: Full support with console.log, console.error, console.warn

#### Coming Soon
- Python, Java, C++, Go (requires external execution service)

## Usage

1. **Open a file** in your workspace
2. **Write code** using Monaco Editor
3. **Run code** by clicking "Run" or pressing `Ctrl+Enter`
4. **View output** in the execution panel at the bottom

### Example Code

```javascript
// Simple example
console.log('Hello from Monaco Editor!');

// With variables
const name = 'CodeSync';
const version = '2.0';
console.log(`Welcome to ${name} v${version}`);

// With functions
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci(10):', fibonacci(10));

// With objects
const user = {
  name: 'Developer',
  role: 'editor',
  skills: ['JavaScript', 'React', 'Node.js']
};

console.log('User:', user);
```

## Security

- Code runs in a **sandboxed VM** (vm2)
- **5-second timeout** prevents infinite loops
- **No file system access** or network requests
- **No access to Node.js modules** (except safe built-ins)

## Extending to Other Languages

To add Python, Java, or other languages, integrate with:
- [Piston API](https://github.com/engineer-man/piston) - Free code execution API
- [Judge0](https://judge0.com/) - Commercial code execution service
- Docker containers for isolated execution

### Example: Adding Piston API

Update `backend/controllers/executionController.js`:

```javascript
// Add Python support via Piston API
if (language === 'python') {
  const response = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'python',
      version: '3.10.0',
      files: [{ content: code }]
    })
  });
  
  const result = await response.json();
  return res.json({
    output: result.run.stdout,
    error: result.run.stderr
  });
}
```

## Troubleshooting

### Monaco Editor not loading
- Check browser console for errors
- Ensure `@monaco-editor/react` is installed
- Clear browser cache and reload

### Code execution fails
- Verify backend is running
- Check that vm2 is installed: `npm list vm2`
- Review backend logs for errors

### Syntax highlighting wrong
- File language is auto-detected from the `language` field
- Update file language in the database if needed

## Architecture

```
Frontend (React)
├── CodeEditor.jsx          # Monaco Editor wrapper
├── CodeExecutionPanel.jsx  # Output display
└── codeExecutionApi.js     # API client

Backend (Express)
├── routes/execution.js     # Execution endpoint
└── controllers/executionController.js  # VM2 sandbox
```

## Performance Tips

- Monaco Editor uses lazy loading
- First load may take 1-2 seconds
- Subsequent loads are instant
- Minimap can be disabled for better performance on large files

## Next Steps

1. Install dependencies: `cd backend && npm install`
2. Restart backend server
3. Open a workspace and try the Run button
4. Experiment with different code examples
5. Consider adding more language support

Enjoy coding with Monaco Editor! 🚀

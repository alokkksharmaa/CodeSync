# CodeSync - Real-time Collaborative Coding App

A minimal full-stack application for real-time collaborative code editing in shared rooms.

## Tech Stack

- **Frontend**: React (Vite), Monaco Editor
- **Backend**: Node.js + Express
- **Real-time**: Socket.IO

## Project Structure

```
├── backend/
│   ├── server.js              # Express + Socket.IO server setup
│   ├── handlers/
│   │   └── socketHandler.js   # Socket event handlers
│   ├── services/
│   │   └── roomManager.js     # In-memory room state management
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── JoinRoom.jsx      # Room join screen
│   │   │   ├── EditorRoom.jsx    # Main editor container
│   │   │   ├── MonacoEditor.jsx  # Monaco editor wrapper
│   │   │   └── CodeEditor.jsx    # Legacy text editor
│   │   ├── services/
│   │   │   └── socket.js         # Socket.IO client setup
│   │   ├── styles/
│   │   │   └── index.css         # Global styles
│   │   ├── App.jsx               # Root component
│   │   └── main.jsx              # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
```

## Features

- Room-based collaboration
- Real-time code synchronization with Monaco Editor
- Live cursor presence with colored indicators
- Random username generation for each user
- Professional code editor with syntax highlighting
- IntelliSense and autocomplete
- Cursor position preservation during remote updates
- Throttled cursor updates (100ms) for smooth performance
- Debounced code updates (300ms) to optimize network traffic
- User presence tracking
- Clean, modular architecture

## Setup & Installation

### Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`

## Usage

1. Open the app in your browser
2. Enter a room ID (e.g., "room123")
3. Share the room ID with collaborators
4. Start coding together in real-time!

## Socket Events

### Client → Server
- `join_room` - Join a collaborative room (includes username, color)
- `leave_room` - Leave current room
- `code_change` - Send code updates
- `cursor_position` - Send cursor position updates

### Server → Client
- `room_joined` - Confirmation with initial content and existing users
- `code_update` - Receive code changes from others
- `user_joined` - New user joined notification (includes username, color, cursor)
- `user_left` - User left notification
- `cursor_update` - Receive cursor position updates from others

## Notes

This is a minimal blueprint focused on core functionality. Not included:
- Authentication
- Database persistence
- Code execution
- Conflict resolution

See `frontend/CURSOR_PRESENCE.md` for details on cursor tracking implementation.

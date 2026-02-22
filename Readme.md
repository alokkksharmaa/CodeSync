# ⚡ CodeSync - Real-time Collaborative Coding Platform

CodeSync is a powerful, full-stack collaborative IDE designed for seamless real-time teamwork. Build, share, and collaborate on code with instant synchronization, live activity monitoring, and robust workspace governance.

![CodeSync Hero](https://img.shields.io/badge/Status-Version%202.0-blueviolet?style=for-the-badge)
![CodeSync Tech](https://img.shields.io/badge/Stack-MERN%20+%20Socket.IO-green?style=for-the-badge)

## 🚀 Key Features

### 💻 Real-time Collaboration
- **Synchronized Editing**: Powered by Monaco Editor with live code updates across all clients.
- **Presence Tracking**: Dynamic user icons showing who is active in the workspace.
- **Live Cursors**: Colored cursor indicators for every collaborator with name badges.
- **Role-Based Access**: Granular permissions (Owner, Editor, Viewer) enforced via Socket.IO.

### 📊 Collaboration Intelligence (New!)
- **Activity Feed**: Real-time sidebar notification feed for user joins, leaves, and file operations.
- **Activity Logging**: Persistent backend logging of all workspace activities for accountability.
- **Recent Activity Dashboard**: Overview of workspace activities directly from the dashboard.

### 📁 Advanced File Management
- **Real-time File Sync**: Instant synchronization of file creation, deletion, and renaming across all collaborators.
- **Version History**: Save and restore code snapshots to prevent data loss.
- **Multi-file Support**: Seamlessly switch between multiple files in a single workspace.

### 🛡️ Workspace Governance
- **Session Management**: Explicit "Leave Session" control with automatic cleanup and notifications.
- **Invitations**: Secure invited-only access to private workspaces.
- **Ownership Transfer**: (Coming soon) Ability to transfer workspace ownership.

### ✨ Premium UX/UI
- **Smart Auth**: Auto-focusing inputs and secure password toggle for a frictionless logic experience.
- **Responsive Design**: Fully optimized for desktop and mobile collaborative viewing.
- **Performance Optimized**: Debounced code updates and throttled cursor tracking for high performance.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Monaco Editor, Tailwind-inspired CSS3.
- **Backend**: Node.js, Express, MongoDB (Mongoose).
- **Real-time**: Socket.IO 4.x.
- **Auth**: JWT-based secure authentication.

---

## 📂 Project Structure

```bash
├── backend/
│   ├── controllers/      # Business logic (Files, Sessions, Workspaces)
│   ├── models/           # Mongoose schemas (ActivityLog, Workspace, User)
│   ├── routes/           # REST API Endpoints
│   ├── server.js         # Socket.IO & Express entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/   # UI Modules (ActivityFeed, FileExplorer, etc.)
│   │   ├── pages/        # Route Views (Dashboard, Workspace, Auth)
│   │   ├── services/     # API & Socket clients
│   │   └── context/      # Auth & State Management
│   └── package.json
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### 2. Environment Configuration
Create a `.env` file in the **backend** directory:
```env
PORT=3001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

### 3. Installation & Run
```bash
# Setup Backend
cd backend
npm install
npm run dev

# Setup Frontend
cd ../frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🔄 Socket.IO API Summary

| Event | Type | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join_workspace` | Emit | `{ workspaceId, username, color, userId }` | Joins a collaborative room. |
| `code_change` | Emit | `{ fileId, code, userId }` | Broadcasts code changes to others. |
| `user_joined` | Listen | `{ username, role, color }` | Notification when a peer joins. |
| `activity_update` | Listen | `{ type, user, meta }` | Triggers activity feed refresh. |
| `file_created` | Listen | `{ fileObject }` | Syncs new file creation across clients. |

---

## 📝 Recent Enhancements (Session Summary)

- ✅ **UX Overhaul**: Implemented auto-focus and password toggle on Auth pages.
- ✅ **Dashboard Update**: Added workspace grid with "Quick Join" and Activity Summary.
- ✅ **Activity Feed**: New frontend component and backend logging system for collaboration tracking.
- ✅ **Session Exit**: Implemented `leaveSession` logic and UI button for controlled exits.
- ✅ **Real-time File Sync**: Integrated socket events into file operations for instant project-wide updates.

---

## 📄 License
This project is licensed under the MIT License.

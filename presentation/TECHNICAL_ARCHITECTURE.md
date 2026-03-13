# 🏗️ CodeSync - Technical Architecture

## System Architecture Overview

### High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  React 18 + Vite                                                │
│  ├── Monaco Editor (Code Editing)                               │
│  ├── React Router (Navigation)                                  │
│  ├── Context API (State Management)                             │
│  ├── Axios (HTTP Client)                                        │
│  └── Socket.IO Client (WebSocket)                               │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             │ HTTP/REST                          │ WebSocket
             │                                    │
┌────────────▼────────────────────────────────────▼───────────────┐
│                        SERVER LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Node.js + Express                                              │
│  ├── REST API Routes                                            │
│  ├── Authentication Middleware (JWT)                            │
│  ├── Authorization Middleware (RBAC)                            │
│  ├── Socket.IO Server (Real-time)                               │
│  └── Compression Middleware (Gzip)                              │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Mongoose ODM
             │
┌────────────▼────────────────────────────────────────────────────┐
│                       DATABASE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB                                                        │
│  ├── Users Collection                                           │
│  ├── Workspaces Collection                                      │
│  ├── Files Collection                                           │
│  ├── WorkspaceMembers Collection                                │
│  ├── ActivityLogs Collection (Indexed)                          │
│  └── FileVersions Collection                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Component Hierarchy
```
App.jsx
├── AuthContext (Global State)
├── Router
│   ├── Login
│   ├── Signup
│   ├── Dashboard
│   │   ├── CreateWorkspaceModal
│   │   └── ActivityFeed
│   └── Workspace
│       ├── FileExplorer
│       ├── Monaco Editor
│       ├── MembersPanel
│       ├── ActivityFeed
│       ├── VersionHistory
│       ├── InviteModal
│       └── ShareWorkspaceModal
```

### State Management Strategy

- **Global State**: AuthContext for user authentication
- **Local State**: React hooks (useState, useEffect) for component state
- **Real-time State**: Socket.IO event listeners for live updates
- **API State**: Axios with async/await for data fetching

### Routing Strategy
- **Lazy Loading**: Code-split routes for faster initial load
- **Protected Routes**: Authentication wrapper for private pages
- **Prefetching**: Hover-based preloading for instant navigation

---

## Backend Architecture

### API Layer Structure
```
server.js (Entry Point)
├── Routes
│   ├── authRoutes.js
│   ├── workspaceRoutes.js
│   ├── fileRoutes.js
│   ├── memberRoutes.js
│   ├── activityRoutes.js
│   └── versionRoutes.js
├── Controllers
│   ├── authController.js
│   ├── workspaceController.js
│   ├── fileController.js
│   ├── memberController.js
│   ├── activityController.js
│   └── versionController.js
├── Middleware
│   ├── authMiddleware.js (JWT Verification)
│   ├── permissionMiddleware.js (RBAC)
│   ├── workspaceAuth.js (Workspace Access)
│   └── filePermission.js (File Access)
├── Models
│   ├── User.js
│   ├── Workspace.js
│   ├── File.js
│   ├── WorkspaceMember.js
│   ├── ActivityLog.js
│   └── FileVersion.js
└── Services
    └── deleteUserCascade.js
```

### Middleware Pipeline
```
Request → CORS → Compression → JSON Parser → Route Handler
                                              ↓
                                         Auth Middleware
                                              ↓
                                      Permission Middleware
                                              ↓
                                          Controller
                                              ↓
                                           Response
```

---

## Real-Time Communication Architecture

### Socket.IO Event Flow
```
Client A                    Server                      Client B
   │                          │                            │
   ├─ join_workspace ────────►│                            │
   │                          ├─ Verify membership         │
   │                          ├─ Join room                 │
   │                          ├─ Log activity              │
   │                          ├─ user_joined ─────────────►│
   │                          │                            │
   ├─ code_change ───────────►│                            │
   │                          ├─ Check permissions         │
   │                          ├─ code_update ─────────────►│
   │                          ├─ Save to DB (5s delay)     │
   │                          │                            │
   ├─ cursor_position ───────►│                            │
   │                          ├─ cursor_update ───────────►│
```

### Room Management
- **Workspace Rooms**: `workspace:{workspaceId}`
- **File Rooms**: `file:{fileId}`
- **User Isolation**: Socket.data stores user context
- **Broadcast Strategy**: Emit to room excluding sender

---

## Database Schema Design

### Relationships
```
User ──┬─► Workspace (ownerId)
       ├─► WorkspaceMember (userId)
       ├─► ActivityLog (userId)
       └─► FileVersion (createdBy)

Workspace ──┬─► File (workspaceId)
            ├─► WorkspaceMember (workspaceId)
            └─► ActivityLog (workspaceId)

File ──┬─► FileVersion (fileId)
       └─► ActivityLog (targetId)
```

### Indexing Strategy
```javascript
// ActivityLog - Compound Index
{ workspaceId: 1, timestamp: -1 }
// Optimizes: Recent activities query

// WorkspaceMember - Compound Index
{ workspaceId: 1, userId: 1 }
// Optimizes: Membership lookup

// File - Single Index
{ workspaceId: 1 }
// Optimizes: Workspace files query
```

---

## Security Architecture

### Authentication Flow
```
1. User submits credentials
2. Server validates against database
3. Bcrypt compares password hash
4. JWT token generated (7-day expiry)
5. Token sent to client
6. Client stores in localStorage
7. Token included in Authorization header
8. Middleware verifies token on each request
```

### Authorization Layers
```
Layer 1: Route Protection (authMiddleware)
         ↓
Layer 2: Workspace Access (workspaceAuth)
         ↓
Layer 3: Role Validation (permissionMiddleware)
         ↓
Layer 4: Resource Permission (filePermission)
```

---

## Performance Optimization Techniques

### Frontend Optimizations
1. **Code Splitting**: Route-based lazy loading
2. **Prefetching**: Hover-triggered resource loading
3. **Debouncing**: 300ms delay on code changes
4. **Throttling**: 100ms limit on cursor updates
5. **Memoization**: React.memo for expensive components
6. **Virtual Scrolling**: Large file lists

### Backend Optimizations
1. **Lean Queries**: `.lean()` for 40% faster reads
2. **Projection**: Select only needed fields
3. **Indexing**: Compound indexes on frequent queries
4. **Compression**: Gzip reduces payload by 70%
5. **Connection Pooling**: MongoDB connection reuse
6. **Delayed Saves**: 5-second buffer for file updates

### Database Optimizations
1. **Compound Indexes**: Multi-field query optimization
2. **Lean Documents**: Plain objects instead of Mongoose docs
3. **Projection**: Exclude unnecessary fields
4. **Aggregation Pipeline**: Efficient data processing
5. **Connection Limits**: Prevent connection exhaustion

---

## Scalability Considerations

### Current Architecture Limits
- Single server instance
- In-memory Socket.IO rooms
- Single MongoDB instance
- No caching layer

### Scaling Strategy

#### Horizontal Scaling
```
Load Balancer
├── App Server 1 ──┐
├── App Server 2 ──┼─► Redis (Session Store)
└── App Server 3 ──┘
                    │
                    └─► MongoDB Cluster
```

#### Redis Integration
- Session storage
- Socket.IO adapter (multi-server)
- Caching layer for frequent queries
- Pub/Sub for cross-server events

#### Database Scaling
- Read replicas for query distribution
- Sharding by workspaceId
- Separate collections for hot data
- Archive old activity logs

---

## Error Handling Strategy

### Frontend Error Handling
```javascript
try {
  await api.call()
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login
  } else if (error.response?.status === 403) {
    // Show permission error
  } else {
    // Show generic error toast
  }
}
```

### Backend Error Handling
```javascript
try {
  // Business logic
} catch (error) {
  console.error('[context]', error)
  res.status(500).json({ 
    message: 'User-friendly error',
    error: process.env.NODE_ENV === 'dev' ? error.message : undefined
  })
}
```

---

## Monitoring & Logging

### Current Logging
- Console logs for debugging
- Socket.IO connection logs
- Database operation logs
- Error stack traces

### Production Monitoring (Recommended)
- **APM**: New Relic, DataDog
- **Logging**: Winston, Morgan
- **Error Tracking**: Sentry
- **Analytics**: Mixpanel, Amplitude
- **Uptime**: Pingdom, UptimeRobot

---

## Deployment Architecture

### Development Environment
```
localhost:5173 (Frontend - Vite)
localhost:3001 (Backend - Node)
localhost:27017 (MongoDB)
```

### Production Environment
```
CDN (Static Assets)
    ↓
Load Balancer
    ↓
App Servers (PM2 Cluster)
    ↓
MongoDB Atlas (Managed)
```

### CI/CD Pipeline (Recommended)
```
Git Push → GitHub Actions → Tests → Build → Deploy
                                      ↓
                              Docker Container
                                      ↓
                              Cloud Platform
                          (AWS/GCP/Azure/Heroku)
```

---

## Technology Choices Rationale

### Why React?
- Component reusability
- Large ecosystem
- Virtual DOM performance
- Hooks for state management

### Why MongoDB?
- Flexible schema for evolving features
- Document model fits file structure
- Excellent Node.js integration
- Horizontal scaling support

### Why Socket.IO?
- Automatic reconnection
- Room-based broadcasting
- Fallback to polling
- Cross-browser compatibility

### Why JWT?
- Stateless authentication
- Scalable across servers
- Standard format
- Easy to implement

---

## Code Quality Standards

### Naming Conventions
- **Files**: camelCase.js
- **Components**: PascalCase.jsx
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Database**: camelCase fields

### Code Organization
- One component per file
- Grouped imports (external, internal, styles)
- Controller functions exported individually
- Models in separate files
- Middleware as reusable functions

### Error Messages
- User-friendly frontend messages
- Detailed backend logs
- Consistent error response format
- HTTP status codes follow standards

---

**Last Updated**: February 2026

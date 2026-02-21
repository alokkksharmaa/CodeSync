require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const File = require('./models/File');

const app = express();
const server = http.createServer(app);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ─── HTTP Middleware ───────────────────────────────────────────────────────────
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);

// GET /api/me — protected example
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ message: 'Authenticated!', user: req.user });
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
// Debounce timers keyed by workspaceId for DB persistence
const saveTimers = {};

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // ── join_workspace ──────────────────────────────────────────────────────────
  // Payload: { workspaceId, username, color }
  socket.on('join_workspace', async ({ workspaceId, username, color }) => {
    if (!workspaceId) return;

    socket.join(workspaceId);
    socket.data.workspaceId = workspaceId;
    socket.data.username = username;

    console.log(`[socket] ${username} joined workspace ${workspaceId}`);

    // Load saved file content from MongoDB for the joining client
    try {
      const file = await File.findOne({ workspaceId });
      socket.emit('workspace_joined', {
        code: file?.content || '',
      });
    } catch (err) {
      console.error('[socket] Failed to load workspace file:', err.message);
      socket.emit('workspace_joined', { code: '' });
    }

    // Notify others in the workspace
    socket.to(workspaceId).emit('user_joined', { id: socket.id, username, color });
  });

  // ── code_change ─────────────────────────────────────────────────────────────
  // Payload: { workspaceId, code, userId }
  socket.on('code_change', ({ workspaceId, code, userId }) => {
    if (!workspaceId) return;

    // Broadcast to all other clients in the workspace immediately
    socket.to(workspaceId).emit('code_update', { code });

    // Debounce DB write: wait 1.5s of inactivity before persisting
    if (saveTimers[workspaceId]) clearTimeout(saveTimers[workspaceId]);
    saveTimers[workspaceId] = setTimeout(async () => {
      try {
        await File.findOneAndUpdate(
          { workspaceId },
          { content: code, lastEditedBy: userId || null },
          { new: true, upsert: true }
        );
        delete saveTimers[workspaceId];
      } catch (err) {
        console.error('[socket] Failed to persist code:', err.message);
      }
    }, 1500);
  });

  // ── cursor_position (unchanged from Phase 1) ────────────────────────────────
  socket.on('cursor_position', ({ workspaceId, position, username, color }) => {
    socket.to(workspaceId).emit('cursor_update', {
      userId: socket.id,
      position,
      username,
      color,
    });
  });

  // ── leave_workspace ─────────────────────────────────────────────────────────
  socket.on('leave_workspace', ({ workspaceId }) => {
    handleLeave(socket, workspaceId);
  });

  // ── disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const workspaceId = socket.data.workspaceId;
    if (workspaceId) handleLeave(socket, workspaceId);
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

function handleLeave(socket, workspaceId) {
  socket.leave(workspaceId);
  socket.to(workspaceId).emit('user_left', {
    userId: socket.id,
    username: socket.data.username,
  });
}

// ─── MongoDB + Server Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codesync';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('[db] MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`[server] Running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[db] MongoDB connection failed:', err.message);
    process.exit(1);
  });

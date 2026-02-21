import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';
import File from './models/File.js';

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
app.use('/api/files', fileRoutes);

// GET /api/me — protected example
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ message: 'Authenticated!', user: req.user });
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
// Debounce timers keyed by fileId for DB persistence
const saveTimers = {};

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // ── join_workspace ──────────────────────────────────────────────────────────
  socket.on('join_workspace', ({ workspaceId, username, color }) => {
    if (!workspaceId) return;
    socket.join(`workspace:${workspaceId}`);
    socket.data.workspaceId = workspaceId;
    socket.data.username = username;
    
    console.log(`[socket] ${username} joined workspace room: workspace:${workspaceId}`);
    
    // Notify others in the workspace (presence list only)
    socket.to(`workspace:${workspaceId}`).emit('user_joined', { id: socket.id, username, color });
  });

  // ── join_file ───────────────────────────────────────────────────────────────
  socket.on('join_file', async ({ fileId }) => {
    if (!fileId) return;
    
    // Leave previous file rooms if any
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room.startsWith('file:')) socket.leave(room);
    });

    socket.join(`file:${fileId}`);
    console.log(`[socket] ${socket.data.username} joined file room: file:${fileId}`);

    // Load file content
    try {
      const file = await File.findById(fileId);
      socket.emit('file_joined', {
        fileId,
        code: file?.content || '',
      });
    } catch (err) {
      console.error('[socket] Failed to load file:', err.message);
      socket.emit('file_joined', { fileId, code: '' });
    }
  });

  // ── code_change ─────────────────────────────────────────────────────────────
  socket.on('code_change', ({ fileId, code, userId }) => {
    if (!fileId) return;

    // Broadcast only to clients in this file room
    socket.to(`file:${fileId}`).emit('code_update', { fileId, code });

    // Debounce DB write: wait 1.5s
    if (saveTimers[fileId]) clearTimeout(saveTimers[fileId]);
    saveTimers[fileId] = setTimeout(async () => {
      try {
        await File.findByIdAndUpdate(
          fileId,
          { content: code, lastEditedBy: userId || null }
        );
        delete saveTimers[fileId];
      } catch (err) {
        console.error('[socket] Failed to persist code:', err.message);
      }
    }, 1500);
  });

  // ── cursor_position ────────────────────────────────────────────────────────
  socket.on('cursor_position', ({ fileId, position, username, color }) => {
    if (!fileId) return;
    socket.to(`file:${fileId}`).emit('cursor_update', {
      userId: socket.id,
      position,
      username,
      color,
    });
  });

  // ── disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const workspaceId = socket.data.workspaceId;
    if (workspaceId) {
      socket.to(`workspace:${workspaceId}`).emit('user_left', {
        userId: socket.id,
        username: socket.data.username,
      });
    }
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

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

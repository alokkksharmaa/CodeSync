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
import WorkspaceMember from './models/WorkspaceMember.js';

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
app.set('io', io);

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
const saveTimers = {};

import ActivityLog from './models/ActivityLog.js';

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // ── join_workspace ──────────────────────────────────────────────────────────
  socket.on('join_workspace', async ({ workspaceId, username, color, userId }) => {
    if (!workspaceId) return;

    // Verify membership and fetch role
    const membership = await WorkspaceMember.findOne({ workspaceId, userId });
    if (!membership) {
      console.log(`[socket] Join denied: User ${userId} is not a member of ${workspaceId}`);
      return;
    }

    socket.join(`workspace:${workspaceId}`);
    socket.data.workspaceId = workspaceId;
    socket.data.userId = userId;
    socket.data.username = username;
    socket.data.role = membership.role;
    
    console.log(`[socket] ${username} (${membership.role}) joined workspace:${workspaceId}`);
    
    // Log Activity
    await ActivityLog.create({
      workspaceId,
      userId,
      actionType: 'USER_JOINED',
      metadata: { username }
    });

    socket.to(`workspace:${workspaceId}`).emit('user_joined', { 
      userId: socket.id, 
      profileId: userId,
      username, 
      color,
      role: membership.role 
    });

    // Notify all of activity update
    io.to(`workspace:${workspaceId}`).emit('activity_update');
  });

  // ... (rest of the listeners) ...

  // ── disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    const workspaceId = socket.data.workspaceId;
    const userId = socket.data.userId;
    const username = socket.data.username;

    if (workspaceId && userId) {
      // Log Activity
      await ActivityLog.create({
        workspaceId,
        userId,
        actionType: 'USER_LEFT',
        metadata: { username }
      });

      socket.to(`workspace:${workspaceId}`).emit('user_left', {
        userId: socket.id,
        username,
      });

      // Notify all of activity update
      io.to(`workspace:${workspaceId}`).emit('activity_update');
    }
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
    process.exit(1);
  });

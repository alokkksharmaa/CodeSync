import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import executionRoutes from './routes/execution.js';
import authMiddleware from './middleware/authMiddleware.js';
import File from './models/File.js';
import WorkspaceMember from './models/WorkspaceMember.js';

const app = express();
const server = http.createServer(app);

app.use(compression());

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
app.use('/api/comments', commentRoutes);
app.use('/api/execute', executionRoutes);

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

  // ── join_file ───────────────────────────────────────────────────────────────
  socket.on('join_file', async ({ fileId }) => {
    if (!fileId) return;
    
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room.startsWith('file:')) socket.leave(room);
    });

    socket.join(`file:${fileId}`);
    
    try {
      const file = await File.findById(fileId);
      socket.emit('file_joined', {
        fileId,
        code: file?.content || '',
      });
    } catch (err) {
      socket.emit('file_joined', { fileId, code: '' });
    }
  });

  // ── code_change ─────────────────────────────────────────────────────────────
  socket.on('code_change', ({ fileId, code, userId }) => {
    if (!fileId) return;

    if (socket.data.role === 'viewer') {
      console.log(`[socket] Blocked change from viewer: ${socket.data.username}`);
      return;
    }

    socket.to(`file:${fileId}`).emit('code_update', { 
      fileId, 
      code,
      userId: socket.data.userId,
      username: socket.data.username,
      timestamp: new Date()
    });

    if (saveTimers[fileId]) clearTimeout(saveTimers[fileId]);
    saveTimers[fileId] = setTimeout(async () => {
      try {
        await File.findByIdAndUpdate(
          fileId,
          { content: code, lastEditedBy: userId || null }
        );
        
        await ActivityLog.create({
          workspaceId: socket.data.workspaceId,
          userId: socket.data.userId,
          actionType: 'FILE_UPDATED',
          targetId: fileId,
          metadata: { username: socket.data.username }
        });

        io.to(`workspace:${socket.data.workspaceId}`).emit('activity_update');
        delete saveTimers[fileId];
      } catch (err) {
        console.error('[socket] Failed to persist code:', err.message);
      }
    }, 5000);
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

  // ── role_sync (internal) ──────────────────────────────────────────────────
  socket.on('role_sync', ({ role }) => {
    socket.data.role = role;
    console.log(`[socket] Role sync for ${socket.data.username}: ${role}`);
  });

  // ── comment_added ──────────────────────────────────────────────────────────
  socket.on('comment_added', ({ workspaceId, comment }) => {
    if (!workspaceId) return;
    socket.to(`workspace:${workspaceId}`).emit('new_comment', comment);
  });

  // ── comment_updated ────────────────────────────────────────────────────────
  socket.on('comment_updated', ({ workspaceId, comment }) => {
    if (!workspaceId) return;
    socket.to(`workspace:${workspaceId}`).emit('comment_updated', comment);
  });

  // ── comment_deleted ────────────────────────────────────────────────────────
  socket.on('comment_deleted', ({ workspaceId, commentId }) => {
    if (!workspaceId) return;
    socket.to(`workspace:${workspaceId}`).emit('comment_deleted', { commentId });
  });

  // ── reaction_toggled ───────────────────────────────────────────────────────
  socket.on('reaction_toggled', ({ workspaceId, comment }) => {
    if (!workspaceId) return;
    socket.to(`workspace:${workspaceId}`).emit('reaction_updated', comment);
  });

  // ── Voice Chat Events ──────────────────────────────────────────────────────
  socket.on('voice_join', ({ workspaceId, userId, username }) => {
    if (!workspaceId) return;
    
    socket.join(`voice:${workspaceId}`);
    socket.data.inVoiceChat = true;
    socket.data.voiceUserId = userId;
    
    console.log(`[voice] ${username} (${userId}) joined voice chat in workspace:${workspaceId}`);
    
    // Notify others in the voice chat
    socket.to(`voice:${workspaceId}`).emit('voice_user_joined', { 
      userId, 
      username,
      socketId: socket.id
    });
  });

  socket.on('voice_leave', ({ workspaceId, userId }) => {
    if (!workspaceId) return;
    
    socket.leave(`voice:${workspaceId}`);
    socket.data.inVoiceChat = false;
    
    console.log(`[voice] User ${userId} left voice chat in workspace:${workspaceId}`);
    
    // Notify others
    socket.to(`voice:${workspaceId}`).emit('voice_user_left', { userId });
  });

  socket.on('voice_offer', ({ to, offer }) => {
    console.log(`[voice] Forwarding offer from ${socket.data.voiceUserId} to ${to}`);
    // Broadcast to all in voice chat so the right peer receives it
    socket.to(`voice:${socket.data.workspaceId}`).emit('voice_offer', {
      from: socket.data.voiceUserId,
      offer
    });
  });

  socket.on('voice_answer', ({ to, answer }) => {
    console.log(`[voice] Forwarding answer from ${socket.data.voiceUserId} to ${to}`);
    // Broadcast to all in voice chat so the right peer receives it
    socket.to(`voice:${socket.data.workspaceId}`).emit('voice_answer', {
      from: socket.data.voiceUserId,
      answer
    });
  });

  socket.on('voice_ice_candidate', ({ to, candidate }) => {
    console.log(`[voice] Forwarding ICE candidate from ${socket.data.voiceUserId} to ${to}`);
    // Broadcast to all in voice chat so the right peer receives it
    socket.to(`voice:${socket.data.workspaceId}`).emit('voice_ice_candidate', {
      from: socket.data.voiceUserId,
      candidate
    });
  });

  // ── disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    const workspaceId = socket.data.workspaceId;
    const userId = socket.data.userId;
    const username = socket.data.username;

    if (workspaceId && userId) {
      // If user was in voice chat, notify others
      if (socket.data.inVoiceChat) {
        socket.to(`voice:${workspaceId}`).emit('voice_user_left', { userId });
      }

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

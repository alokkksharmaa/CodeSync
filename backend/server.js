require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);

// ─── CORS ────────────────────────────────────────────────────────────────────
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

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── Protected Route Example ──────────────────────────────────────────────────
// GET /api/me  — returns the authenticated user's info
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({
    message: 'Authenticated!',
    user: req.user, // { id, username } attached by authMiddleware
  });
});

// ─── Socket.IO ───────────────────────────────────────────────────────────────
// In-memory room state (existing functionality preserved)
const rooms = {};

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on('join_room', ({ roomId, username, color }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = { code: '', users: [] };
    }

    const user = { id: socket.id, username, color };
    rooms[roomId].users.push(user);

    // Confirm join to the connecting client
    socket.emit('room_joined', {
      code: rooms[roomId].code,
      users: rooms[roomId].users.filter((u) => u.id !== socket.id),
    });

    // Notify others
    socket.to(roomId).emit('user_joined', user);

    socket.data.roomId = roomId;
    socket.data.username = username;

    console.log(`[socket] ${username} joined room ${roomId}`);
  });

  socket.on('code_change', ({ roomId, code }) => {
    if (rooms[roomId]) {
      rooms[roomId].code = code;
    }
    socket.to(roomId).emit('code_update', { code });
  });

  socket.on('cursor_position', ({ roomId, position, username, color }) => {
    socket.to(roomId).emit('cursor_update', { userId: socket.id, position, username, color });
  });

  socket.on('leave_room', ({ roomId }) => {
    handleLeave(socket, roomId);
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (roomId) handleLeave(socket, roomId);
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

function handleLeave(socket, roomId) {
  socket.leave(roomId);
  if (rooms[roomId]) {
    rooms[roomId].users = rooms[roomId].users.filter((u) => u.id !== socket.id);
    if (rooms[roomId].users.length === 0) {
      delete rooms[roomId];
    }
  }
  socket.to(roomId).emit('user_left', { userId: socket.id, username: socket.data.username });
}

// ─── MongoDB + Server Start ───────────────────────────────────────────────────
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

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import roomManager from './services/roomManager.js';
import socketHandler from './handlers/socketHandler.js';
import authRoutes from './routes/authRoutes.js';
import executeRoutes from './routes/executeRoutes.js';
import { socketAuthMiddleware } from './middleware/socketAuth.js';

const app = express();
const httpServer = createServer(app);

// Get environment variables
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);

// Code execution routes
app.use('/api/execute', executeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: roomManager.getRoomCount(),
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CodeSync Backend Server',
    status: 'running',
    version: '1.0.0'
  });
});

// Socket.IO authentication middleware
io.use(socketAuthMiddleware);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} (${socket.user.username})`);
  socketHandler(io, socket, roomManager);
});

httpServer.listen(PORT, () => {
  console.log(`CodeSync server running on port ${PORT}`);
  console.log(`Accepting connections from: ${FRONTEND_URL}`);
});

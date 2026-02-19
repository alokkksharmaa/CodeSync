import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import roomManager from './services/roomManager.js';
import socketHandler from './handlers/socketHandler.js';

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
app.use(express.json());

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

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socketHandler(io, socket, roomManager);
});

httpServer.listen(PORT, () => {
  console.log(`CodeSync server running on port ${PORT}`);
  console.log(`Accepting connections from: ${FRONTEND_URL}`);
});

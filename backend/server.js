import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import roomManager from './services/roomManager.js';
import socketHandler from './handlers/socketHandler.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173', // Vite default port
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: roomManager.getRoomCount() });
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socketHandler(io, socket, roomManager);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`CodeSync server running on port ${PORT}`);
});

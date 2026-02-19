import { io } from 'socket.io-client';

/**
 * Get backend URL from environment variables
 * Falls back to localhost if not set
 */
const SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

console.log('Connecting to backend:', SERVER_URL);

// Create socket instance (not connected yet)
export const socket = io(SERVER_URL, {
  autoConnect: false, // Manual connection control
  transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

/**
 * Connect to socket server
 */
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

/**
 * Disconnect from socket server
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

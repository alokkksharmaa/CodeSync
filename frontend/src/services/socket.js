import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

// Create socket instance (not connected yet)
export const socket = io(SERVER_URL, {
  autoConnect: false // Manual connection control
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

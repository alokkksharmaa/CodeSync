/**
 * Socket event handler
 * Manages real-time communication between clients
 */
import codeExecutor from '../services/codeExecutor.js';

export default function socketHandler(io, socket, roomManager) {

  /**
   * JOIN_ROOM - User joins a collaborative room
   */
  socket.on('join_room', ({ roomId }) => {
    // Join the Socket.IO room
    socket.join(roomId);

    // Use authenticated user data
    const { username, color, id: userId } = socket.user;

    // Get current document content and existing users
    const { content, language, users } = roomManager.joinRoom(roomId, socket.id, username, color, userId);

    // Send current state to the joining user
    socket.emit('room_joined', { roomId, content, language, users });

    // Notify others in the room about new user
    socket.to(roomId).emit('user_joined', {
      userId: socket.id,
      username,
      color,
      cursor: { line: 1, column: 1 },
      userCount: roomManager.getUserCount(roomId)
    });

    console.log(`${username} (${socket.id}) joined room: ${roomId}`);
  });

  /**
   * LEAVE_ROOM - User leaves a room
   */
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    roomManager.leaveRoom(roomId, socket.id);

    // Notify others
    socket.to(roomId).emit('user_left', {
      userId: socket.id,
      userCount: roomManager.getUserCount(roomId)
    });

    console.log(`${socket.id} left room: ${roomId}`);
  });

  /**
   * CODE_CHANGE - Broadcast code changes to room
   */
  socket.on('code_change', ({ roomId, content }) => {
    // Update room state
    roomManager.updateContent(roomId, content);

    // Broadcast to all users in room except sender
    socket.to(roomId).emit('code_update', { content });
  });

  /**
   * CURSOR_POSITION - Broadcast cursor position to room
   */
  socket.on('cursor_position', ({ roomId, cursor }) => {
    // Update cursor in room state
    roomManager.updateCursor(roomId, socket.id, cursor);

    // Broadcast to all users in room except sender
    socket.to(roomId).emit('cursor_update', {
      userId: socket.id,
      cursor
    });
  });

  /**
   * LANGUAGE_CHANGE - Broadcast language change to room
   */
  socket.on('language_change', ({ roomId, language }) => {
    // Update language in room state
    roomManager.updateLanguage(roomId, language);

    // Broadcast to all users in room except sender
    socket.to(roomId).emit('language_update', { language });

    console.log(`Language changed to ${language} in room: ${roomId}`);
  });

  /**
   * EXECUTE_CODE - Execute code and broadcast results
   */
  socket.on('execute_code', async ({ roomId, code, language, stdin }) => {
    try {
      console.log(`Executing ${language} code in room: ${roomId} by ${socket.user.username}`);

      // Execute code
      const result = await codeExecutor.executeCode(code, language, stdin || '');

      // Broadcast result to all users in room (including sender)
      io.to(roomId).emit('execution_result', {
        username: socket.user.username,
        result,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Execution completed for ${socket.user.username} in room ${roomId}`);
    } catch (error) {
      console.error('Code execution error:', error.message);
      
      // Send error only to the user who requested execution
      socket.emit('execution_error', {
        error: error.message || 'Execution failed'
      });
    }
  });

  /**
   * DISCONNECT - Handle user disconnect
   */
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Find all rooms this socket was in and clean up
    const rooms = Array.from(socket.rooms);
    rooms.forEach(roomId => {
      // Skip the socket's own room (socket.id)
      if (roomId !== socket.id) {
        // Leave room and update state
        roomManager.leaveRoom(roomId, socket.id);
        
        // Notify others in the room
        socket.to(roomId).emit('user_left', {
          userId: socket.id,
          userCount: roomManager.getUserCount(roomId)
        });
        
        console.log(`${socket.user?.username || 'User'} left room ${roomId} on disconnect`);
      }
    });
  });
}

/**
 * Socket event handler
 * Manages real-time communication between clients
 */
export default function socketHandler(io, socket, roomManager) {

  /**
   * JOIN_ROOM - User joins a collaborative room
   */
  socket.on('join_room', ({ roomId, username, color }) => {
    // Join the Socket.IO room
    socket.join(roomId);

    // Get current document content and existing users
    const { content, users } = roomManager.joinRoom(roomId, socket.id, username, color);

    // Send current state to the joining user
    socket.emit('room_joined', { roomId, content, users });

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
   * DISCONNECT - Handle user disconnect
   */
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Socket.IO automatically handles room cleanup
  });
}

/**
 * RoomManager - Manages in-memory room state
 * Each room stores: document content, selected language, connected users, and cursor positions
 */
class RoomManager {
  constructor() {
    // rooms = { roomId: { content: string, language: string, users: Map<socketId, userData> } }
    // userData = { username: string, color: string, cursor: { line, column } }
    this.rooms = new Map();
  }

  /**
   * Join a room - creates room if doesn't exist
   */
  joinRoom(roomId, socketId, username, color, userId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        content: '// Welcome to CodeSync!\n// Start coding together...\n',
        language: 'javascript', // Default language
        users: new Map()
      });
    }

    const room = this.rooms.get(roomId);
    room.users.set(socketId, {
      userId,
      username,
      color,
      cursor: { line: 1, column: 1 }
    });

    return {
      content: room.content,
      language: room.language, // Include language in room state
      users: this.getRoomUsers(roomId, socketId)
    };
  }

  /**
   * Leave a room - cleanup if empty
   */
  leaveRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.users.delete(socketId);

    // Clean up empty rooms
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    }
  }

  /**
   * Update room content
   */
  updateContent(roomId, content) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.content = content;
    }
  }

  /**
   * Get current room content
   */
  getContent(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.content : null;
  }

  /**
   * Update room language
   */
  updateLanguage(roomId, language) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.language = language;
    }
  }

  /**
   * Get current room language
   */
  getLanguage(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.language : 'javascript';
  }
  /**
   * Update room language
   */
  updateLanguage(roomId, language) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.language = language;
    }
  }

  /**
   * Get current room language
   */
  getLanguage(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.language : 'javascript';
  }

  /**
   * Get room stats
   */
  getRoomCount() {
    return this.rooms.size;
  }

  /**
   * Get users in room
   */
  getUserCount(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.users.size : 0;
  }

  /**
   * Update user cursor position
   */
  updateCursor(roomId, socketId, cursor) {
    const room = this.rooms.get(roomId);
    if (room && room.users.has(socketId)) {
      room.users.get(socketId).cursor = cursor;
    }
  }

  /**
   * Get all users in room (excluding specified socketId)
   */
  getRoomUsers(roomId, excludeSocketId = null) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    const users = [];
    room.users.forEach((userData, socketId) => {
      if (socketId !== excludeSocketId) {
        users.push({
          userId: socketId,
          username: userData.username,
          color: userData.color,
          cursor: userData.cursor
        });
      }
    });
    return users;
  }

  /**
   * Get specific user data
   */
  getUser(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room.users.get(socketId);
  }
}

export default new RoomManager();

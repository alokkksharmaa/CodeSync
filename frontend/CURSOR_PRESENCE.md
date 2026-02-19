# Live Cursor Presence

## Overview

CodeSync now includes real-time cursor tracking, allowing users to see where their collaborators are editing in the document.

## Features

- **Colored Cursors**: Each user gets a unique vibrant color
- **Username Labels**: Cursors display the user's randomly generated username
- **Smooth Updates**: Throttled to 100ms to prevent network spam
- **Pixel-Perfect Positioning**: Monaco's coordinate system converts line/column to screen position

## How It Works

### Backend (Room & User Tracking)

**RoomManager** now stores user metadata:
```javascript
users: Map<socketId, {
  username: string,
  color: string,
  cursor: { line: number, column: number }
}>
```

**Socket Events**:
- `join_room`: Includes username and color, returns existing users
- `cursor_position`: Updates user's cursor position
- `cursor_update`: Broadcasts cursor changes to room

### Frontend (Cursor Rendering)

**User Identity Generation**:
- Random username (e.g., "SwiftCoder42")
- Random vibrant color from predefined palette
- Generated once per session using `useMemo`

**Cursor Tracking Flow**:
1. Monaco's `onDidChangeCursorPosition` fires on cursor movement
2. Throttled to 100ms using custom throttle function
3. Emits `cursor_position` event with { line, column }
4. Server broadcasts to other users
5. Recipients update their `remoteCursors` state

**Cursor Rendering**:
1. `remoteCursors` array contains all other users
2. Monaco's `getScrolledVisiblePosition()` converts line/column to pixels
3. `RemoteCursor` component renders at calculated position
4. CSS transitions provide smooth movement

## Components

### RemoteCursor.jsx
Displays a colored vertical line with username label above it.

### userUtils.js
- `generateUsername()`: Creates random usernames
- `generateUserColor()`: Picks from 10 vibrant colors
- `throttle()`: Limits function call frequency

## Performance Optimizations

- **Throttling**: Cursor updates limited to 100ms intervals
- **Debouncing**: Code changes debounced to 300ms
- **Conditional Rendering**: Only renders cursors with valid positions
- **Smooth Transitions**: CSS transitions (0.1s) for fluid movement

## Socket Events Summary

### Client → Server
```javascript
// Join with identity
socket.emit('join_room', { roomId, username, color });

// Update cursor
socket.emit('cursor_position', { roomId, cursor: { line, column } });
```

### Server → Client
```javascript
// Room joined with existing users
socket.on('room_joined', ({ content, users }) => {});

// New user joined
socket.on('user_joined', ({ userId, username, color, cursor }) => {});

// User left
socket.on('user_left', ({ userId }) => {});

// Cursor moved
socket.on('cursor_update', ({ userId, cursor }) => {});
```

## Testing

1. Open CodeSync in two browser windows
2. Join the same room ID in both
3. Move your cursor in one window
4. See the colored cursor appear in the other window
5. Type in one window and watch the cursor follow

## Future Enhancements

- User-selected colors and usernames
- Cursor selection highlighting
- Typing indicators
- User avatars
- Cursor history/trails

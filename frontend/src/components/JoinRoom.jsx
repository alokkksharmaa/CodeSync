import { useState } from 'react';
import authService from '../services/authService';

function JoinRoom({ onJoin, onLogout }) {
  const [roomId, setRoomId] = useState('');
  const user = authService.getUser();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoin(roomId.trim());
    }
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <div className="join-header">
          <h1>CodeSync</h1>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
        <p>Welcome, {user?.username}!</p>
        <p className="subtitle">Real-time collaborative coding</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="room-input"
            autoFocus
          />
          <button type="submit" className="join-button">
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinRoom;

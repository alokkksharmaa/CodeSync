import { useState } from 'react';

function JoinRoom({ onJoin }) {
  const [roomId, setRoomId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoin(roomId.trim());
    }
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <h1>CodeSync</h1>
        <p>Real-time collaborative coding</p>
        
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

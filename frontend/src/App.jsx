import { useState } from 'react';
import JoinRoom from './components/JoinRoom';
import EditorRoom from './components/EditorRoom';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);

  const handleJoinRoom = (roomId) => {
    setCurrentRoom(roomId);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
  };

  return (
    <div className="app">
      {!currentRoom ? (
        <JoinRoom onJoin={handleJoinRoom} />
      ) : (
        <EditorRoom roomId={currentRoom} onLeave={handleLeaveRoom} />
      )}
    </div>
  );
}

export default App;

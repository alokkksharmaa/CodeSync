import { useState, useEffect } from 'react';
import Login from './components/Login';
import JoinRoom from './components/JoinRoom';
import EditorRoom from './components/EditorRoom';
import authService from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    setIsAuthenticated(authService.isAuthenticated());
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentRoom(null);
  };

  const handleJoinRoom = (roomId) => {
    setCurrentRoom(roomId);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
  };

  if (loading) {
    return <div className="app">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {!currentRoom ? (
        <JoinRoom onJoin={handleJoinRoom} onLogout={handleLogout} />
      ) : (
        <EditorRoom roomId={currentRoom} onLeave={handleLeaveRoom} />
      )}
    </div>
  );
}

export default App;

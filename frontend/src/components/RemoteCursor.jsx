/**
 * RemoteCursor - Displays other users' cursor positions
 * Shows a colored indicator with username label
 */
function RemoteCursor({ username, color, position }) {
  if (!position) return null;

  const style = {
    position: 'absolute',
    left: `${position.left}px`,
    top: `${position.top}px`,
    pointerEvents: 'none',
    zIndex: 1000,
    transition: 'all 0.1s ease-out'
  };

  const cursorStyle = {
    width: '2px',
    height: '20px',
    backgroundColor: color,
    position: 'relative'
  };

  const labelStyle = {
    position: 'absolute',
    top: '-22px',
    left: '0',
    backgroundColor: color,
    color: 'white',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  };

  return (
    <div style={style}>
      <div style={cursorStyle}>
        <div style={labelStyle}>{username}</div>
      </div>
    </div>
  );
}

export default RemoteCursor;

import { useState, useRef, useEffect } from 'react';

/**
 * ResizablePanel - A resizable split panel component
 * Supports horizontal (side-by-side) and vertical (top-bottom) layouts
 */
function ResizablePanel({ 
  children, 
  direction = 'horizontal', // 'horizontal' or 'vertical'
  defaultSize = 60, // percentage
  minSize = 20,
  maxSize = 80
}) {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      let newSize;
      if (direction === 'horizontal') {
        // Side-by-side layout
        const mouseX = e.clientX - rect.left;
        newSize = (mouseX / rect.width) * 100;
      } else {
        // Top-bottom layout
        const mouseY = e.clientY - rect.top;
        newSize = (mouseY / rect.height) * 100;
      }

      // Clamp size between min and max
      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, direction, minSize, maxSize]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const [firstChild, secondChild] = children;

  return (
    <div 
      ref={containerRef}
      className={`resizable-container ${direction}`}
      style={{
        display: 'flex',
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
        flex: 1,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* First panel */}
      <div 
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${size}%`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {firstChild}
      </div>

      {/* Resize handle */}
      <div
        className={`resize-handle ${direction}`}
        onMouseDown={handleMouseDown}
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: '4px',
          backgroundColor: '#3e3e42',
          cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
          position: 'relative',
          flexShrink: 0,
          zIndex: 10
        }}
      >
        <div
          style={{
            position: 'absolute',
            [direction === 'horizontal' ? 'top' : 'left']: 0,
            [direction === 'horizontal' ? 'bottom' : 'right']: 0,
            [direction === 'horizontal' ? 'left' : 'top']: '-2px',
            [direction === 'horizontal' ? 'width' : 'height']: '8px',
            cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize'
          }}
        />
      </div>

      {/* Second panel */}
      <div 
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {secondChild}
      </div>
    </div>
  );
}

export default ResizablePanel;

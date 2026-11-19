import React, { useState, useEffect, useCallback, useRef } from 'react';

interface ResizableLabLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  overlayPanels?: React.ReactNode;
}

export const ResizableLabLayout: React.FC<ResizableLabLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
  overlayPanels,
}) => {
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem('lab_leftWidth');
    return saved ? parseInt(saved, 10) : 320;
  });
  
  const [rightWidth, setRightWidth] = useState(() => {
    const saved = localStorage.getItem('lab_rightWidth');
    return saved ? parseInt(saved, 10) : 320;
  });
  
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(() => {
    return localStorage.getItem('lab_leftCollapsed') === 'true';
  });
  
  const [isRightCollapsed, setIsRightCollapsed] = useState(() => {
    return localStorage.getItem('lab_rightCollapsed') === 'true';
  });

  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('lab_leftWidth', leftWidth.toString());
  }, [leftWidth]);

  useEffect(() => {
    localStorage.setItem('lab_rightWidth', rightWidth.toString());
  }, [rightWidth]);

  useEffect(() => {
    localStorage.setItem('lab_leftCollapsed', isLeftCollapsed.toString());
  }, [isLeftCollapsed]);

  useEffect(() => {
    localStorage.setItem('lab_rightCollapsed', isRightCollapsed.toString());
  }, [isRightCollapsed]);

  // Handle global events (like reset from Header)
  useEffect(() => {
    const handleReset = () => {
      setLeftWidth(320);
      setRightWidth(320);
      setIsLeftCollapsed(false);
      setIsRightCollapsed(false);
    };
    window.addEventListener('reset-lab-layout', handleReset);
    return () => window.removeEventListener('reset-lab-layout', handleReset);
  }, []);

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1000) {
        setIsRightCollapsed(true);
      }
      if (window.innerWidth < 700) {
        setIsLeftCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const MIN_WIDTH = 260;
  const MAX_WIDTH = 460;
  const TAB_WIDTH = 40; // width of collapsed tab

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    if (isDraggingLeft) {
      let newWidth = e.clientX - containerRect.left;
      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      const maxAllowed = containerRect.width - (isRightCollapsed ? TAB_WIDTH : rightWidth) - 400;
      if (newWidth > maxAllowed) newWidth = Math.max(MIN_WIDTH, maxAllowed);
      setLeftWidth(newWidth);
    } else if (isDraggingRight) {
      let newWidth = containerRect.right - e.clientX;
      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      const maxAllowed = containerRect.width - (isLeftCollapsed ? TAB_WIDTH : leftWidth) - 400;
      if (newWidth > maxAllowed) newWidth = Math.max(MIN_WIDTH, maxAllowed);
      setRightWidth(newWidth);
    }
  }, [isDraggingLeft, isDraggingRight, isLeftCollapsed, isRightCollapsed, leftWidth, rightWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight, handleMouseMove, handleMouseUp]);

  return (
    <main 
      className="workspace-resizable" 
      ref={containerRef}
      style={{
        display: 'flex',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Left Panel Area */}
      <div 
        className={`resizable-panel left-panel ${isLeftCollapsed ? 'collapsed' : ''}`}
        style={{ width: isLeftCollapsed ? TAB_WIDTH : leftWidth, flexShrink: 0 }}
      >
        {!isLeftCollapsed ? (
          <div className="panel-content">
            <button 
              className="collapse-btn left-collapse-btn" 
              onClick={() => setIsLeftCollapsed(true)}
              title="Collapse Left Panel"
            >
              ◀
            </button>
            {leftPanel}
          </div>
        ) : (
          <div 
            className="collapsed-tab" 
            onClick={() => setIsLeftCollapsed(false)}
            title="Expand Left Panel"
          >
            ▶
          </div>
        )}
      </div>

      {!isLeftCollapsed && (
        <div 
          className="drag-handle" 
          onMouseDown={() => setIsDraggingLeft(true)} 
        />
      )}

      {/* Center 3D Area */}
      <div className="center-panel" style={{ flex: 1, minWidth: 400, position: 'relative' }}>
        {centerPanel}
      </div>

      {!isRightCollapsed && (
        <div 
          className="drag-handle" 
          onMouseDown={() => setIsDraggingRight(true)} 
        />
      )}

      {/* Right Panel Area */}
      <div 
        className={`resizable-panel right-panel ${isRightCollapsed ? 'collapsed' : ''}`}
        style={{ width: isRightCollapsed ? TAB_WIDTH : rightWidth, flexShrink: 0 }}
      >
        {!isRightCollapsed ? (
          <div className="panel-content">
            <button 
              className="collapse-btn right-collapse-btn" 
              onClick={() => setIsRightCollapsed(true)}
              title="Collapse Right Panel"
            >
              ▶
            </button>
            {rightPanel}
          </div>
        ) : (
          <div 
            className="collapsed-tab" 
            onClick={() => setIsRightCollapsed(false)}
            title="Expand Right Panel"
          >
            ◀
          </div>
        )}
      </div>

      {overlayPanels}
    </main>
  );
};

export default ResizableLabLayout;

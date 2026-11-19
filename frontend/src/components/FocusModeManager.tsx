import React, { useEffect, useState, useRef } from 'react';

export const FocusModeManager: React.FC<{
  children: React.ReactNode;
  isActive: boolean;
  enforceFullscreenOnly?: boolean;
  onTerminate: () => void;
}> = ({ children, isActive, enforceFullscreenOnly = false, onTerminate }) => {
  const [violations, setViolations] = useState(0);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const MAX_VIOLATIONS = 3;

  const requestFullscreenSafely = async (element: HTMLElement & { webkitRequestFullscreen?: () => Promise<void>, msRequestFullscreen?: () => Promise<void>, mozRequestFullScreen?: () => Promise<void> }) => {
    if (element.requestFullscreen) { await element.requestFullscreen(); return; }
    if (element.webkitRequestFullscreen) { await element.webkitRequestFullscreen(); return; }
    if (element.msRequestFullscreen) { await element.msRequestFullscreen(); return; }
    if (element.mozRequestFullScreen) { await element.mozRequestFullScreen(); return; }
  };

  const triggerViolation = React.useCallback((reason: string) => {
    if (!isActive) return;
    
    setViolations(prev => {
      const newVal = prev + 1;
      setWarningMessage(`Violation Detected: ${reason}. This is warning ${newVal} of ${MAX_VIOLATIONS}.`);
      
      if (newVal >= MAX_VIOLATIONS) {
        setWarningModalOpen(false); // Hide warning so ScorePanel can be seen
        onTerminate();
      } else {
        setWarningModalOpen(true);
      }
      return newVal;
    });
  }, [isActive, onTerminate]);

  useEffect(() => {
    if (!isActive) return;

    // Enforce Fullscreen
    const enterFullscreen = () => {
      if (containerRef.current && !document.fullscreenElement) {
        requestFullscreenSafely(containerRef.current).then(() => {
          // Attempt to lock keyboard (specifically Escape) to prevent exiting fullscreen
          // @ts-expect-error Keyboard API not typed
          if ('keyboard' in navigator && navigator.keyboard && navigator.keyboard.lock) {
            // @ts-expect-error Keyboard API not typed
            navigator.keyboard.lock(['Escape']).catch((err: unknown) => console.log('Keyboard lock failed:', err));
          }
        }).catch((err: Error) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    };

    enterFullscreen();

    // Event Listeners for anti-cheat
    const handleVisibilityChange = () => {
      if (document.hidden && !enforceFullscreenOnly) {
        triggerViolation("Switched browser tab or minimized window");
      }
    };

    const handleBlur = () => {
      if (!enforceFullscreenOnly) {
        triggerViolation("Clicked outside the assessment window");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !warningModalOpen) {
        if (!enforceFullscreenOnly) {
          triggerViolation("Exited fullscreen mode");
        }
        // Try to re-enter fullscreen after they acknowledge warning or if we are just enforcing
        if (enforceFullscreenOnly && containerRef.current) {
          requestFullscreenSafely(containerRef.current).catch(() => {});
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("Key pressed:", e.key, "enforceFullscreenOnly:", enforceFullscreenOnly);
      // Prevent Alt, Meta, Tab, Escape, F11
      if (e.key === 'Alt' || e.key === 'Meta' || e.key === 'OS' || e.key === 'Process' || e.key === 'Tab' || e.key === 'Escape' || e.key === 'F11') {
        e.preventDefault();
        if (!enforceFullscreenOnly) {
          triggerViolation(`Prohibited key pressed (${e.key})`);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      
      if (document.fullscreenElement) {
        // Prevent React Strict Mode double-mount from kicking the user out of fullscreen
        // document.exitFullscreen().catch(() => {});
      }
    };
  }, [isActive, enforceFullscreenOnly, warningModalOpen, triggerViolation]);

  const handleAcknowledgeWarning = () => {
    setWarningModalOpen(false);
    if (containerRef.current && !document.fullscreenElement) {
      requestFullscreenSafely(containerRef.current).catch(() => {});
    }
  };

  if (!isActive) return <>{children}</>;

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', background: 'var(--bg-primary)' }}>
      {children}
      
      {warningModalOpen && (
        <div className="warning-modal-overlay">
          <div className="warning-modal-content">
            <div className="warning-icon">⚠️</div>
            <h2 className="warning-title">ACADEMIC INTEGRITY WARNING</h2>
            <p className="warning-message">{warningMessage}</p>
            
            {violations < MAX_VIOLATIONS && (
              <button className="btn btn-primary pulse-btn warning-ack-btn" onClick={handleAcknowledgeWarning}>
                I Understand, Return to Assessment
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusModeManager;

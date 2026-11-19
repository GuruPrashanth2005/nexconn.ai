import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSimulationStore, type ExperimentModule } from '../state/simulationStore';
import SafetyBriefing from './SafetyBriefing';
import AssessmentPortal from './AssessmentPortal';
import AssessmentLoadingScreen from './AssessmentLoadingScreen';

export const BriefingPage: React.FC = () => {
  const { theme } = useSimulationStore();
  const { moduleId, mode } = useParams<{ moduleId: string, mode: string }>();
  const navigate = useNavigate();
  
  const [showLoading, setShowLoading] = useState(false);

  const requestFullscreenSafely = async (element: HTMLElement & { webkitRequestFullscreen?: () => Promise<void>, msRequestFullscreen?: () => Promise<void>, mozRequestFullScreen?: () => Promise<void> }) => {
    if (element.requestFullscreen) { await element.requestFullscreen(); return; }
    if (element.webkitRequestFullscreen) { await element.webkitRequestFullscreen(); return; }
    if (element.msRequestFullscreen) { await element.msRequestFullscreen(); return; }
    if (element.mozRequestFullScreen) { await element.mozRequestFullScreen(); return; }
  };

  const handlePracticeAccept = () => {
    requestFullscreenSafely(document.documentElement).then(() => {
      // @ts-expect-error Keyboard API not typed
      if ('keyboard' in navigator && navigator.keyboard && navigator.keyboard.lock) {
        // @ts-expect-error Keyboard API not typed
        navigator.keyboard.lock(['Escape']).catch(console.error);
      }
    }).catch(console.error);
    navigate(`/lab/${moduleId}/${mode}`, { state: { fromApp: true } });
  };

  const handleAssessmentAccept = () => {
    requestFullscreenSafely(document.documentElement).then(() => {
      // @ts-expect-error Keyboard API not typed
      if ('keyboard' in navigator && navigator.keyboard && navigator.keyboard.lock) {
        // @ts-expect-error Keyboard API not typed
        navigator.keyboard.lock(['Escape']).catch(console.error);
      }
    }).catch((err) => {
      console.error(err);
      alert("Browser blocked fullscreen! " + (err?.message || ""));
    });
    setShowLoading(true);
  };

  const handleLoadingComplete = () => {
    navigate(`/lab/${moduleId}/${mode}`, { state: { fromApp: true } });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className={`module-selector-container theme-${theme}`} style={{
      position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 100000, padding: '4rem 2rem', overflowY: 'auto', overflowX: 'hidden'
    }}>
      {showLoading ? (
        <AssessmentLoadingScreen onComplete={handleLoadingComplete} />
      ) : mode === 'ASSESSMENT' ? (
        <AssessmentPortal 
          module={moduleId as ExperimentModule} 
          onAccept={handleAssessmentAccept} 
          onCancel={handleCancel} 
        />
      ) : (
        <SafetyBriefing
          module={moduleId as ExperimentModule}
          mode={mode as 'PRACTICE' | 'ASSESSMENT'}
          onAccept={handlePracticeAccept}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default BriefingPage;

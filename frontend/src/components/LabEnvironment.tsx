import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSimulationStore, applyRemoteSnapshot, type ExperimentModule, type ExperimentMode } from '../state/simulationStore';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import AlkalinityPanel from './AlkalinityPanel';
import HardnessPanel from './HardnessPanel';
import CODPanel from './CODPanel';
import Canvas3D from './Canvas3D';
import ControlPanel from './ControlPanel';
import LogbookPanel from './LogbookPanel';
import ScorePanel from './ScorePanel';
import { PHPanel } from './PHPanel';
import ResizableLabLayout from './ResizableLabLayout';
import HydroCompanion from './HydroCompanion';
import FocusModeManager from './FocusModeManager';
import AnimatedSplashIcon from './AnimatedSplashIcon';
import NexconnManager from '../services/nexconnManager';

export const LabEnvironment: React.FC = () => {
  const { moduleId, mode } = useParams<{ moduleId: string; mode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();


  const {
    activeModule,
    activeMode,
    selectModule,
    isStopcockOpen,
    tickTitration,
    warningMessage,
    isExperimentFailed,
    failureReason,
    resetSimulation,
    isExperimentSubmitted,
    safetyBriefingRead,
    theme,
    activeHazard,
    clearHazard,
  } = useSimulationStore();

  const [showLogbook, setShowLogbook] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Synchronize incoming peer telemetry to update 3D apparatus in real-time
  useEffect(() => {
    const myClientId = NexconnManager.getInstance().getClientId();
    const myUserId = NexconnManager.getInstance().getUserId();

    const unsubscribe = NexconnManager.getInstance().subscribeTelemetry((data) => {
      // Message is remote ONLY if sent by another client tab instance OR another user account
      // Never treat our own messages as remote
      const isRemote = (Boolean(data.clientId && data.clientId !== myClientId)) || 
                       (Boolean(data.studentId && myUserId && data.studentId !== myUserId && data.clientId !== myClientId));

      if (!isRemote) return;

      if (data.type === 'REQUEST_SYNC') {
        // A peer just joined or reloaded! Send our current full snapshot so they immediately mirror us
        const currentState = useSimulationStore.getState();
        NexconnManager.getInstance().broadcastFullSnapshot(currentState);
      } else if (data.type === 'STATE_SYNC' && data.snapshot) {
        // Complete state snapshot mutual sync (readings, checklist, equipment, liquids, swirl, flow)
        // If snapshot volume is 0 or less than local volume, but we already have progress or are titrating, preserve local volume
        const currentVol = useSimulationStore.getState().flaskTitrantVolume;
        const snapshotUpdates = { ...data.snapshot };
        if (snapshotUpdates.flaskTitrantVolume !== undefined && snapshotUpdates.flaskTitrantVolume < currentVol && currentVol > 0) {
          delete snapshotUpdates.flaskTitrantVolume;
        }
        applyRemoteSnapshot(snapshotUpdates);
      } else if (data.type === 'CHAT_MESSAGE' && data.chatMessage) {
        // Sync AI Companion chat history
        useSimulationStore.setState((prev) => ({
          chatHistory: [...prev.chatHistory, data.chatMessage!],
        }));
      } else if (data.type === 'TELEMETRY') {
        // Instant sync peer titration volume to local 3D simulation state and color calculations
        const state = useSimulationStore.getState();
        const updates: any = {
          ...(data.isStopcockOpen !== undefined ? { isStopcockOpen: data.isStopcockOpen } : {}),
          ...(data.stopcockOperatorId !== undefined ? { stopcockOperatorId: data.stopcockOperatorId } : {}),
        };

        if (state.activeModule === 'COD') {
          if (state.codActiveStation === 'SAMPLE') {
            updates.sampleTitrantVolume = data.volumeDispensed;
          } else {
            updates.blankTitrantVolume = data.volumeDispensed;
          }
        } else {
          updates.flaskTitrantVolume = data.volumeDispensed;
        }

        applyRemoteSnapshot(updates);
        useSimulationStore.getState().tickTitration(0);
      } else if (data.type === 'PROCEDURE_STEP') {
        // Mutual Procedure Checklist & Reagents Sync
        applyRemoteSnapshot({
          checklist: { ...useSimulationStore.getState().checklist, ...(data.checklist || {}) },
          isBuretteFilled: data.isBuretteFilled !== undefined ? data.isBuretteFilled : useSimulationStore.getState().isBuretteFilled,
          flaskHasSample: data.flaskHasSample !== undefined ? data.flaskHasSample : useSimulationStore.getState().flaskHasSample,
          flaskHasIndicator: data.flaskHasIndicator !== undefined ? data.flaskHasIndicator : useSimulationStore.getState().flaskHasIndicator,
          flaskIndicatorType: data.flaskIndicatorType !== undefined ? data.flaskIndicatorType : useSimulationStore.getState().flaskIndicatorType,
          selectedEquipment: data.selectedEquipment !== undefined ? data.selectedEquipment : useSimulationStore.getState().selectedEquipment,
          activePipetteLiquid: data.activePipetteLiquid !== undefined ? data.activePipetteLiquid : useSimulationStore.getState().activePipetteLiquid,
        });
      }
    });

    // On mount, ask any existing peer in the room for current lab state
    NexconnManager.getInstance().requestStateSnapshot();

    // Broadcast that this user has connected to the room
    const currentUserName = user?.name || user?.email?.split('@')[0] || 'Peer Collaborator';
    NexconnManager.getInstance().broadcastJoinRoom(NexconnManager.getInstance().getActiveRoom(), currentUserName);

    // Fast polling fallback for cross-browser / cross-device peers
    const pollInterval = setInterval(async () => {
      const activeRoom = NexconnManager.getInstance().getActiveRoom();
      if (!activeRoom) return;

      try {
        const res = await fetch(`/api/v1/nexconn/telemetry/${encodeURIComponent(activeRoom)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.telemetry) {
          const telem = data.telemetry;
          const isRemote = (Boolean(telem.clientId && telem.clientId !== myClientId)) || 
                           (Boolean(telem.studentId && myUserId && telem.studentId !== myUserId && telem.clientId !== myClientId));
          if (!isRemote) return;

          // Discard stale packets
          if (telem.timestamp && Date.now() - telem.timestamp > 10000) return;

          if (telem.type === 'TELEMETRY') {
            const state = useSimulationStore.getState();
            const updates: any = {
              ...(telem.isStopcockOpen !== undefined ? { isStopcockOpen: telem.isStopcockOpen } : {}),
              ...(telem.stopcockOperatorId !== undefined ? { stopcockOperatorId: telem.stopcockOperatorId } : {}),
            };

            if (state.activeModule === 'COD') {
              if (state.codActiveStation === 'SAMPLE') {
                updates.sampleTitrantVolume = telem.volumeDispensed;
              } else {
                updates.blankTitrantVolume = telem.volumeDispensed;
              }
            } else {
              updates.flaskTitrantVolume = telem.volumeDispensed;
            }

            applyRemoteSnapshot(updates);
            useSimulationStore.getState().tickTitration(0);
          } else if (telem.type === 'STATE_SYNC' && telem.snapshot) {
            const currentVol = useSimulationStore.getState().flaskTitrantVolume;
            const snapshotUpdates = { ...telem.snapshot };
            if (snapshotUpdates.flaskTitrantVolume !== undefined && snapshotUpdates.flaskTitrantVolume < currentVol && currentVol > 0) {
              delete snapshotUpdates.flaskTitrantVolume;
            }
            applyRemoteSnapshot(snapshotUpdates);
          }
        }
      } catch {}
    }, 150);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  // Synchronize URL parameters with Zustand store
  useEffect(() => {
    if (moduleId && mode) {
      // Only call selectModule if the store doesn't match the URL
      if (activeModule !== moduleId || activeMode !== mode) {
        selectModule(moduleId as ExperimentModule, mode as ExperimentMode);
        setTimeout(() => setShowSplash(true), 0);
      }
    } else {
      // If no valid params, redirect home
      navigate('/');
    }
  }, [moduleId, mode, activeModule, activeMode, selectModule, navigate]);

  const [needsFullscreenClick, setNeedsFullscreenClick] = useState(
    showSplash && !document.fullscreenElement
  );

  const requestFullscreenSafely = async (element: HTMLElement & { webkitRequestFullscreen?: () => Promise<void>, msRequestFullscreen?: () => Promise<void>, mozRequestFullScreen?: () => Promise<void> }) => {
    if (element.requestFullscreen) { await element.requestFullscreen(); return; }
    if (element.webkitRequestFullscreen) { await element.webkitRequestFullscreen(); return; }
    if (element.msRequestFullscreen) { await element.msRequestFullscreen(); return; }
    if (element.mozRequestFullScreen) { await element.mozRequestFullScreen(); return; }
  };

  useEffect(() => {
    if (showSplash && !needsFullscreenClick) {
      const timer = setTimeout(() => setShowSplash(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showSplash, needsFullscreenClick]);

  // Ensure fullscreen is exited when navigating away from the lab, and warn on accidental close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Standard way to trigger the generic browser confirmation dialog
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Use setTimeout to skip React Strict Mode double-invocations where URL doesn't change
      setTimeout(() => {
        if (!window.location.pathname.includes('/lab/') && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }, 50);
    };
  }, []);

  const handleManualFullscreenClick = () => {
    requestFullscreenSafely(document.documentElement).then(() => {
      // @ts-expect-error Keyboard API is not fully typed
      if ('keyboard' in navigator && navigator.keyboard && navigator.keyboard.lock) {
        // @ts-expect-error Keyboard API is not fully typed
        navigator.keyboard.lock(['Escape']).catch(() => {});
      }
      setNeedsFullscreenClick(false);
    }).catch((error) => {
      console.error("Fullscreen failed: ", error);
      alert("Browser blocked fullscreen! Please ensure you clicked the button directly. Error: " + error.message);
      // Fallback: continue anyway so they aren't completely stuck
      setNeedsFullscreenClick(false);
    });
  };

  // Titration delta time tick loop (only run on the client that opened the stopcock)
  useEffect(() => {
    if (!isStopcockOpen) return;

    const myClientId = NexconnManager.getInstance().getClientId();
    const currentOperator = useSimulationStore.getState().stopcockOperatorId;
    
    // Only the operator tab that opened the stopcock calculates the physical dt titration increments.
    // The partner tab simply receives and renders the continuous stream of volume and visuals.
    if (currentOperator && currentOperator !== myClientId) {
      return;
    }

    let lastTime = performance.now();
    let frameId: number;

    const tick = () => {
      const now = performance.now();
      const dtSeconds = (now - lastTime) / 1000;
      lastTime = now;

      // Tick the chemistry engine calculations
      tickTitration(dtSeconds);

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isStopcockOpen, tickTitration]);

  // Handle clicking the interactive tablet/logbook toggle
  const handleOpenLogbook = () => {
    setShowLogbook(true);
  };

  // If store hasn't initialized yet, render nothing
  if (!activeModule) return null;

  const getLeftPanel = () => {
    if (activeModule === 'ALKALINITY') return <AlkalinityPanel />;
    if (activeModule === 'HARDNESS') return <HardnessPanel />;
    if (activeModule === 'COD') return <CODPanel />;
    if (activeModule === 'PH') return <PHPanel />;
    return null;
  };

  const handleTerminateAssessment = () => {
    const store = useSimulationStore.getState();
    store.setEvaluationReport({
      score: 0,
      breakdown: { accuracy: 0, procedure: 0, time: 0, proceduralDetails: {} },
      status: 'failed',
      feedback: ['Assessment terminated due to Academic Integrity Violations.'],
      tips: ['Ensure you stay in fullscreen mode and do not switch tabs during an assessment.'],
      aiFeedback: 'The assessment was automatically terminated because the maximum number of focus mode violations was reached. Maintaining academic integrity requires remaining within the secure assessment environment.'
    });
    useSimulationStore.setState({ isExperimentSubmitted: true });
    store.setPopupMessage("Assessment Terminated: Academic Integrity Violation limit reached.");
  };

  return (
    <FocusModeManager isActive={activeMode === 'ASSESSMENT'} enforceFullscreenOnly={showSplash} onTerminate={handleTerminateAssessment}>
      <div className={`app-container theme-${theme}`}>
        {showSplash && activeMode && (
          <div className={`lab-splash-overlay ${activeMode.toLowerCase()} ${needsFullscreenClick ? 'paused' : ''}`}>
            <div className="splash-content">
              <AnimatedSplashIcon mode={activeMode} />
              <div className="splash-title">
                {activeMode === 'PRACTICE' ? 'Practice Environment' : 'Assessment Environment'}
              </div>
              <div className="splash-subtitle">
                {activeModule === 'HARDNESS' && 'Determination of Total Hardness'}
                {activeModule === 'ALKALINITY' && 'Determination of Alkalinity'}
                {activeModule === 'COD' && 'Chemical Oxygen Demand'}
                {activeModule === 'PH' && 'pH Determination'}
              </div>
              
              {needsFullscreenClick ? (
                <div style={{ marginTop: '30px' }}>
                  <button className="btn btn-primary pulse-btn" onClick={handleManualFullscreenClick}>
                    Click to Enter Full Screen & Begin
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '20px', color: 'var(--text-muted)' }}>
                  Loading Environment...
                </div>
              )}
            </div>
          </div>
        )}

        <Header />

        <ResizableLabLayout
          leftPanel={getLeftPanel()}
          centerPanel={<Canvas3D />}
          rightPanel={<ControlPanel onOpenLogbook={handleOpenLogbook} />}
          overlayPanels={
            <>
              {/* Real-time fluid warnings overlay */}
              {safetyBriefingRead && warningMessage && !isExperimentFailed && !isExperimentSubmitted && (
                <div className="warning-banner">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                    <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                  </svg>
                  <span>{warningMessage}</span>
                </div>
              )}


              {/* Experiment failure screen */}
              {isExperimentFailed && (
                <div className="modal-backdrop" style={{ zIndex: 600 }}>
                  <div className="modal-content" style={{ width: '400px', textAlign: 'center' }}>
                    <div className="modal-header" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                      <h2 style={{ color: 'var(--danger)', background: 'none', WebkitTextFillColor: 'initial' }}>Experiment Failed</h2>
                    </div>
                    <div className="modal-body">
                      <p style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 500, marginBottom: '16px' }}>
                        {failureReason}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        You crossed the chemical endpoint threshold. In analytical titration, precision and steady swirl pacing are vital.
                      </p>
                    </div>
                    <div className="modal-footer" style={{ border: 'none', justifyContent: 'center' }}>
                      <button className="btn btn-primary" style={{ background: 'var(--danger)', color: '#fff' }} onClick={() => { resetSimulation(); navigate(user?.role === 'FACULTY' ? '/faculty-dashboard/modules' : '/student-dashboard/modules'); }}>
                        Exit Experiment
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Agentic Hazard Simulation Overlay */}
              {activeHazard && (
                <div 
                  className="modal-backdrop" 
                  style={{ 
                    zIndex: 900, 
                    backgroundColor: 'rgba(255, 0, 0, 0.4)', 
                    animation: 'flash 1s infinite alternate' 
                  }}
                  onClick={() => clearHazard()}
                >
                  <style>
                    {`
                      @keyframes flash {
                        0% { background-color: rgba(255, 0, 0, 0.2); }
                        100% { background-color: rgba(255, 0, 0, 0.6); }
                      }
                    `}
                  </style>
                  <div className="modal-content" style={{ width: '500px', textAlign: 'center', border: '2px solid red', boxShadow: '0 0 50px red' }}>
                    <div className="modal-header" style={{ borderColor: 'red' }}>
                      <h2 style={{ color: '#ff4444', textShadow: '0 0 10px red' }}>⚠️ CRITICAL HAZARD TRIGGERED ⚠️</h2>
                    </div>
                    <div className="modal-body">
                      <p style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        Type: {activeHazard.toUpperCase()}
                      </p>
                      <p style={{ color: '#ccc', marginTop: '20px' }}>
                        Dr. Hydro has initiated an emergency visual simulation of the hazard you described. 
                        In a real lab, this could have caused severe injury or equipment damage!
                      </p>
                    </div>
                    <div className="modal-footer" style={{ border: 'none', justifyContent: 'center' }}>
                      <button className="btn btn-primary" style={{ background: '#ff4444', color: '#fff' }} onClick={() => clearHazard()}>
                        Acknowledge & Clear Hazard
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lab journal logbook panel overlay */}
              {showLogbook && <LogbookPanel onClose={() => setShowLogbook(false)} />}

              {/* Final grading audit modal */}
              {isExperimentSubmitted && <ScorePanel />}

              {/* AI Companion (Only visible in Practice mode via its own internal check) */}
              <HydroCompanion />
            </>
          }
        />
      </div>
    </FocusModeManager>
  );
};

export default LabEnvironment;


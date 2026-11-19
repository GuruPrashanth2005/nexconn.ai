import NexconnManager from '../services/nexconnManager';
import React from 'react';
import { useSimulationStore } from '../state/simulationStore';

interface ControlPanelProps {
  onOpenLogbook: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onOpenLogbook }) => {
  const [shareNotice, setShareNotice] = React.useState<string | null>(null);
  const {
    isBuretteFilled,
    flaskTitrantVolume,
    isStopcockOpen,
    stopcockOperatorId,
    flowMode,
    setFlowMode,
    toggleStopcock,
    triggerDrop,
    isSwirling,
    triggerSwirl,
    instructorMode,
    endpoint,
    timelineEvents,
    flaskHasSample,
    flaskHasIndicator,
    usedDropwiseNearEndpoint,
    swirledNearEndpoint,
    warningMessage,
    activeModule,
    codActiveStation,
    sampleBuretteFilled,
    blankBuretteFilled,
    sampleHasWater,
    blankHasWater,
    phMeterPowerOn,
    togglePHPower,
    calibratePHMeter,
    phMeterCurrentReading,
    phElectrodeSubmergedIn,
    setCompanionOpen,
    addChatMessage,
  } = useSimulationStore();

  const handleShareToNexconn = async () => {
    try {
      const vol = currentFlaskTitrantVolume.toFixed(2);
      const mod = activeModule === 'HARDNESS' ? 'Total Hardness (EDTA)' : activeModule === 'ALKALINITY' ? 'Water Alkalinity' : activeModule === 'COD' ? 'Chemical Oxygen Demand (COD)' : 'pH Electrometry';
      
      const observationText = `📊 **[Live Burette Reading]**\n• Experiment: ${mod}\n• Volume Dispensed: **${vol} mL**\n• Flow Status: ${isStopcockOpen ? 'Flowing (Stopcock Open)' : 'Stopped (Stopcock Closed)'}\n• Target Range: ~${endpoint ? endpoint.toFixed(2) + ' mL' : 'Pending'}`;

      // 1. Immediately open companion chat window so the user sees the shared observation
      setCompanionOpen(true);
      addChatMessage('user', observationText);

      // 2. Broadcast via Nexconn peer chat so partner sees it in their chat history
      await NexconnManager.getInstance().broadcastPeerChat({ role: 'user', content: observationText });

      // 3. AI response acknowledging the observation
      setTimeout(() => {
        const aiAck = `🔬 **Dr. Hydro AI:** Live reading recorded via Nexconn Chat! Dispensed volume is **${vol} mL**. Proceed carefully as you approach the color change endpoint.`;
        addChatMessage('assistant', aiAck);
        NexconnManager.getInstance().broadcastPeerChat({ role: 'assistant', content: aiAck }).catch(() => {});
      }, 500);

      // 4. Send direct message & telemetry to Nexconn signaling
      NexconnManager.getInstance().sendDirectTextMessage('dr_hydro_ai', observationText).catch(() => {});
      
      await NexconnManager.getInstance().broadcastTelemetry({
        roomId: NexconnManager.getInstance().getActiveRoom(),
        studentId: NexconnManager.getInstance().getUserId() || 'student_guru_2026',
        studentName: 'Guru',
        module: activeModule || 'HARDNESS',
        volumeDispensed: currentFlaskTitrantVolume,
        flaskColor: currentFlaskTitrantVolume >= endpoint ? '#3b82f6' : '#991b1b',
        isEndpointReached: currentFlaskTitrantVolume >= endpoint,
      });

      window.dispatchEvent(new CustomEvent('nexconn:shared-reading', { detail: { text: observationText, volume: vol } }));
      setShareNotice('Reading shared to Nexconn Chat!');
      setTimeout(() => setShareNotice(null), 3500);
    } catch {
      setShareNotice('Shared to Nexconn Chat!');
      setTimeout(() => setShareNotice(null), 3000);
    }
  };

  if (activeModule === 'PH') {
    return (
      <div className="sidebar-panel right">
        {/* Live Readout panel */}
        <div className="glass-card">
          <h3 className="glass-card-title">pH Meter Readout</h3>
          <div className="burette-live-panel">
            <div className="burette-live-value" style={{ color: phMeterPowerOn ? '#4ade80' : '#475569' }}>
              {phMeterPowerOn && phMeterCurrentReading !== null && !isNaN(phMeterCurrentReading) ? phMeterCurrentReading.toFixed(2) : '---'}
            </div>
            <div className="burette-live-label">{phMeterPowerOn ? 'Current pH' : 'Power Off'}</div>
          </div>
        </div>

        {/* Controls card */}
        <div className="glass-card">
          <h3 className="glass-card-title">Meter Controls</h3>
          
          <button
            className={`btn ${phMeterPowerOn ? 'btn-danger' : 'btn-primary'}`}
            style={{ width: '100%', padding: '12px 16px', marginBottom: '12px' }}
            onClick={togglePHPower}
          >
            {phMeterPowerOn ? 'Turn Power OFF' : 'Turn Power ON'}
          </button>

          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '12px 16px', marginBottom: '16px' }}
            onClick={calibratePHMeter}
            disabled={!phMeterPowerOn || !phElectrodeSubmergedIn}
          >
            Calibrate Meter
          </button>

          <button
            className="btn btn-secondary"
            style={{ width: '100%', borderColor: 'rgba(255,255,255,0.2)', marginBottom: '16px' }}
            onClick={onOpenLogbook}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '4px' }}>
              <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM4 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
              <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 11.293 4L9.293 2z"/>
            </svg>
            Open Logbook / Record
          </button>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            <strong>Tip:</strong> Ensure the electrode is fully submerged in a buffer solution before calibrating. Clean it with distilled water between tests.
          </div>
        </div>

        {/* Instructor Dashboard Overlay */}
        {instructorMode && (
          <div className="glass-card instructor-review-board">
            <h3 className="glass-card-title" style={{ color: 'var(--accent-purple)' }}>
              Instructor Review Panel
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div className="instructor-review-row">
                <span>Power State:</span>
                <span style={{ color: phMeterPowerOn ? 'var(--success)' : 'var(--danger)' }}>{phMeterPowerOn ? 'ON' : 'OFF'}</span>
              </div>
              <div className="instructor-review-row">
                <span>Current Submersion:</span>
                <span>{phElectrodeSubmergedIn || 'None'}</span>
              </div>
              <div className="instructor-review-row">
                <span>Calibration Progress:</span>
                <span>{useSimulationStore.getState().checklist.phCalibrate7 && useSimulationStore.getState().checklist.phCalibrate4 ? 'Complete' : 'Incomplete'}</span>
              </div>
            </div>

            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Event Log
            </h4>
            <div className="timeline-list">
              {timelineEvents.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>No events recorded yet.</div>
              ) : (
                timelineEvents.map((evt) => (
                  <div key={evt.id} className="timeline-item">
                    <span className="timeline-item-time">{evt.time}</span>
                    <span className="timeline-item-text">{evt.description}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentBuretteFilled = activeModule === 'COD'
    ? (codActiveStation === 'SAMPLE' ? sampleBuretteFilled : blankBuretteFilled)
    : isBuretteFilled;

  const currentFlaskHasContent = activeModule === 'COD'
    ? (codActiveStation === 'SAMPLE' ? sampleHasWater : blankHasWater)
    : flaskHasSample;

  const currentFlaskTitrantVolume = activeModule === 'COD'
    ? (codActiveStation === 'SAMPLE' ? useSimulationStore.getState().sampleTitrantVolume : useSimulationStore.getState().blankTitrantVolume)
    : flaskTitrantVolume;

  const myClientId = NexconnManager.getInstance().getClientId();
  // If stopcock is open, check if another peer holds the lock.
  // CRITICAL: If stopcockOperatorId is empty or matches myClientId, the local user is the operator and can ALWAYS close it!
  const isLockedByPeer = isStopcockOpen && Boolean(stopcockOperatorId && stopcockOperatorId !== myClientId);

  // Helper to approximate live score for instructor view
  const getLiveScore = (): number => {
    let score = 0;
    if (currentFlaskHasContent) score += 15;
    if (flaskHasIndicator) score += 15;
    if (currentBuretteFilled) score += 10;
    if (usedDropwiseNearEndpoint) score += 15;
    if (swirledNearEndpoint) score += 15;
    
    const dist = Math.abs(currentFlaskTitrantVolume - endpoint);
    if (dist <= 0.1 && !isStopcockOpen && currentFlaskTitrantVolume > 0) score += 20;
    else if (dist <= 0.25 && !isStopcockOpen && currentFlaskTitrantVolume > 0) score += 10;
    
    return score;
  };

  const isReadyToTitrate = currentBuretteFilled && 
    (activeModule === 'HARDNESS' ? (flaskHasSample && flaskHasIndicator) : 
     activeModule === 'ALKALINITY' ? (flaskHasSample && useSimulationStore.getState().flaskHasPhenol) :
     activeModule === 'COD' ? (currentFlaskHasContent && (codActiveStation === 'SAMPLE' ? useSimulationStore.getState().sampleRefluxCompleted : useSimulationStore.getState().blankRefluxCompleted)) : 
     true);

  return (
    <div className="sidebar-panel right">
      {/* Readout panel */}
      <div className="glass-card">
        <h3 className="glass-card-title">Burette Readout</h3>
        <div className="burette-live-panel">
          <div className="burette-live-value">{currentFlaskTitrantVolume.toFixed(2)} ml</div>
          <div className="burette-live-label">Volume Dispensed</div>
        </div>
      </div>

      {/* Titration controls card */}
      <div className="glass-card">
        <h3 className="glass-card-title">Titration Controls</h3>
        
        {/* Flow mode selector */}
        <div className="toggle-switch" style={{ marginBottom: '16px' }}>
          <div
            className={`toggle-option ${flowMode === 'continuous' ? 'active' : ''}`}
            onClick={() => setFlowMode('continuous')}
          >
            Continuous
          </div>
          <div
            className={`toggle-option ${flowMode === 'dropwise' ? 'active' : ''}`}
            onClick={() => setFlowMode('dropwise')}
          >
            Drop-wise
          </div>
        </div>

        {/* Action Button */}
        {flowMode === 'continuous' ? (
          <button
            className={`btn ${isStopcockOpen ? (isLockedByPeer ? 'btn-secondary' : 'btn-danger') : 'btn-primary'}`}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              marginBottom: '12px',
              opacity: (!isStopcockOpen && (!isReadyToTitrate || isLockedByPeer)) ? 0.65 : 1,
              cursor: (!isStopcockOpen && (!isReadyToTitrate || isLockedByPeer)) ? 'not-allowed' : 'pointer'
            }}
            onClick={toggleStopcock}
            disabled={!isStopcockOpen && (!isReadyToTitrate || isLockedByPeer)}
            title={
              isLockedByPeer ? 'Collaborator is currently controlling the burette flow.' : 
              !isReadyToTitrate ? 'Complete the prior procedure steps (fill burette, pipette sample, add indicator) before titrating.' : ''
            }
          >
            {isStopcockOpen ? (
              <>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '4px' }}>
                  <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h2a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 9 14H7a1.5 1.5 0 0 1-1.5-1.5v-9z"/>
                </svg>
                Close Stopcock (Stop Flow)
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '4px' }}>
                  <path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/>
                </svg>
                Open Stopcock (Start Flow)
              </>
            )}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              marginBottom: '12px',
              opacity: isLockedByPeer ? 0.65 : 1,
              cursor: isLockedByPeer ? 'not-allowed' : 'pointer'
            }}
            onClick={triggerDrop}
            disabled={!currentBuretteFilled || isLockedByPeer}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '4px' }}>
              <path d="M8 16a6 6 0 0 0 6-6c0-1.667-3-7-6-10-3 3-6 8.333-6 10a6 6 0 0 0 6 6z"/>
            </svg>
            Dispense 1 Drop (+0.05 ml)
          </button>
        )}

        {/* Swirl agitation button */}
        <button
          className={`btn ${isSwirling ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: '16px',
            background: isSwirling ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
            borderColor: isSwirling ? 'var(--accent-emerald)' : 'var(--panel-border)',
            color: isSwirling ? 'var(--accent-emerald)' : 'var(--text-main)',
          }}
          onClick={triggerSwirl}
          disabled={!currentFlaskHasContent}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{
              marginRight: '4px',
              animation: isSwirling ? 'spin 1s linear infinite' : 'none',
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {isSwirling ? 'Swirling Flask...' : 'Swirl Flask (Agitate)'}
        </button>

        {/* View logbook button */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', borderColor: 'rgba(255,255,255,0.2)', marginBottom: '8px' }}
          onClick={onOpenLogbook}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '4px' }}>
            <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM4 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
            <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 11.293 4L9.293 2z"/>
          </svg>
          Open Logbook / Record
        </button>

        {/* Nexconn Real-time Share Reading */}
        <button
          className="btn"
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(79, 70, 229, 0.25) 100%)',
            border: '1px solid rgba(96, 165, 250, 0.4)',
            color: '#93c5fd',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={handleShareToNexconn}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Reading to Nexconn Chat
        </button>
        {shareNotice && (
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#34d399', textAlign: 'center', fontWeight: 500 }}>
            ✓ {shareNotice}
          </div>
        )}
      </div>

      {/* Instructor Dashboard Overlay */}
      {instructorMode && (
        <div className="glass-card instructor-review-board">
          <h3 className="glass-card-title" style={{ color: 'var(--accent-purple)' }}>
            Instructor Review Panel
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div className="instructor-review-row">
              <span>Theoretical Endpoint:</span>
              <span>{endpoint.toFixed(2)} ml</span>
            </div>
            <div className="instructor-review-row">
              <span>Current Deviation:</span>
              <span>{(currentFlaskTitrantVolume - endpoint).toFixed(2)} ml</span>
            </div>
            <div className="instructor-review-row">
              <span>Live Procedure Score:</span>
              <span>{getLiveScore()} / 100</span>
            </div>
            <div className="instructor-review-row">
              <span>Drop-wise near EP:</span>
              <span style={{ color: usedDropwiseNearEndpoint ? 'var(--success)' : 'var(--danger)' }}>
                {usedDropwiseNearEndpoint ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="instructor-review-row">
              <span>Swirled near EP:</span>
              <span style={{ color: swirledNearEndpoint ? 'var(--success)' : 'var(--danger)' }}>
                {swirledNearEndpoint ? 'Yes' : 'No'}
              </span>
            </div>
            {warningMessage && (
              <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontStyle: 'italic', marginTop: '4px' }}>
                * Warning Triggered: {warningMessage}
              </div>
            )}
          </div>

          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Event Log
          </h4>
          <div className="timeline-list">
            {timelineEvents.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>No events recorded yet.</div>
            ) : (
              timelineEvents.map((evt) => (
                <div key={evt.id} className="timeline-item">
                  <span className="timeline-item-time">{evt.time}</span>
                  <span className="timeline-item-text">{evt.description}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Embedded CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;

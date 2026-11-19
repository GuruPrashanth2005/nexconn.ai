import React from 'react';
import { useSimulationStore } from '../state/simulationStore';
import AssessmentInfoCard from './AssessmentInfoCard';

const ChecklistItem: React.FC<{ text: string; done: boolean; step: number; isNext?: boolean }> = ({ text, done, step, isNext }) => (
  <div className={`step-row${done ? ' done' : isNext ? ' active' : ''}`}>
    <div className="step-node">
      {done ? (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : step}
    </div>
    <span className="step-label">{text}</span>
  </div>
);

const CurrentStepCard = ({ activeMode, text }: { activeMode: string | null; text: string }) => {
  if (activeMode !== 'PRACTICE') return null;
  return (
    <div className="glass-card" style={{ border: '1px solid var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.05)' }}>
      <h3 className="glass-card-title" style={{ color: 'var(--accent-cyan)' }}>Current Step (Operations)</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'var(--accent-cyan)', color: '#000',
          padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
          </svg>
        </div>
        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>
          {text}
        </span>
      </div>
    </div>
  );
};

export const PHPanel: React.FC = () => {
  const { checklist, activeMode, phElectrodeSubmergedIn, moveElectrode, cleanElectrode } = useSimulationStore();

  const getNextAction = () => {
    if (!checklist.phTurnOnMeter) return { text: '1. Turn on the meter using the Right Panel.', highlight: 'POWER' };
    if (!checklist.phCleanElectrode1) return { text: '2. Clean electrode with the Wash Bottle.', highlight: 'WASH' };
    if (!checklist.phCalibrate7) return { text: '3. Submerge in Buffer 7 and click Calibrate.', highlight: 'BUFFER_7' };
    if (!checklist.phCleanElectrode2) return { text: '4. Clean electrode with the Wash Bottle.', highlight: 'WASH' };
    if (!checklist.phCalibrate4) return { text: '5. Submerge in Buffer 4 and click Calibrate.', highlight: 'BUFFER_4' };
    if (!checklist.phCleanElectrode3) return { text: '6. Clean electrode with the Wash Bottle.', highlight: 'WASH' };
    if (!checklist.phMeasureSample) return { text: '7. Submerge in the Unknown Water Sample.', highlight: 'SAMPLE' };
    if (!checklist.phRecordResult) return { text: '8. Open Logbook and record the reading.', highlight: 'LOGBOOK' };
    return { text: 'Experiment Complete!', highlight: 'NONE' };
  };

  const nextAction = getNextAction();

  return (
    <div className="sidebar-panel left">
      {/* Objective Card */}
      <div className="glass-card">
        <h3 className="glass-card-title">Objective</h3>
        <p style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-muted)' }}>
          Determine the pH of the given water sample using a digital pH meter by standardizing the instrument with known buffers.
        </p>
      </div>

      {/* Current Step Card — only in PRACTICE mode */}
      <CurrentStepCard activeMode={activeMode} text={nextAction.text} />
      <AssessmentInfoCard activeMode={activeMode} />

      {/* Reagents & Equipment Card */}
      <div className="glass-card">
        <h3 className="glass-card-title">Reagents &amp; Equipment</h3>
        <div className="reagent-grid">
          <button
            className={`reagent-button ${phElectrodeSubmergedIn === 'BUFFER_4' ? 'active' : ''}`}
            style={{ borderColor: nextAction.highlight === 'BUFFER_4' ? 'var(--accent-cyan)' : '' }}
            onClick={() => moveElectrode('BUFFER_4')}
          >
            <div className="reagent-meta">
              <span className="reagent-name">Buffer pH 4.01</span>
              <span className="reagent-role">Submerge Electrode</span>
            </div>
          </button>

          <button
            className={`reagent-button ${phElectrodeSubmergedIn === 'BUFFER_7' ? 'active' : ''}`}
            style={{ borderColor: nextAction.highlight === 'BUFFER_7' ? 'var(--accent-cyan)' : '' }}
            onClick={() => moveElectrode('BUFFER_7')}
          >
            <div className="reagent-meta">
              <span className="reagent-name">Buffer pH 7.00</span>
              <span className="reagent-role">Submerge Electrode</span>
            </div>
          </button>

          <button
            className={`reagent-button ${phElectrodeSubmergedIn === 'SAMPLE' ? 'active' : ''}`}
            style={{ borderColor: nextAction.highlight === 'SAMPLE' ? 'var(--accent-cyan)' : '' }}
            onClick={() => moveElectrode('SAMPLE')}
          >
            <div className="reagent-meta">
              <span className="reagent-name">Water Sample</span>
              <span className="reagent-role">Submerge Electrode</span>
            </div>
          </button>

          <button
            className="reagent-button"
            onClick={() => cleanElectrode()}
            style={{ marginTop: '8px', borderColor: nextAction.highlight === 'WASH' ? 'var(--accent-cyan)' : '' }}
          >
            <div className="reagent-meta">
              <span className="reagent-name">Distilled Wash Bottle</span>
              <span className="reagent-role">Clean Electrode over Waste</span>
            </div>
          </button>
        </div>
      </div>

      {/* Procedure Checklist Card */}
      {activeMode === 'PRACTICE' && (
        <div className="glass-card">
          <h3 className="glass-card-title">Procedure Checklist</h3>
          <div className="step-checklist">
            <ChecklistItem step={1} done={checklist.phTurnOnMeter} isNext={!checklist.phTurnOnMeter} text="Turn on the pH meter" />
            <ChecklistItem step={2} done={checklist.phCleanElectrode1} isNext={checklist.phTurnOnMeter && !checklist.phCleanElectrode1} text="Clean electrode with Wash Bottle" />
            <ChecklistItem step={3} done={checklist.phCalibrate7} isNext={checklist.phCleanElectrode1 && !checklist.phCalibrate7} text="Submerge in pH 7 & Calibrate" />
            <ChecklistItem step={4} done={checklist.phCleanElectrode2} isNext={checklist.phCalibrate7 && !checklist.phCleanElectrode2} text="Clean electrode with Wash Bottle" />
            <ChecklistItem step={5} done={checklist.phCalibrate4} isNext={checklist.phCleanElectrode2 && !checklist.phCalibrate4} text="Submerge in pH 4 & Calibrate" />
            <ChecklistItem step={6} done={checklist.phCleanElectrode3} isNext={checklist.phCalibrate4 && !checklist.phCleanElectrode3} text="Clean electrode with Wash Bottle" />
            <ChecklistItem step={7} done={checklist.phMeasureSample} isNext={checklist.phCleanElectrode3 && !checklist.phMeasureSample} text="Submerge in Sample" />
            <ChecklistItem step={8} done={checklist.phRecordResult} isNext={checklist.phMeasureSample && !checklist.phRecordResult} text="Record stable reading in Logbook" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PHPanel;

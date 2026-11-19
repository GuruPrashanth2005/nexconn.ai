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

export const HardnessPanel: React.FC = () => {
  const {
    activeMode, selectedEquipment, selectEquipment, activePipetteLiquid,
    isBuretteFilled, flaskHasSample, flaskHasIndicator,
    checklist, pipetteDraw, pipetteDispense, addIndicatorToFlask, fillBurette
  } = useSimulationStore();

  const handleReagentClick = (name: string) => {
    if (selectedEquipment === name) selectEquipment(null);
    else selectEquipment(name);
  };

  const getNextAction = () => {
    if (!checklist.readBriefing) return "1. Read Safety Briefing";
    if (!checklist.selectTitrant) return "2. Select EDTA Reagent";
    if (!checklist.fillBurette) return "3. Fill Burette with EDTA";
    if (!checklist.pipetteSample) return "4. Pipette 20 ml sample to flask";
    if (!checklist.addIndicator1) return "5. Add EBT Indicator to flask";
    if (!checklist.startTitration) return "6. Titrate to Blue endpoint";
    if (!checklist.recordReading1) return "7. Record Endpoint in Logbook";
    if (!checklist.submitCalculation) return "8. Submit Calculations";
    return "Experiment Complete!";
  };

  return (
    <div className="sidebar-panel left">
      <div className="glass-card">
        <h3 className="glass-card-title">Objective</h3>
        <p style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-muted)' }}>
          Determine the total hardness of a given water sample by titrating against standard EDTA solution using EBT indicator.
        </p>
      </div>

      <CurrentStepCard activeMode={activeMode} text={getNextAction()} />
      <AssessmentInfoCard activeMode={activeMode} />

      <div className="glass-card">
        <h3 className="glass-card-title">Reagents &amp; Equipment</h3>
        <div className="reagent-grid">
          <button className={`reagent-button ${selectedEquipment === 'EDTA_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('EDTA_BOTTLE')}>
            <div className="reagent-meta">
              <span className="reagent-name">EDTA Reagent (0.01M)</span>
              <span className="reagent-role">Titrant in Burette</span>
            </div>
            <div className="reagent-status" />
          </button>
          <button className={`reagent-button ${selectedEquipment === 'WATER_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('WATER_BOTTLE')}>
            <div className="reagent-meta">
              <span className="reagent-name">Water Sample</span>
              <span className="reagent-role">Containing Hardness</span>
            </div>
            <div className="reagent-status" />
          </button>
          <button className={`reagent-button ${selectedEquipment === 'EBT_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('EBT_BOTTLE')}>
            <div className="reagent-meta">
              <span className="reagent-name">Eriochrome Black T</span>
              <span className="reagent-role">Indicator</span>
            </div>
            <div className="reagent-status" />
          </button>
          <button className={`reagent-button ${selectedEquipment === 'PIPETTE' ? 'active' : ''}`} onClick={() => handleReagentClick('PIPETTE')} style={{ marginTop: '8px' }}>
            <div className="reagent-meta">
              <span className="reagent-name">Graduated Pipette</span>
              <span className="reagent-role">{activePipetteLiquid === 'WATER' ? 'Filled with 20ml water' : 'Empty'}</span>
            </div>
            <div className={`reagent-status ${activePipetteLiquid ? 'active' : ''}`} />
          </button>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedEquipment === 'EDTA_BOTTLE' && !isBuretteFilled && (
            <button className="btn btn-primary" onClick={fillBurette}>Fill Burette with EDTA</button>
          )}
          {selectedEquipment === 'PIPETTE' && activePipetteLiquid === null && (
            <button className="btn btn-primary" onClick={pipetteDraw}>Draw 20ml Water Sample</button>
          )}
          {selectedEquipment === 'PIPETTE' && activePipetteLiquid === 'WATER' && !flaskHasSample && (
            <button className="btn btn-primary" onClick={pipetteDispense}>Dispense Sample to Flask</button>
          )}
          {selectedEquipment === 'EBT_BOTTLE' && flaskHasSample && !flaskHasIndicator && (
            <button className="btn btn-primary" onClick={() => addIndicatorToFlask('EBT')}>Add EBT to Flask</button>
          )}
        </div>
      </div>

      {activeMode === 'PRACTICE' && (
        <div className="glass-card">
          <h3 className="glass-card-title">Procedure Checklist</h3>
          <div className="step-checklist">
            <ChecklistItem text="Read Safety Briefing" done={checklist.readBriefing} step={1} isNext={!checklist.readBriefing} />
            <ChecklistItem text="Select EDTA Titrant" done={checklist.selectTitrant} step={2} isNext={checklist.readBriefing && !checklist.selectTitrant} />
            <ChecklistItem text="Fill Burette with EDTA" done={checklist.fillBurette} step={3} isNext={checklist.selectTitrant && !checklist.fillBurette} />
            <ChecklistItem text="Pipette 20 ml sample to flask" done={checklist.pipetteSample} step={4} isNext={checklist.fillBurette && !checklist.pipetteSample} />
            <ChecklistItem text="Add EBT Indicator (Wine Red)" done={checklist.addIndicator1} step={5} isNext={checklist.pipetteSample && !checklist.addIndicator1} />
            <ChecklistItem text="Titrate to Steel Blue endpoint" done={checklist.startTitration} step={6} isNext={checklist.addIndicator1 && !checklist.startTitration} />
            <ChecklistItem text="Record Endpoint" done={checklist.recordReading1} step={7} isNext={checklist.startTitration && !checklist.recordReading1} />
            <ChecklistItem text="Submit Calculations" done={checklist.submitCalculation} step={8} isNext={checklist.recordReading1 && !checklist.submitCalculation} />
          </div>
        </div>
      )}
    </div>
  );
};
export default HardnessPanel;

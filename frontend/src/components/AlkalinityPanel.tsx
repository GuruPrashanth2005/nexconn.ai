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

export const AlkalinityPanel: React.FC = () => {
  const {
    activeMode, selectedEquipment, selectEquipment, activePipetteLiquid,
    isBuretteFilled, flaskHasSample, flaskHasPhenol, flaskHasMethyl,
    checklist, pipetteDraw, pipetteDispense, addIndicatorToFlask, fillBurette, userFinalReadingA,
  } = useSimulationStore();

  const handleReagentClick = (name: string) => {
    if (selectedEquipment === name) selectEquipment(null);
    else selectEquipment(name);
  };

  const hasRecordedA = userFinalReadingA.trim() !== '';

  const getNextAction = () => {
    if (!checklist.readBriefing) return "1. Read Safety Briefing";
    if (!checklist.selectTitrant) return "2. Select Standard HCl";
    if (!checklist.fillBurette) return "3. Fill Burette with HCl";
    if (!checklist.pipetteSample) return "4. Pipette 20 ml sample to flask";
    if (!checklist.addIndicator1) return "5. Add Phenolphthalein to flask";
    if (!checklist.startTitration) return "6. Titrate to Colourless endpoint";
    if (!checklist.recordReading1) return "7. Record PA Endpoint in Logbook";
    if (!checklist.addIndicator2) return "8. Add Methyl Orange indicator";
    if (!checklist.recordReading2) return "9. Titrate to Orange and Record TA Endpoint";
    if (!checklist.submitCalculation) return "10. Submit Calculations";
    return "Experiment Complete!";
  };

  return (
    <div className="sidebar-panel left">
      <div className="glass-card">
        <h3 className="glass-card-title">Objective</h3>
        <p style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-muted)' }}>
          Determine PA and TA of a water sample using acid titration (HCl) with Phenolphthalein and Methyl Orange indicators.
        </p>
      </div>

      <CurrentStepCard activeMode={activeMode} text={getNextAction()} />
      <AssessmentInfoCard activeMode={activeMode} />

      <div className="glass-card">
        <h3 className="glass-card-title">Reagents & Equipment</h3>
        <div className="reagent-grid">
          <button className={`reagent-button ${selectedEquipment === 'HCL_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('HCL_BOTTLE')}>
            <div className="reagent-meta">
              <span className="reagent-name">Standard HCl (0.02N)</span>
              <span className="reagent-role">Titrant in Burette</span>
            </div>
            <div className="reagent-status" />
          </button>
          <button className={`reagent-button ${selectedEquipment === 'WATER_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('WATER_BOTTLE')}>
            <div className="reagent-meta">
              <span className="reagent-name">Water Sample</span>
              <span className="reagent-role">Containing Alkalinity</span>
            </div>
            <div className="reagent-status" />
          </button>
          <button className={`reagent-button ${selectedEquipment === 'PHENOL_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('PHENOL_BOTTLE')}>
            <div className="reagent-meta">
              <span className="reagent-name">Phenolphthalein</span>
              <span className="reagent-role">Indicator for PA</span>
            </div>
            <div className="reagent-status" />
          </button>
          <button className={`reagent-button ${selectedEquipment === 'METHYL_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('METHYL_BOTTLE')}>
            <div className="reagent-meta">
              <span className="reagent-name">Methyl Orange</span>
              <span className="reagent-role">Indicator for TA</span>
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
          {selectedEquipment === 'HCL_BOTTLE' && !isBuretteFilled && (
            <button className="btn btn-primary" onClick={fillBurette}>Fill Burette with HCl</button>
          )}
          {selectedEquipment === 'PIPETTE' && activePipetteLiquid === null && (
            <button className="btn btn-primary" onClick={pipetteDraw}>Draw 20ml Water Sample</button>
          )}
          {selectedEquipment === 'PIPETTE' && activePipetteLiquid === 'WATER' && !flaskHasSample && (
            <button className="btn btn-primary" onClick={pipetteDispense}>Dispense Sample to Flask</button>
          )}
          {selectedEquipment === 'PHENOL_BOTTLE' && flaskHasSample && !flaskHasPhenol && (
            <button className="btn btn-primary" onClick={() => addIndicatorToFlask('PHENOL')}>Add Phenolphthalein to Flask</button>
          )}
          {selectedEquipment === 'METHYL_BOTTLE' && flaskHasPhenol && hasRecordedA && !flaskHasMethyl && (
            <button className="btn btn-primary" onClick={() => addIndicatorToFlask('METHYL')}>Add Methyl Orange to Flask</button>
          )}
        </div>
      </div>

      {activeMode === 'PRACTICE' && (
        <div className="glass-card">
          <h3 className="glass-card-title">Procedure Checklist</h3>
          <div className="step-checklist">
            <ChecklistItem text="Read Safety Briefing" done={checklist.readBriefing} step={1} isNext={!checklist.readBriefing} />
            <ChecklistItem text="Select Standard HCl" done={checklist.selectTitrant} step={2} isNext={checklist.readBriefing && !checklist.selectTitrant} />
            <ChecklistItem text="Fill Burette with HCl" done={checklist.fillBurette} step={3} isNext={checklist.selectTitrant && !checklist.fillBurette} />
            <ChecklistItem text="Pipette 20 ml sample to flask" done={checklist.pipetteSample} step={4} isNext={checklist.fillBurette && !checklist.pipetteSample} />
            <ChecklistItem text="Add Phenolphthalein (Pink)" done={checklist.addIndicator1} step={5} isNext={checklist.pipetteSample && !checklist.addIndicator1} />
            <ChecklistItem text="Titrate to Colourless endpoint" done={checklist.startTitration} step={6} isNext={checklist.addIndicator1 && !checklist.startTitration} />
            <ChecklistItem text="Record A (PA Endpoint)" done={checklist.recordReading1} step={7} isNext={checklist.startTitration && !checklist.recordReading1} />
            <ChecklistItem text="Add Methyl Orange (Yellow)" done={checklist.addIndicator2} step={8} isNext={checklist.recordReading1 && !checklist.addIndicator2} />
            <ChecklistItem text="Titrate to Orange endpoint" done={checklist.recordReading2} step={9} isNext={checklist.addIndicator2 && !checklist.recordReading2} />
            <ChecklistItem text="Submit Calculations" done={checklist.submitCalculation} step={10} isNext={checklist.recordReading2 && !checklist.submitCalculation} />
          </div>
        </div>
      )}
    </div>
  );
};
export default AlkalinityPanel;

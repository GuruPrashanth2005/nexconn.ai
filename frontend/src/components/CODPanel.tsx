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

export const CODPanel: React.FC = () => {
  const {
    activeMode, selectedEquipment, selectEquipment, activePipetteLiquid,
    checklist, codActiveStation, switchCODStation,
    sampleHasWater, blankHasWater, sampleHasK2Cr2O7, blankHasK2Cr2O7,
    sampleHasH2SO4, blankHasH2SO4, sampleHasFerroin, blankHasFerroin,
    sampleIsRefluxing, blankIsRefluxing, sampleRefluxCompleted, blankRefluxCompleted,
    sampleBuretteFilled, blankBuretteFilled,
    pipetteDraw, pipetteDispense, addIndicatorToFlask, fillBurette, addK2Cr2O7, addH2SO4, startReflux
  } = useSimulationStore();

  const handleReagentClick = (name: string) => {
    if (selectedEquipment === name) selectEquipment(null);
    else selectEquipment(name);
  };

  const isSample = codActiveStation === 'SAMPLE';
  const hasWater = isSample ? sampleHasWater : blankHasWater;
  const hasK2Cr2O7 = isSample ? sampleHasK2Cr2O7 : blankHasK2Cr2O7;
  const hasH2SO4 = isSample ? sampleHasH2SO4 : blankHasH2SO4;
  const hasFerroin = isSample ? sampleHasFerroin : blankHasFerroin;
  const isRefluxing = isSample ? sampleIsRefluxing : blankIsRefluxing;
  const refluxCompleted = isSample ? sampleRefluxCompleted : blankRefluxCompleted;
  const currentBuretteFilled = isSample ? sampleBuretteFilled : blankBuretteFilled;

  const getNextAction = () => {
    if (isSample) {
       if (!checklist.codSamplePipette) return "1. Pipette water sample";
       if (!checklist.codSampleK2Cr2O7) return "2. Add K₂Cr₂O₇ to sample";
       if (!checklist.codSampleH2SO4) return "3. Add H₂SO₄ to sample";
       if (!checklist.codSampleStartReflux) return "4. Switch on Heating Mantle";
       if (!checklist.codSampleCompleteReflux) return "5. Wait for reflux to complete";
       if (!checklist.codSampleFillBurette) return "6. Fill burette with FAS";
       if (!checklist.codSampleAddFerroin) return "7. Add Ferroin indicator";
       if (!checklist.codSampleTitrateToWineRed) return "8. Titrate to Wine Red";
       if (!checklist.codSampleRecordV2) return "9. Record V2 in Logbook";
    } else {
       if (!checklist.codBlankPipette) return "1. Pipette blank (distilled water)";
       if (!checklist.codBlankK2Cr2O7) return "2. Add K₂Cr₂O₇ to blank";
       if (!checklist.codBlankH2SO4) return "3. Add H₂SO₄ to blank";
       if (!checklist.codBlankStartReflux) return "4. Switch on Heating Mantle";
       if (!checklist.codBlankCompleteReflux) return "5. Wait for reflux to complete";
       if (!checklist.codBlankFillBurette) return "6. Fill burette with FAS";
       if (!checklist.codBlankAddFerroin) return "7. Add Ferroin indicator";
       if (!checklist.codBlankTitrateToWineRed) return "8. Titrate to Wine Red";
       if (!checklist.codBlankRecordV1) return "9. Record V1 in Logbook";
    }
    if (!checklist.submitCalculation) return "10. Calculate COD Result";
    return "Experiment Complete!";
  };

  return (
    <div className="sidebar-panel left">
      <div className="glass-card">
        <h3 className="glass-card-title">Objective</h3>
        <p style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-muted)' }}>
          Determine Chemical Oxygen Demand (COD) of water sample using open reflux method and FAS titration.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${codActiveStation === 'SAMPLE' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => switchCODStation('SAMPLE')}
          >
            V2 - Sample Station
          </button>
          <button 
            className={`btn ${codActiveStation === 'BLANK' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => switchCODStation('BLANK')}
          >
            V1 - Blank Station
          </button>
        </div>
      </div>

      <CurrentStepCard activeMode={activeMode} text={getNextAction()} />
      <AssessmentInfoCard activeMode={activeMode} />

      <div className="glass-card">
        <h3 className="glass-card-title">Reagents &amp; Equipment</h3>
        <div className="reagent-grid">
          <button className={`reagent-button ${selectedEquipment === 'FAS_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('FAS_BOTTLE')}>
            <div className="reagent-meta">
              <span className="reagent-name">FAS (0.1N)</span>
              <span className="reagent-role">Titrant in Burette</span>
            </div>
            <div className="reagent-status" />
          </button>
          
          {isSample ? (
            <button className={`reagent-button ${selectedEquipment === 'WATER_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('WATER_BOTTLE')}>
              <div className="reagent-meta">
                <span className="reagent-name">Water Sample</span>
                <span className="reagent-role">To test</span>
              </div>
              <div className="reagent-status" />
            </button>
          ) : (
            <button className={`reagent-button ${selectedEquipment === 'BLANK_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('BLANK_BOTTLE')}>
              <div className="reagent-meta">
                <span className="reagent-name">Distilled Water</span>
                <span className="reagent-role">Blank</span>
              </div>
              <div className="reagent-status" />
            </button>
          )}

          <button className={`reagent-button ${selectedEquipment === 'K2CR2O7_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('K2CR2O7_BOTTLE')}>
            <div className="reagent-meta">
              <span className="reagent-name">Potassium Dichromate</span>
              <span className="reagent-role">K₂Cr₂O₇</span>
            </div>
            <div className="reagent-status" />
          </button>

          <button className={`reagent-button ${selectedEquipment === 'H2SO4_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('H2SO4_BOTTLE')}>
            <div className="reagent-meta">
              <span className="reagent-name">Sulfuric Acid</span>
              <span className="reagent-role">H₂SO₄</span>
            </div>
            <div className="reagent-status" />
          </button>

          <button className={`reagent-button ${selectedEquipment === 'FERROIN_BOTTLE' ? 'active' : ''}`} onClick={() => handleReagentClick('FERROIN_BOTTLE')}>
            <div className="reagent-meta">
              <span className="reagent-name">Ferroin</span>
              <span className="reagent-role">Indicator</span>
            </div>
            <div className="reagent-status" />
          </button>

          <button className={`reagent-button ${selectedEquipment === 'PIPETTE' ? 'active' : ''}`} onClick={() => handleReagentClick('PIPETTE')} style={{ marginTop: '8px' }}>
            <div className="reagent-meta">
              <span className="reagent-name">Graduated Pipette</span>
              <span className="reagent-role">{activePipetteLiquid === (isSample ? 'WATER' : 'BLANK') ? 'Filled with 20ml' : 'Empty'}</span>
            </div>
            <div className={`reagent-status ${activePipetteLiquid ? 'active' : ''}`} />
          </button>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedEquipment === 'FAS_BOTTLE' && !currentBuretteFilled && (
            <button className="btn btn-primary" onClick={fillBurette}>Fill Burette with FAS</button>
          )}
          {selectedEquipment === 'PIPETTE' && activePipetteLiquid === null && (
            <button className="btn btn-primary" onClick={pipetteDraw}>Draw 20ml {isSample ? 'Sample' : 'Blank'}</button>
          )}
          {selectedEquipment === 'PIPETTE' && activePipetteLiquid !== null && !hasWater && (
            <button className="btn btn-primary" onClick={pipetteDispense}>Dispense to Flask</button>
          )}
          {selectedEquipment === 'K2CR2O7_BOTTLE' && hasWater && !hasK2Cr2O7 && (
            <button className="btn btn-primary" onClick={addK2Cr2O7}>Add K₂Cr₂O₇</button>
          )}
          {selectedEquipment === 'H2SO4_BOTTLE' && hasWater && !hasH2SO4 && (
            <button className="btn btn-primary" onClick={addH2SO4}>Add H₂SO₄</button>
          )}
          {hasWater && hasK2Cr2O7 && hasH2SO4 && !isRefluxing && !refluxCompleted && (
            <button className="btn btn-primary" onClick={startReflux}>Switch on Heating Mantle</button>
          )}
          {selectedEquipment === 'FERROIN_BOTTLE' && hasWater && !hasFerroin && refluxCompleted && (
            <button className="btn btn-primary" onClick={() => addIndicatorToFlask('FERROIN')}>Add Ferroin Indicator</button>
          )}
        </div>
      </div>

      {activeMode === 'PRACTICE' && (
        <div className="glass-card">
          <h3 className="glass-card-title">Procedure Checklist</h3>
          <div className="step-checklist" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {isSample ? (
              <>
                <ChecklistItem text="Pipette water sample" done={checklist.codSamplePipette} step={1} isNext={!checklist.codSamplePipette} />
                <ChecklistItem text="Add K₂Cr₂O₇" done={checklist.codSampleK2Cr2O7} step={2} isNext={checklist.codSamplePipette && !checklist.codSampleK2Cr2O7} />
                <ChecklistItem text="Add H₂SO₄" done={checklist.codSampleH2SO4} step={3} isNext={checklist.codSampleK2Cr2O7 && !checklist.codSampleH2SO4} />
                <ChecklistItem text="Start sample reflux" done={checklist.codSampleStartReflux} step={4} isNext={checklist.codSampleH2SO4 && !checklist.codSampleStartReflux} />
                <ChecklistItem text="Complete sample reflux" done={checklist.codSampleCompleteReflux} step={5} isNext={checklist.codSampleStartReflux && !checklist.codSampleCompleteReflux} />
                <ChecklistItem text="Fill burette with FAS" done={checklist.codSampleFillBurette} step={6} isNext={checklist.codSampleCompleteReflux && !checklist.codSampleFillBurette} />
                <ChecklistItem text="Add ferroin indicator" done={checklist.codSampleAddFerroin} step={7} isNext={checklist.codSampleFillBurette && !checklist.codSampleAddFerroin} />
                <ChecklistItem text="Titrate to wine red" done={checklist.codSampleTitrateToWineRed} step={8} isNext={checklist.codSampleAddFerroin && !checklist.codSampleTitrateToWineRed} />
                <ChecklistItem text="Record V2" done={checklist.codSampleRecordV2} step={9} isNext={checklist.codSampleTitrateToWineRed && !checklist.codSampleRecordV2} />
              </>
            ) : (
              <>
                <ChecklistItem text="Prepare blank solution" done={checklist.codBlankPipette} step={1} isNext={!checklist.codBlankPipette} />
                <ChecklistItem text="Add K₂Cr₂O₇" done={checklist.codBlankK2Cr2O7} step={2} isNext={checklist.codBlankPipette && !checklist.codBlankK2Cr2O7} />
                <ChecklistItem text="Add H₂SO₄" done={checklist.codBlankH2SO4} step={3} isNext={checklist.codBlankK2Cr2O7 && !checklist.codBlankH2SO4} />
                <ChecklistItem text="Start blank reflux" done={checklist.codBlankStartReflux} step={4} isNext={checklist.codBlankH2SO4 && !checklist.codBlankStartReflux} />
                <ChecklistItem text="Complete blank reflux" done={checklist.codBlankCompleteReflux} step={5} isNext={checklist.codBlankStartReflux && !checklist.codBlankCompleteReflux} />
                <ChecklistItem text="Fill burette with FAS" done={checklist.codBlankFillBurette} step={6} isNext={checklist.codBlankCompleteReflux && !checklist.codBlankFillBurette} />
                <ChecklistItem text="Add ferroin indicator" done={checklist.codBlankAddFerroin} step={7} isNext={checklist.codBlankFillBurette && !checklist.codBlankAddFerroin} />
                <ChecklistItem text="Titrate to wine red" done={checklist.codBlankTitrateToWineRed} step={8} isNext={checklist.codBlankAddFerroin && !checklist.codBlankTitrateToWineRed} />
                <ChecklistItem text="Record V1" done={checklist.codBlankRecordV1} step={9} isNext={checklist.codBlankTitrateToWineRed && !checklist.codBlankRecordV1} />
              </>
            )}
            <ChecklistItem text="Calculate COD Result" done={checklist.submitCalculation} step={10} isNext={false} />
          </div>
        </div>
      )}
    </div>
  );
};
export default CODPanel;

import React, { useEffect } from 'react';
import type { ExperimentModule, ExperimentMode } from '../state/simulationStore';

const safetyBriefings = {
  HARDNESS: {
    title: 'Determination of Total Hardness of Water',
    hazards: [
      { name: 'EDTA', desc: 'A metal chelating agent. Avoid contact with skin and eyes.' },
      { name: 'Eriochrome Black-T', desc: 'Indicator dye. Avoid inhalation and direct contact.' },
      { name: 'Buffer Solution pH 10', desc: 'May cause mild irritation. Handle carefully.' },
      { name: 'PPE Required', desc: 'Safety goggles, gloves, and lab coat.' }
    ],
    protocolTitle: 'Total Hardness',
    protocol: [
      'Select EDTA and fill the burette.',
      'Pipette 20 ml of water sample into the conical flask.',
      'Add buffer solution and Eriochrome Black-T indicator.',
      'Observe wine red colour formation.',
      'Titrate with EDTA while swirling the flask.',
      'Near endpoint, use drop-wise titration.',
      'Stop when the colour changes from wine red to stable blue.',
      'Record the burette reading and calculate hardness.'
    ]
  },
  ALKALINITY: {
    title: 'Determination of Alkalinity of Water',
    hazards: [
      { name: 'Standard HCl', desc: 'Corrosive acid. Avoid skin and eye contact.' },
      { name: 'Phenolphthalein', desc: 'Indicator solution. Avoid ingestion and direct contact.' },
      { name: 'Methyl Orange', desc: 'Indicator dye. Avoid inhalation and skin contact.' },
      { name: 'PPE Required', desc: 'Safety goggles, gloves, and lab coat.' }
    ],
    protocolTitle: 'Alkalinity',
    protocol: [
      'Fill the burette with standard HCl.',
      'Pipette 20 ml of water sample into the conical flask.',
      'Add phenolphthalein indicator.',
      'If the solution turns pink, titrate with HCl until it becomes colourless.',
      'Record Endpoint A reading.',
      'Add methyl orange indicator to the same solution.',
      'Continue titration until the colour changes from yellow to orange.',
      'Record Endpoint B reading.',
      'Calculate P-Alkalinity, T-Alkalinity, OH⁻, CO₃²⁻, and HCO₃⁻ alkalinity.'
    ]
  },
  COD: {
    title: 'Determination of Chemical Oxygen Demand',
    hazards: [
      { name: 'Potassium Dichromate, K₂Cr₂O₇', desc: 'Strong oxidizing agent. Toxic and hazardous. Avoid contact.' },
      { name: 'Sulphuric Acid, H₂SO₄', desc: 'Highly corrosive. Handle with extreme care.' },
      { name: 'Ferrous Ammonium Sulphate, FAS', desc: 'Titrant. Avoid direct contact.' },
      { name: 'Ferroin Indicator', desc: 'Indicator solution. Avoid ingestion and contact.' },
      { name: 'Heating/Reflux Setup', desc: 'Hot surfaces may cause burns.' },
      { name: 'PPE Required', desc: 'Safety goggles, gloves, and lab coat.' }
    ],
    protocolTitle: 'COD',
    protocol: [
      'Pipette the water sample into the reflux flask.',
      'Add K₂Cr₂O₇ and H₂SO₄ carefully.',
      'Start reflux and allow the simulated reflux process to complete.',
      'Fill the burette with FAS.',
      'Add ferroin indicator.',
      'Titrate the sample until the colour changes from bluish green to wine red.',
      'Record V2, the FAS volume for sample titration.',
      'Prepare and titrate the blank solution separately.',
      'Record V1, the FAS volume for blank titration.',
      'Calculate COD using the formula: COD = ((V1 - V2) × N × 8000) / Sample Volume'
    ]
  },
  PH: {
    title: 'Determination of pH',
    hazards: [
      { name: 'Standard Buffers', desc: 'May cause mild eye irritation. Do not ingest.' },
      { name: 'Glass Electrode', desc: 'Fragile. Handle with care to prevent breakage.' },
      { name: 'PPE Required', desc: 'Safety goggles and lab coat.' }
    ],
    protocolTitle: 'pH Determination',
    protocol: [
      'Turn on the digital pH meter.',
      'Remove the electrode from the storage solution.',
      'Clean the electrode using the wash bottle (distilled water).',
      'Submerge electrode in pH 7.00 buffer and calibrate.',
      'Clean the electrode again.',
      'Submerge electrode in pH 4.01 buffer and calibrate.',
      'Clean the electrode one final time.',
      'Submerge the electrode in the unknown sample.',
      'Wait for the reading to stabilize and record the result.'
    ]
  }
};

export const SafetyBriefing: React.FC<{
  module: ExperimentModule;
  mode: ExperimentMode;
  onAccept: () => void;
  onCancel: () => void;
}> = ({ module, mode, onAccept, onCancel }) => {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const briefing = safetyBriefings[module];

  return (
    <div className="modal-backdrop" style={{ zIndex: 100001, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" style={{ width: '550px', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--panel-border)', padding: '24px' }}>
        <div className="modal-header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
          <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Virtual Lab Safety Briefing</h2>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <p style={{ marginBottom: '16px', color: 'var(--text-main)' }}>
            Before entering the {mode.toLowerCase()} environment for <strong>{briefing.title}</strong>, please review the critical safety hazards and the standard operating procedure.
          </p>

          <div
            style={{
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ color: 'var(--warning)', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Chemical Safety & Hazards
            </h4>
            <ul style={{ paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {briefing.hazards.map((hazard: { name: string; desc: string }, idx: number) => (
                <li key={idx} style={{ marginBottom: '6px' }}>
                  <strong>{hazard.name}:</strong> {hazard.desc}
                </li>
              ))}
            </ul>
          </div>

          {mode === 'PRACTICE' ? (
            <>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-main)' }}>
                Experiment Protocol: {briefing.protocolTitle}
              </h4>
              <ol style={{ paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {briefing.protocol.map((step: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    {step}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed rgba(168, 85, 247, 0.4)', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.05)' }}>
              <h4 style={{ color: 'var(--accent-purple)', marginBottom: '8px' }}>📝 Assessment Mode</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                The step-by-step protocol is hidden. You are expected to perform the experiment from memory. Good luck!
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ padding: '12px 24px' }} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={onAccept}>
            Accept & Start Experiment
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyBriefing;

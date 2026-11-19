import React, { useState } from 'react';
import type { ExperimentModule } from '../state/simulationStore';

const prerequisites = [
  "I am in a quiet, distraction-free environment.",
  "I have a stable internet connection and sufficient battery/power.",
  "I will not open other tabs, browsers, or applications.",
  "I understand that the step-by-step protocol and hints will be disabled.",
  "I understand that navigating away or pressing ESC will result in a warning.",
];

const formatModuleName = (id?: string) => {
  if (!id) return '';
  if (id === 'HARDNESS') return 'Total Hardness';
  if (id === 'PH') return 'pH Determination';
  return id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();
};

export const AssessmentPortal: React.FC<{
  module: ExperimentModule;
  onAccept: () => void;
  onCancel: () => void;
}> = ({ module, onAccept, onCancel }) => {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(prerequisites.length).fill(false));

  const handleCheck = (index: number) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
  };

  const allChecked = checkedItems.every((item) => item);

  return (
    <div className="assessment-portal-overlay">
      <div className="assessment-portal-container">
        
        <div className="portal-header">
          <div className="pulsing-red-dot"></div>
          <h2>Assessment Environment Security Check</h2>
          <p>You are entering the assessment for <strong>{formatModuleName(module)}</strong>. Please review and acknowledge the following academic integrity and environment rules before proceeding.</p>
        </div>

        <div className="portal-body">
          <div className="prerequisites-list">
            {prerequisites.map((req, idx) => (
              <label 
                key={idx} 
                className={`prerequisite-item ${checkedItems[idx] ? 'checked' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleCheck(idx);
                }}
              >
                <div className="checkbox-container">
                  <input type="checkbox" checked={checkedItems[idx]} readOnly />
                  <span className="custom-checkbox"></span>
                </div>
                <span className="req-text">{req}</span>
              </label>
            ))}
          </div>

          <div className="focus-mode-info">
            <h4><span className="icon">⚠️</span> Strict Focus Mode Enabled</h4>
            <p>
              Once you start, the environment will enter fullscreen. If you attempt to switch tabs, minimize the window, or exit fullscreen, your actions will be recorded as a violation. Three violations will result in automatic termination of the assessment.
            </p>
          </div>
        </div>

        <div className="portal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Return to Modules
          </button>
          <button 
            className={`btn btn-primary ${!allChecked ? 'disabled' : 'pulse-btn'}`} 
            disabled={!allChecked}
            onClick={onAccept}
          >
            Acknowledge & Enter Assessment
          </button>
        </div>

      </div>
    </div>
  );
};

export default AssessmentPortal;

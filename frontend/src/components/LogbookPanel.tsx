import React, { useEffect, useRef } from 'react';
import { useSimulationStore } from '../state/simulationStore';

interface LogbookPanelProps {
  onClose: () => void;
}

export const LogbookPanel: React.FC<LogbookPanelProps> = ({ onClose }) => {
  const {
    activeModule,
    userInitialReading,
    userFinalReading,
    userHardnessInput,
    userFinalReadingA,
    userFinalReadingB,
    userPAInput,
    userTAInput,
    userOHInput,
    userCO3Input,
    userHCO3Input,
    userCODInitialSample,
    userCODEndpointSample,
    userCODInitialBlank,
    userCODEndpointBlank,
    userCODResult,
    userPHResult,
    updateLogbook,
    submitExperiment,
    isExperimentSubmitted,
    flaskTitrantVolume,
  } = useSimulationStore();

  const prevInputsRefAlk = useRef({ I: '', A: '', B: '' });
  const prevInputsRefCOD = useRef({ IS: '', ES: '', IB: '', EB: '' });

  // Alkalinity Auto-calculate
  useEffect(() => {
    if (activeModule !== 'ALKALINITY') return;
    const currInputs = { I: userInitialReading, A: userFinalReadingA, B: userFinalReadingB };
    if (prevInputsRefAlk.current.I === currInputs.I && prevInputsRefAlk.current.A === currInputs.A && prevInputsRefAlk.current.B === currInputs.B) return;
    prevInputsRefAlk.current = currInputs;

    const I = parseFloat(userInitialReading);
    const A = parseFloat(userFinalReadingA);
    const B = parseFloat(userFinalReadingB);

    let PA = 0, TA = 0, OH = 0, CO3 = 0, HCO3 = 0;
    let isValid = false;
    
    if (!isNaN(I) && !isNaN(A) && !isNaN(B) && A >= I && B > A) {
      isValid = true;
      const VA = A - I;
      const VB = B - I;
      PA = VA * 50;
      TA = VB * 50;

      const tol = 0.01;
      if (PA <= tol) HCO3 = TA;
      else if (Math.abs(PA - TA / 2) <= tol) CO3 = 2 * PA;
      else if (PA < TA / 2) { CO3 = 2 * PA; HCO3 = TA - 2 * PA; }
      else if (PA > TA / 2 && Math.abs(PA - TA) > tol) { OH = 2 * PA - TA; CO3 = 2 * (TA - PA); }
      else if (Math.abs(PA - TA) <= tol) OH = TA;
    }

    updateLogbook('userPAInput', isValid ? PA.toFixed(1) : '');
    updateLogbook('userTAInput', isValid ? TA.toFixed(1) : '');
    updateLogbook('userOHInput', isValid ? Math.max(0, OH).toFixed(1) : '');
    updateLogbook('userCO3Input', isValid ? Math.max(0, CO3).toFixed(1) : '');
    updateLogbook('userHCO3Input', isValid ? Math.max(0, HCO3).toFixed(1) : '');
  }, [activeModule, userInitialReading, userFinalReadingA, userFinalReadingB, updateLogbook]);

  // COD Auto-calculate
  useEffect(() => {
    if (activeModule !== 'COD') return;
    const currInputs = { IS: userCODInitialSample, ES: userCODEndpointSample, IB: userCODInitialBlank, EB: userCODEndpointBlank };
    if (prevInputsRefCOD.current.IS === currInputs.IS && prevInputsRefCOD.current.ES === currInputs.ES && prevInputsRefCOD.current.IB === currInputs.IB && prevInputsRefCOD.current.EB === currInputs.EB) return;
    prevInputsRefCOD.current = currInputs;

    const IS = parseFloat(userCODInitialSample);
    const ES = parseFloat(userCODEndpointSample);
    const IB = parseFloat(userCODInitialBlank);
    const EB = parseFloat(userCODEndpointBlank);

    if (!isNaN(IS) && !isNaN(ES) && !isNaN(IB) && !isNaN(EB) && ES >= IS && EB >= IB) {
      const v2 = ES - IS;
      const v1 = EB - IB;
      if (v1 > v2) {
        const cod = (v1 - v2) * 40;
        updateLogbook('userCODResult', cod.toFixed(1));
      } else {
        updateLogbook('userCODResult', '');
      }
    } else {
      updateLogbook('userCODResult', '');
    }
  }, [activeModule, userCODInitialSample, userCODEndpointSample, userCODInitialBlank, userCODEndpointBlank, updateLogbook]);

  const handleAutoFill = () => {
    updateLogbook('userInitialReading', '0.00');
    if (activeModule === 'HARDNESS') {
      updateLogbook('userFinalReading', flaskTitrantVolume.toFixed(2));
      const calculatedVal = (flaskTitrantVolume * 50).toFixed(1);
      updateLogbook('userHardnessInput', calculatedVal);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLogbook(field, e.target.value);
  };

  const getTitle = () => {
    if (activeModule === 'HARDNESS') return 'Determination of Total Hardness';
    if (activeModule === 'ALKALINITY') return 'Alkalinity Determination';
    if (activeModule === 'PH') return 'Determination of pH';
    return 'Determination of COD';
  };

  return (
    <div className="logbook-overlay">
      <div className="logbook-header">
        <span className="logbook-title">Laboratory Notebook</span>
        <button className="logbook-close" onClick={onClose}>&times;</button>
      </div>

      <div className="logbook-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#555' }}>Experiment: {getTitle()}</span>
          {activeModule === 'HARDNESS' && (
            <button type="button" className="btn btn-secondary" onClick={handleAutoFill} style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.06)', color: '#333', borderColor: 'rgba(0,0,0,0.15)', borderRadius: '4px', border: '1px solid' }}>Auto-fill Readings</button>
          )}
        </div>

        <div className="logbook-content">
          {/* HARDNESS */}
          {activeModule === 'HARDNESS' && (
            <>
              <div className="form-group"><label>Initial Burette Reading (ml)</label><input type="number" step="0.01" className="logbook-input" value={userInitialReading} onChange={handleInputChange('userInitialReading')} placeholder="0.00" disabled={isExperimentSubmitted} /></div>
              <div className="form-group"><label>Final Burette Reading (ml)</label><input type="number" step="0.01" className="logbook-input" value={userFinalReading} onChange={handleInputChange('userFinalReading')} placeholder="0.00" disabled={isExperimentSubmitted} /></div>
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#555' }}><ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}><li>• Water sample volume = 20 ml</li><li>• EDTA factor = 1.0</li></ul><span style={{ display: 'block', marginTop: '6px', fontWeight: 'bold', color: '#0369a1' }}>Hardness = V × (1000 / 20) = V × 50</span></div>
              <div className="form-group" style={{ marginTop: '16px' }}><label>Calculated Hardness (mg/L CaCO3)</label><input type="number" step="0.1" className="logbook-input" value={userHardnessInput} onChange={handleInputChange('userHardnessInput')} placeholder="e.g. 810.0" disabled={isExperimentSubmitted} /></div>
            </>
          )}

          {/* ALKALINITY */}
          {activeModule === 'ALKALINITY' && (
            <div className="alkalinity-section">
              <div style={{ padding: '8px', background: '#f8fafc', borderLeft: '4px solid #3b82f6', marginBottom: '16px', fontSize: '0.85rem' }}>Only burette readings are entered manually. Alkalinity values are auto-calculated using the formulas below.</div>
              <div className="form-group"><label>Initial Burette Reading (ml)</label><input type="number" step="0.01" className="logbook-input" value={userInitialReading} onChange={handleInputChange('userInitialReading')} placeholder="0.00" disabled={isExperimentSubmitted} /></div>
              <div className="alkalinity-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '16px' }}>
                <div className="form-group"><label>Endpoint A Reading (ml)</label><input type="number" step="0.01" className="logbook-input" value={userFinalReadingA} onChange={handleInputChange('userFinalReadingA')} placeholder="0.00" disabled={isExperimentSubmitted} /></div>
                <div className="form-group"><label>Endpoint B Reading (ml)</label><input type="number" step="0.01" className="logbook-input" value={userFinalReadingB} onChange={handleInputChange('userFinalReadingB')} placeholder="0.00" disabled={isExperimentSubmitted} /></div>
              </div>
              {userFinalReadingA !== '' && userFinalReadingB !== '' && parseFloat(userFinalReadingB) <= parseFloat(userFinalReadingA) && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 'bold' }}>Warning: Endpoint B must be greater than Endpoint A.</div>}
              {userInitialReading !== '' && userFinalReadingA !== '' && parseFloat(userFinalReadingA) < parseFloat(userInitialReading) && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 'bold' }}>Warning: Endpoint A must be greater than or equal to Initial Reading.</div>}
              <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155' }}>Calculated Results</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="calc-field"><label style={{ fontSize: '0.8rem', color: '#64748b' }}>P-Alkalinity (mg/L)</label><div style={{ fontWeight: 'bold', color: '#0f172a' }}>{userPAInput || '0.0'}</div></div>
                  <div className="calc-field"><label style={{ fontSize: '0.8rem', color: '#64748b' }}>T-Alkalinity (mg/L)</label><div style={{ fontWeight: 'bold', color: '#0f172a' }}>{userTAInput || '0.0'}</div></div>
                  <div className="calc-field"><label style={{ fontSize: '0.8rem', color: '#64748b' }}>OH⁻ Alkalinity (mg/L)</label><div style={{ fontWeight: 'bold', color: '#0f172a' }}>{userOHInput || '0.0'}</div></div>
                  <div className="calc-field"><label style={{ fontSize: '0.8rem', color: '#64748b' }}>CO₃²⁻ Alkalinity (mg/L)</label><div style={{ fontWeight: 'bold', color: '#0f172a' }}>{userCO3Input || '0.0'}</div></div>
                  <div className="calc-field"><label style={{ fontSize: '0.8rem', color: '#64748b' }}>HCO₃⁻ Alkalinity (mg/L)</label><div style={{ fontWeight: 'bold', color: '#0f172a' }}>{userHCO3Input || '0.0'}</div></div>
                </div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', color: '#475569', lineHeight: '1.5' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>Calculation Formula</h4>
                <div>Initial Reading = I, Endpoint A = A, Endpoint B = B</div>
                <div>V<sub>A</sub> = A - I</div>
                <div>V<sub>B</sub> = B - I</div>
                <div style={{ margin: '8px 0' }}><div>P-Alkalinity = (V<sub>A</sub> × N × 50000) / V</div><div>T-Alkalinity = (V<sub>B</sub> × N × 50000) / V</div></div>
                <div>For this simulation: N = 0.02 N, V = 20 ml</div>
                <div style={{ fontWeight: 'bold', margin: '4px 0 8px 0' }}>P-Alkalinity = V<sub>A</sub> × 50<br/>T-Alkalinity = V<sub>B</sub> × 50</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                  <div><strong>If P = 0:</strong><br/>OH⁻ = 0<br/>CO₃²⁻ = 0<br/>HCO₃⁻ = T</div>
                  <div><strong>If P &lt; T/2:</strong><br/>OH⁻ = 0<br/>CO₃²⁻ = 2P<br/>HCO₃⁻ = T - 2P</div>
                  <div><strong>If P = T/2:</strong><br/>OH⁻ = 0<br/>CO₃²⁻ = 2P<br/>HCO₃⁻ = 0</div>
                  <div><strong>If P &gt; T/2:</strong><br/>OH⁻ = 2P - T<br/>CO₃²⁻ = 2(T - P)<br/>HCO₃⁻ = 0</div>
                  <div><strong>If P = T:</strong><br/>OH⁻ = T<br/>CO₃²⁻ = 0<br/>HCO₃⁻ = 0</div>
                </div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', color: '#475569', lineHeight: '1.5', background: '#fafafa' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>Substituted Values</h4>
                {(() => {
                  const I = parseFloat(userInitialReading); const A = parseFloat(userFinalReadingA); const B = parseFloat(userFinalReadingB);
                  if (isNaN(I) || isNaN(A) || isNaN(B) || A < I || B <= A) return <div>Enter valid readings to see substituted formulas.</div>;
                  const VA = A - I; const VB = B - I; const P = VA * 50; const T = VB * 50;
                  let cond = ''; const tol = 0.01;
                  if (P <= tol) cond = 'P = 0';
                  else if (Math.abs(P - T/2) <= tol) cond = 'P = T/2';
                  else if (P < T/2) cond = 'P < T/2';
                  else if (P > T/2 && Math.abs(P - T) > tol) cond = 'P > T/2';
                  else if (Math.abs(P - T) <= tol) cond = 'P = T';
                  return (
                    <>
                      <div>V<sub>A</sub> = {A.toFixed(2)} - {I.toFixed(2)} = {VA.toFixed(2)} ml</div>
                      <div>V<sub>B</sub> = {B.toFixed(2)} - {I.toFixed(2)} = {VB.toFixed(2)} ml</div>
                      <div style={{ margin: '8px 0' }}><div>P-Alkalinity = {VA.toFixed(2)} × 50 = {P.toFixed(1)} mg/L</div><div>T-Alkalinity = {VB.toFixed(2)} × 50 = {T.toFixed(1)} mg/L</div></div>
                      <div><strong>Since {cond}:</strong></div>
                      <div>OH⁻ Alkalinity = {userOHInput} mg/L</div>
                      <div>CO₃²⁻ Alkalinity = {userCO3Input} mg/L</div>
                      <div>HCO₃⁻ Alkalinity = {userHCO3Input} mg/L</div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* COD */}
          {activeModule === 'COD' && (
            <div className="cod-section">
              <div style={{ padding: '8px', background: '#f8fafc', borderLeft: '4px solid #3b82f6', marginBottom: '16px', fontSize: '0.85rem' }}>Only burette readings are entered manually. COD is auto-calculated using the formulas below.</div>
              
              <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>Sample Titration Readings</h4>
              <div className="alkalinity-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '8px' }}>
                <div className="form-group"><label>Sample Initial Burette Reading (ml)</label><input type="number" step="0.01" className="logbook-input" value={userCODInitialSample} onChange={handleInputChange('userCODInitialSample')} placeholder="0.00" disabled={isExperimentSubmitted} /></div>
                <div className="form-group"><label>Sample Endpoint Reading V2 (ml)</label><input type="number" step="0.01" className="logbook-input" value={userCODEndpointSample} onChange={handleInputChange('userCODEndpointSample')} placeholder="0.00" disabled={isExperimentSubmitted} /></div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '16px', fontWeight: 'bold' }}>
                FAS used for sample = V2 - Sample Initial
              </div>

              <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>Blank Titration Readings</h4>
              <div className="alkalinity-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '8px' }}>
                <div className="form-group"><label>Blank Initial Burette Reading (ml)</label><input type="number" step="0.01" className="logbook-input" value={userCODInitialBlank} onChange={handleInputChange('userCODInitialBlank')} placeholder="0.00" disabled={isExperimentSubmitted} /></div>
                <div className="form-group"><label>Blank Endpoint Reading V1 (ml)</label><input type="number" step="0.01" className="logbook-input" value={userCODEndpointBlank} onChange={handleInputChange('userCODEndpointBlank')} placeholder="0.00" disabled={isExperimentSubmitted} /></div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '16px', fontWeight: 'bold' }}>
                FAS used for blank = V1 - Blank Initial
              </div>

              {/* Validation Warning */}
              {(() => {
                const IS = parseFloat(userCODInitialSample); const ES = parseFloat(userCODEndpointSample);
                const IB = parseFloat(userCODInitialBlank); const EB = parseFloat(userCODEndpointBlank);
                if (!isNaN(IS) && !isNaN(ES) && !isNaN(IB) && !isNaN(EB)) {
                  const v2 = ES - IS; const v1 = EB - IB;
                  if (v1 <= v2) return <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 'bold' }}>Invalid COD readings. Blank FAS volume should be greater than sample FAS volume.</div>;
                }
                return null;
              })()}

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Calculated COD (mg/L)</label>
                <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px', fontWeight: 'bold', color: '#0f172a', border: '1px solid #cbd5e1' }}>
                  {userCODResult || '0.0'}
                </div>
              </div>

              {/* Calculation Formula Section */}
              <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', color: '#475569', lineHeight: '1.5' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>Calculation Formula</h4>
                <div>V1 = FAS used for blank</div>
                <div>V2 = FAS used for sample</div>
                <div>N = Normality of FAS</div>
                <div>V = Volume of sample</div>
                <div style={{ margin: '8px 0' }}>
                  <div>COD = ((V1 - V2) × N × 8000) / V</div>
                </div>
                <div style={{ fontWeight: 'bold', margin: '4px 0 8px 0' }}>
                  For this simulation:<br/>
                  N = 0.1 N<br/>
                  V = 20 ml<br/>
                  <br/>
                  So:<br/>
                  COD = (V1 - V2) × 40
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', color: '#475569', lineHeight: '1.5', background: '#fafafa' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>Substituted Values</h4>
                {(() => {
                  const IS = parseFloat(userCODInitialSample); const ES = parseFloat(userCODEndpointSample);
                  const IB = parseFloat(userCODInitialBlank); const EB = parseFloat(userCODEndpointBlank);
                  if (isNaN(IS) || isNaN(ES) || isNaN(IB) || isNaN(EB) || ES < IS || EB < IB) {
                    return <div>Enter valid readings to see substituted formulas.</div>;
                  }
                  const V2 = ES - IS;
                  const V1 = EB - IB;
                  if (V1 <= V2) {
                    return <div style={{ color: '#ef4444' }}>Blank volume must be greater than sample volume.</div>;
                  }
                  const diff = V1 - V2;
                  const cod = diff * 40;
                  return (
                    <>
                      <div>V1 - V2 = {V1.toFixed(2)} - {V2.toFixed(2)} = {diff.toFixed(2)} ml</div>
                      <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#0f172a' }}>COD = {diff.toFixed(2)} × 40 = {cod.toFixed(0)} mg/L</div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* PH DETERMINATION */}
          {activeModule === 'PH' && (
            <div className="ph-section">
              <div style={{ padding: '8px', background: '#f8fafc', borderLeft: '4px solid #3b82f6', marginBottom: '16px', fontSize: '0.85rem' }}>
                Enter the final stable pH reading of the unknown water sample.
              </div>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Recorded pH Value</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="logbook-input" 
                  value={userPHResult} 
                  onChange={handleInputChange('userPHResult')} 
                  placeholder="e.g. 7.45" 
                  disabled={isExperimentSubmitted} 
                />
              </div>

              <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', color: '#475569', lineHeight: '1.5' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>Calculation Formula</h4>
                <div>pH determination is a direct potentiometric measurement. No further calculations are required.</div>
                <div style={{ marginTop: '8px' }}>
                  <strong>Note:</strong> Ensure the machine was calibrated properly at pH 7.00 and pH 4.01 before taking the final sample reading.
                </div>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px' }}
            onClick={submitExperiment}
            disabled={isExperimentSubmitted}
          >
            {isExperimentSubmitted ? 'Submitted' : 'Submit Results for Evaluation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogbookPanel;

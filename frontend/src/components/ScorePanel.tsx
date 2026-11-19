import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../state/simulationStore';
import { useAuth } from '../context/AuthContext';
import { calculateHardness } from '../logic/chemistryEngine';
import { calculateCODResult } from '../logic/codEngine';

export const ScorePanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    evaluationReport,
    resetSimulation,
    endpoint,
    endpointA,
    endpointB,
    endpointCODBlank,
    endpointCODSample,
    flaskTitrantVolume,
    activeModule,
    activeMode,
    userCODEndpointBlank,
    userCODEndpointSample,
    userCODResult,
    setEvaluationReport,
  } = useSimulationStore();

const [isEvaluating, setIsEvaluating] = React.useState(true);

React.useEffect(() => {
  if (evaluationReport && !evaluationReport.aiFeedback && isEvaluating) {
    const fetchAIFeedback = async () => {
      try {
        const { generateEvaluatorReport } = await import('../services/aiService');
        const labStateSummary = `Module: ${activeModule}, Score: ${evaluationReport.score}, Status: ${evaluationReport.status}`;
        
        // For simplicity, we just pass the basic details. 
        // In a real app we'd pass all the user's inputs.
        const userSubmitted = activeModule === 'HARDNESS' ? calculateHardness(flaskTitrantVolume) : (activeModule === 'PH' ? parseFloat(useSimulationStore.getState().userPHResult || '0') : 0);
        const trueVal = activeModule === 'HARDNESS' ? calculateHardness(endpoint) : (activeModule === 'PH' ? useSimulationStore.getState().phTrueSampleValue : 0);

        const aiFeedback = await generateEvaluatorReport(labStateSummary, evaluationReport.score, parseFloat(userSubmitted.toString()), parseFloat(trueVal.toString()));
        
        setEvaluationReport({ ...evaluationReport, aiFeedback });
      } catch (err) {
        console.error(err);
      } finally {
        setIsEvaluating(false);
      }
    };
    fetchAIFeedback();
  } else if (evaluationReport?.aiFeedback) {
    setTimeout(() => setIsEvaluating(false), 0);
  }
}, [evaluationReport, activeModule, flaskTitrantVolume, endpoint, setEvaluationReport, isEvaluating]);

if (!evaluationReport) return null;

if (isEvaluating) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ textAlign: 'center', padding: '40px' }}>
        <h2 style={{ color: 'var(--accent-purple)' }}>Hydro Evaluator</h2>
        <div style={{ margin: '20px 0', fontSize: '2rem' }}>🤖 📝</div>
        <p style={{ color: 'var(--text-muted)' }}>Analyzing your experiment technique...</p>
      </div>
    </div>
  );
}

  const { score, breakdown, status, feedback, tips } = evaluationReport;
  const deviation = flaskTitrantVolume - endpoint;
  const theoreticalHardness = calculateHardness(endpoint);
  const userHardness = calculateHardness(flaskTitrantVolume);

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Experiment Evaluation</h2>
        </div>

        <div className="modal-body">
          {/* Status Message */}
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '1.1rem',
              marginBottom: '20px',
              background:
                status === 'success'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : status === 'partial_success'
                  ? 'rgba(245, 158, 11, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
              color:
                status === 'success'
                  ? 'var(--success)'
                  : status === 'partial_success'
                  ? 'var(--warning)'
                  : 'var(--danger)',
              border: `1px solid ${
                status === 'success'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : status === 'partial_success'
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
              }`,
            }}
          >
            {status === 'success' && '✓ Experiment Successful. Endpoint detected accurately!'}
            {status === 'partial_success' && '⚠ Experiment completed, but accuracy can improve.'}
            {status === 'failed' && '✗ Experiment Failed. Endpoint missed or procedure error.'}
          </div>

          {/* Big Score Display */}
          <div
            className={`score-badge-large ${status}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <span>{score}</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Overall Score
            </span>
          </div>

          {/* Comparison Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--panel-border)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            {activeModule === 'COD' ? (
              <>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sample Titration Status:</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Stopped at {parseFloat(userCODEndpointSample || '0').toFixed(2)} ml
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Theoretical sample endpoint V2:
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--accent-cyan)' }}>
                    {endpointCODSample.toFixed(2)} ml
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Sample endpoint error:
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {(parseFloat(userCODEndpointSample || '0') - endpointCODSample).toFixed(2)} ml
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Blank Titration Status:</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Stopped at {parseFloat(userCODEndpointBlank || '0').toFixed(2)} ml
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Theoretical blank endpoint V1:
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--accent-cyan)' }}>
                    {endpointCODBlank.toFixed(2)} ml
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Blank endpoint error:
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {(parseFloat(userCODEndpointBlank || '0') - endpointCODBlank).toFixed(2)} ml
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sample reflux status: <span style={{color: 'var(--text-main)'}}>{useSimulationStore.getState().sampleRefluxCompleted ? 'Completed' : 'Incomplete'}</span></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Blank reflux status: <span style={{color: 'var(--text-main)'}}>{useSimulationStore.getState().blankRefluxCompleted ? 'Completed' : 'Incomplete'}</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Water COD (Calculated):</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {userCODResult} mg/L
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Theoretical COD:
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--accent-cyan)' }}>
                    {calculateCODResult(endpointCODBlank, endpointCODSample)} mg/L
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Sample volume:
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    20.0 ml
                  </div>
                </div>
              </>
            ) : (
              <>
                {activeModule !== 'PH' && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stopped volume:</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {flaskTitrantVolume.toFixed(2)} ml
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Theoretical Endpoint:
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--accent-cyan)' }}>
                    {endpoint.toFixed(2)} ml
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Deviation (Error):
                  </div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: Math.abs(deviation) <= 0.1 ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {deviation >= 0 ? '+' : ''}
                    {deviation.toFixed(2)} ml
                  </div>
                </div>
                )}

                                {activeModule === 'PH' ? (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recorded pH:</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {useSimulationStore.getState().userPHResult || 'None'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Theoretical pH:
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--accent-cyan)' }}>
                      {useSimulationStore.getState().phTrueSampleValue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Deviation:
                    </div>
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: Math.abs(parseFloat(useSimulationStore.getState().userPHResult || '0') - useSimulationStore.getState().phTrueSampleValue) <= 0.05 ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {(parseFloat(useSimulationStore.getState().userPHResult || '0') - useSimulationStore.getState().phTrueSampleValue).toFixed(2)}
                    </div>
                  </div>
                ) : activeModule === 'HARDNESS' ? (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Water Hardness (Calculated):</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {userHardness} mg/L
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Theoretical Hardness:
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--accent-cyan)' }}>
                      {theoreticalHardness} mg/L
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Sample volume:
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-main)' }}>
                      20.0 ml
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>P & T Alkalinity (Calculated):</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {evaluationReport.breakdown.proceduralDetails && evaluationReport.breakdown.proceduralDetails['Logbook Calculations Correct'] ? 'Matches' : 'Mismatch'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Theoretical PA / TA:
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--accent-cyan)' }}>
                      {Math.round(endpointA * 50).toFixed(1)} / {Math.round(endpointB * 50).toFixed(1)} mg/L
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Sample volume:
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-main)' }}>
                      20.0 ml
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Scores Breakdown */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Rubric Points Awarded
            </h4>
            <div className="score-details">
              <div className="score-item"><span>Endpoint Accuracy</span><span>{breakdown.accuracy ?? 0}/50</span></div>
              <div className="score-item"><span>Correct Procedure</span><span>{breakdown.procedure ?? 0}/30</span></div>
              <div className="score-item" style={{ borderBottom: '1px solid var(--border)'}}><span>Time & Efficiency</span><span>{breakdown.time ?? 0}/20</span></div>
              
              {breakdown.proceduralDetails && Object.keys(breakdown.proceduralDetails).length > 0 && (
                <div style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', fontSize: '0.75rem' }}>Procedural Checks</div>
                  {Object.entries(breakdown.proceduralDetails).map(([key, passed]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--border)' }}>
                      <span style={{ color: 'var(--text-main)' }}>{key}</span>
                      <span>{passed ? '✅' : '❌'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Evaluator Feedback */}
          {evaluationReport.aiFeedback && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.05)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              marginBottom: '20px'
            }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span>🤖</span> Hydro Evaluator Feedback
              </h4>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                {evaluationReport.aiFeedback}
              </p>
            </div>
          )}

          {/* Action Logs / Feedback */}
          {feedback.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Procedure Log
              </h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {feedback.map((item, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvement Tips */}
          {tips && tips.length > 0 && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                color: 'var(--text-main)',
              }}
            >
              <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Improvement Tips
              </h4>
              <ul style={{ paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {tips.map((tip, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {activeMode === 'ASSESSMENT' ? (
            <button className="btn btn-primary" onClick={() => {
              navigate(user?.role === 'FACULTY' ? '/faculty-dashboard/modules' : '/student-dashboard/modules');
            }}>
              Exit Assessment
            </button>
          ) : (
            <button className="btn btn-primary" onClick={resetSimulation}>
              Restart Experiment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScorePanel;

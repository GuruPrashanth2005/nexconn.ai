import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../state/simulationStore';

interface AssessmentInfoCardProps {
  activeMode: string | null;
}

const AssessmentInfoCard: React.FC<AssessmentInfoCardProps> = ({ activeMode }) => {
  const { activeModule, assessmentStartTime, isExperimentSubmitted } = useSimulationStore();
  
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (assessmentStartTime && !isExperimentSubmitted) {
      timer = setInterval(() => {
        setSecondsElapsed(Math.floor((Date.now() - assessmentStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [assessmentStartTime, isExperimentSubmitted]);

  if (activeMode !== 'ASSESSMENT') return null;

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const accuracyLabel = activeModule === 'PH' ? 'Measurement Accuracy' : 'Endpoint Accuracy';

  return (
    <>
      <div className="glass-card" style={{ border: '1px solid var(--panel-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 className="glass-card-title" style={{ margin: 0 }}>Exam Timer</h3>
          <div style={{ 
            background: 'var(--glass-bg)', color: 'var(--accent-cyan)', 
            padding: '6px 14px', borderRadius: '8px', 
            border: '1px solid var(--panel-border)',
            fontWeight: 'bold', fontSize: '1.2rem',
            fontFamily: 'var(--font-mono)',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {formatTime(secondsElapsed)}
          </div>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
          Your completion time is being recorded and will affect your final score. Work accurately and efficiently.
        </p>
      </div>

      <div className="glass-card">
        <h3 className="glass-card-title">Grading Rubric</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'pulse 2s infinite' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{accuracyLabel}</span>
            </div>
            <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>50%</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'float 3s ease-in-out infinite' }}>
                <path d="M10 2v7.31"></path>
                <path d="M14 9.3V1.99"></path>
                <path d="M8.5 2h7"></path>
                <path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>
                <path d="M5.52 16h12.96"></path>
              </svg>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Correct Procedure</span>
            </div>
            <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>30%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'clock-spin 4s linear infinite', width: '20px', height: '20px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-pink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Time & Efficiency</span>
            </div>
            <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>20%</span>
          </div>

        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0px); }
        }
        @keyframes clock-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default AssessmentInfoCard;

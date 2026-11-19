import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const ModeSelector: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const handleModeSelect = (mode: 'PRACTICE' | 'ASSESSMENT') => {
    navigate(`/briefing/${moduleId}/${mode}`);
  };

  // Prettify the module name
  const formatModuleName = (id?: string) => {
    if (!id) return '';
    if (id === 'HARDNESS') return 'Total Hardness';
    if (id === 'PH') return 'pH Determination';
    return id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();
  };

  const bentoBoxStyle = {
    background: 'var(--panel-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--panel-border)',
    borderRadius: '16px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column' as const,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    minHeight: '320px'
  };

  return (
    <div style={{
      width: '100vw', 
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: '#fff',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      padding: '6rem 2rem', 
      overflowY: 'auto'
    }}>
      
      <div style={{ 
        width: '100%',
        maxWidth: '1000px',
        marginBottom: '3rem', 
        textAlign: 'center',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '0.9rem', 
          textTransform: 'uppercase', 
          letterSpacing: '2px',
          fontWeight: 600,
          margin: '0 0 12px 0'
        }}>
          {formatModuleName(moduleId)}
        </p>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 600, 
          letterSpacing: '-1px', 
          margin: 0,
          color: '#fff'
        }}>
          Select Simulation Mode
        </h1>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(12, 1fr)', 
        gap: '24px', 
        width: '100%', 
        maxWidth: '1000px',
        animation: 'fadeIn 0.6s ease-out'
      }}>
        
        {/* Practice Mode */}
        <div 
          style={{ 
            ...bentoBoxStyle, 
            gridColumn: 'span 6',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}
          onClick={() => handleModeSelect('PRACTICE')}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#38bdf8';
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(56, 189, 248, 0.2)';
            e.currentTarget.style.transform = 'translateY(-4px)';
            const iconBox = e.currentTarget.querySelector('.icon-box') as HTMLElement;
            if (iconBox) {
              iconBox.style.background = '#38bdf8';
              iconBox.style.color = '#000';
              iconBox.style.boxShadow = '0 0 15px #38bdf8';
            }
            const launchText = e.currentTarget.querySelector('.launch-text') as HTMLElement;
            if (launchText) {
              launchText.style.color = '#38bdf8';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
            const iconBox = e.currentTarget.querySelector('.icon-box') as HTMLElement;
            if (iconBox) {
              iconBox.style.background = 'rgba(255,255,255,0.05)';
              iconBox.style.color = '#38bdf8';
              iconBox.style.boxShadow = 'none';
            }
            const launchText = e.currentTarget.querySelector('.launch-text') as HTMLElement;
            if (launchText) {
              launchText.style.color = '#fff';
            }
          }}
        >
          {/* Glowing Orb */}
          <div style={{
            position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px',
            background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 0
          }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
            <div 
              className="icon-box"
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: 'rgba(255,255,255,0.05)', 
                color: '#38bdf8',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
              </svg>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
              Learning Phase
            </span>
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#fff', margin: '0 0 16px 0', letterSpacing: '-0.5px', position: 'relative', zIndex: 1 }}>
            Practice
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 32px 0', flex: 1, position: 'relative', zIndex: 1 }}>
            Master the procedure in a risk-free environment. Interactive hints are enabled, and the step-by-step checklist is fully visible to guide you through the experiment.
          </p>

          <div className="launch-text" style={{ fontSize: '0.9rem', fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', transition: 'color 0.3s ease', position: 'relative', zIndex: 1 }}>
            Start Practice <span style={{ fontSize: '1.2rem', lineHeight: 0 }}>&rarr;</span>
          </div>
        </div>

        {/* Assessment Mode */}
        <div 
          style={{ 
            ...bentoBoxStyle, 
            gridColumn: 'span 6',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}
          onClick={() => handleModeSelect('ASSESSMENT')}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#f43f5e';
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(244, 63, 94, 0.2)';
            e.currentTarget.style.transform = 'translateY(-4px)';
            const iconBox = e.currentTarget.querySelector('.icon-box') as HTMLElement;
            if (iconBox) {
              iconBox.style.background = '#f43f5e';
              iconBox.style.color = '#fff';
              iconBox.style.boxShadow = '0 0 15px #f43f5e';
            }
            const launchText = e.currentTarget.querySelector('.launch-text') as HTMLElement;
            if (launchText) {
              launchText.style.color = '#f43f5e';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
            const iconBox = e.currentTarget.querySelector('.icon-box') as HTMLElement;
            if (iconBox) {
              iconBox.style.background = 'rgba(255,255,255,0.05)';
              iconBox.style.color = '#f43f5e';
              iconBox.style.boxShadow = 'none';
            }
            const launchText = e.currentTarget.querySelector('.launch-text') as HTMLElement;
            if (launchText) {
              launchText.style.color = '#fff';
            }
          }}
        >
          {/* Glowing Orb */}
          <div style={{
            position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px',
            background: 'radial-gradient(circle, rgba(244,63,94,0.15) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 0
          }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
            <div 
              className="icon-box"
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: 'rgba(255,255,255,0.05)', 
                color: '#f43f5e',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
              </svg>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
              Evaluation Phase
            </span>
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#fff', margin: '0 0 16px 0', letterSpacing: '-0.5px', position: 'relative', zIndex: 1 }}>
            Assessment
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 32px 0', flex: 1, position: 'relative', zIndex: 1 }}>
            Test your knowledge in a simulated exam environment. The checklist and hints are disabled. You will be graded strictly on procedural accuracy and calculation results.
          </p>

          <div className="launch-text" style={{ fontSize: '0.9rem', fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', transition: 'color 0.3s ease', position: 'relative', zIndex: 1 }}>
            Start Assessment <span style={{ fontSize: '1.2rem', lineHeight: 0 }}>&rarr;</span>
          </div>
        </div>

      </div>

      <button 
        onClick={() => navigate(-1)}
        style={{ 
          marginTop: '4rem', 
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'var(--text-muted)',
          padding: '12px 24px', 
          fontSize: '0.9rem',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          animation: 'fadeIn 0.7s ease-out'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        }}
      >
        &larr; Back to Modules
      </button>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ModeSelector;

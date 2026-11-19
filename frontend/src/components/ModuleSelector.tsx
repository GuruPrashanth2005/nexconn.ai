import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NexconnManager from '../services/nexconnManager';

export const ModuleSelector: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;

    if (!code.startsWith('LAB-')) {
      setJoinError('Invalid Code format! Code should start with LAB- (e.g. LAB-8K2M9)');
      return;
    }

    let targetModule = 'HARDNESS';

    try {
      // Resolve which experiment this clean unique room code belongs to
      const res = await fetch(`/api/v1/nexconn/resolve-room/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.module) {
          targetModule = data.module;
        }
      } else {
        // If server says room not found, notify user
        setJoinError(`Room "${code}" not found. Ensure your partner has started an experiment session.`);
        return;
      }
    } catch {
      // Fallback: if offline, check if code contains hints or default to HARDNESS
      if (code.includes('ALKALINITY') || code.includes('ALK')) targetModule = 'ALKALINITY';
      else if (code.includes('COD')) targetModule = 'COD';
      else if (code.includes('PH')) targetModule = 'PH';
    }

    // Set active room in NexconnManager & session storage
    NexconnManager.getInstance().setActiveRoom(code);
    sessionStorage.setItem('current_active_lab_room', code);

    // Broadcast user joined
    const studentName = user?.name || user?.email?.split('@')[0] || 'Peer Collaborator';
    NexconnManager.getInstance().broadcastJoinRoom(code, studentName);

    // Directly enter the targeted 3D lab environment in PRACTICE mode
    navigate(`/lab/${targetModule}/PRACTICE`, { state: { fromApp: true } });
  };

  const bentoBoxStyle = {
    background: 'var(--panel-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--panel-border)',
    borderRadius: '16px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    overflow: 'hidden' as const
  };

  const modules = [
    {
      id: 'HARDNESS',
      title: 'Total Hardness',
      description: 'Determine the total hardness using EDTA titration with Eriochrome Black T indicator.',
      icon: 'M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8z',
      accent: '#38bdf8' // Subtle cyan accent on hover
    },
    {
      id: 'ALKALINITY',
      title: 'Alkalinity',
      description: 'Determine PA and TA using standard HCl titration with Phenolphthalein and Methyl Orange.',
      icon: 'M8 16a6 6 0 0 0 6-6c0-1.657-3-6.5-6-10C5 3.5 2 8.343 2 10a6 6 0 0 0 6 6z',
      accent: '#34d399' // Subtle emerald accent on hover
    },
    {
      id: 'COD',
      title: 'COD',
      description: 'Determine Chemical Oxygen Demand using Reflux and FAS Titration.',
      icon: 'M13.5 2a.5.5 0 0 0-1 0v7.697l-2.072 1.48a.5.5 0 0 0-.214.407v2.336a.5.5 0 0 0 .153.364l1.5 1.5a.5.5 0 0 0 .707 0l1.5-1.5a.5.5 0 0 0 .153-.364v-2.336a.5.5 0 0 0-.214-.407L12 9.697V2z M3.5 2a.5.5 0 0 0-1 0v12a.5.5 0 0 0 1 0V2z',
      accent: '#f43f5e' // Subtle rose accent on hover
    },
    {
      id: 'PH',
      title: 'pH Determination',
      description: 'Determine the pH of a water sample using a digital pH meter and standard buffer solutions.',
      icon: 'M1 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3zm3.5 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3z',
      accent: '#a78bfa' // Subtle purple accent on hover
    }
  ];

  return (
    <div style={{
      width: '100%',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.5px', color: '#fff', margin: '0 0 8px 0' }}>
          Select Module
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Welcome, {user?.name || user?.email?.split('@')[0] || 'Explorer'}. Choose an experiment or join a collaborative lab session.
        </p>
      </div>

      {/* Nexconn Room Code Direct Join Box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
        border: '1px solid rgba(96, 165, 250, 0.3)',
        borderRadius: '16px',
        padding: '20px 28px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.2rem' }}>🤝</span>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '1.05rem' }}>Join Partner Collaborative Lab</span>
            <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(34, 197, 94, 0.4)' }}>
              Nexconn Real-time
            </span>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
            Enter your peer's Lab Invite Code (e.g. <strong>LAB-9X4M2</strong>) to synchronize live burette titration & observations.
          </p>
        </div>

        <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="LAB-9X4M2"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              setJoinError(null);
            }}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#38bdf8',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '1px',
              width: '140px',
              textTransform: 'uppercase'
            }}
          />
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            Enter Lab →
          </button>
        </form>
      </div>
      {joinError && (
        <div style={{ marginTop: '-20px', marginBottom: '24px', color: '#f87171', fontSize: '0.85rem', fontWeight: 500 }}>
          ⚠ {joinError}
        </div>
      )}
      
      {/* Bento Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        
        {modules.map((module, index) => (
          <div 
            key={module.id}
            style={{ 
              ...bentoBoxStyle, 
              gridColumn: 'span 6',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = module.accent;
              e.currentTarget.style.boxShadow = `0 10px 40px ${module.accent}20`;
              e.currentTarget.style.transform = 'translateY(-4px)';
              const iconBox = e.currentTarget.querySelector('.icon-box') as HTMLElement;
              if (iconBox) {
                iconBox.style.background = module.accent;
                iconBox.style.color = '#000';
                iconBox.style.boxShadow = `0 0 15px ${module.accent}`;
              }
              const launchText = e.currentTarget.querySelector('.launch-text') as HTMLElement;
              if (launchText) {
                launchText.style.color = module.accent;
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              const iconBox = e.currentTarget.querySelector('.icon-box') as HTMLElement;
              if (iconBox) {
                iconBox.style.background = 'rgba(255,255,255,0.05)';
                iconBox.style.color = module.accent;
                iconBox.style.boxShadow = 'none';
              }
              const launchText = e.currentTarget.querySelector('.launch-text') as HTMLElement;
              if (launchText) {
                launchText.style.color = '#fff';
              }
            }}
            onClick={() => navigate(`/module/${module.id}`)}
          >
            {/* Glowing Orb for Glassmorphism */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: `radial-gradient(circle, ${module.accent}15 0%, transparent 70%)`,
              pointerEvents: 'none',
              zIndex: 0
            }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
              <div 
                className="icon-box"
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: 'rgba(255,255,255,0.05)', 
                  color: module.accent,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d={module.icon} />
                </svg>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                Module 0{index + 1}
              </span>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', margin: '0 0 12px 0', letterSpacing: '-0.5px', position: 'relative', zIndex: 1 }}>
              {module.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 32px 0', flex: 1, position: 'relative', zIndex: 1 }}>
              {module.description}
            </p>

            <div 
              className="launch-text"
              style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', transition: 'color 0.3s ease', position: 'relative', zIndex: 1 }}
            >
              Launch Experiment <span style={{ fontSize: '1.2rem', lineHeight: 0 }}>&rarr;</span>
            </div>
          </div>
        ))}

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ModuleSelector;

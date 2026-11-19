import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BrainCircuit, Activity, Network } from 'lucide-react';

export const ToolsLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const isAiActive = location.pathname.includes('/tools/dr-hydro-ai');
  const isTrendsActive = location.pathname.includes('/tools/trends');
  const isRetroActive = location.pathname.includes('/tools/retrosynthesis');

  const navItemStyle = (isActive: boolean, color: string) => ({
    width: isHovered ? '220px' : '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: '11px', // To center the 24px icon in a 48px box ( (48 - 24) / 2 = 12, minus border = 11 )
    gap: '16px',
    borderRadius: '12px',
    background: isActive ? `rgba(${color}, 0.2)` : 'transparent',
    color: isActive ? `rgb(${color})` : 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    border: `1px solid ${isActive ? `rgba(${color}, 0.5)` : 'transparent'}`,
    boxShadow: isActive ? `0 4px 12px rgba(${color}, 0.2)` : 'none',
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const
  });

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: 'var(--bg-main)' }}>
      {/* Sidebar Tool Dock */}
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          width: isHovered ? '260px' : '72px', 
          minWidth: isHovered ? '260px' : '72px', 
          borderRight: '1px solid rgba(255,255,255,0.05)',
          background: 'var(--bg-panel)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isHovered ? 'flex-start' : 'center',
          padding: isHovered ? '24px 20px' : '24px 0',
          gap: '16px',
          zIndex: 50,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        
        {/* Tool: Dr. HydroAI */}
        <div 
          onClick={() => navigate('/faculty-dashboard/tools/dr-hydro-ai')}
          style={navItemStyle(isAiActive, '14, 165, 233')} // light blue
          title="Dr. HydroAI"
          onMouseOver={(e) => {
            if (!isAiActive) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }
          }}
          onMouseOut={(e) => {
            if (!isAiActive) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '24px', width: '24px' }}>
            <BrainCircuit size={24} />
          </div>
          <span style={{ 
            opacity: isHovered ? 1 : 0, 
            transition: 'opacity 0.2s', 
            transitionDelay: isHovered ? '0.1s' : '0s',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            Dr. HydroAI
          </span>
        </div>

        {/* Tool: Dr. HydroAI Trends */}
        <div 
          onClick={() => navigate('/faculty-dashboard/tools/trends')}
          style={navItemStyle(isTrendsActive, '234, 179, 8')} // yellow
          title="Dr. HydroAI Trends"
          onMouseOver={(e) => {
            if (!isTrendsActive) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }
          }}
          onMouseOut={(e) => {
            if (!isTrendsActive) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '24px', width: '24px' }}>
            <Activity size={24} />
          </div>
          <span style={{ 
            opacity: isHovered ? 1 : 0, 
            transition: 'opacity 0.2s',
            transitionDelay: isHovered ? '0.1s' : '0s',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            Dr. HydroAI Trends
          </span>
        </div>

        {/* Tool: Retrosynthesis Planner */}
        <div 
          onClick={() => navigate('/faculty-dashboard/tools/retrosynthesis')}
          style={navItemStyle(isRetroActive, '236, 72, 153')} // pink
          title="Retrosynthesis Planner"
          onMouseOver={(e) => {
            if (!isRetroActive) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }
          }}
          onMouseOut={(e) => {
            if (!isRetroActive) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '24px', width: '24px' }}>
            <Network size={24} />
          </div>
          <span style={{ 
            opacity: isHovered ? 1 : 0, 
            transition: 'opacity 0.2s',
            transitionDelay: isHovered ? '0.1s' : '0s',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            Retrosynthesis Planner
          </span>
        </div>

      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'auto', padding: '24px' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default ToolsLayout;

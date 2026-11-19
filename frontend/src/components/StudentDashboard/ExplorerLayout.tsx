import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Grid, Hexagon } from 'lucide-react';

export const ExplorerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const isMolecule = location.pathname.includes('/molecule-builder');

  const navItemStyle = (isActive: boolean, color: string) => ({
    width: isHovered ? '200px' : '48px',
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
          width: isHovered ? '240px' : '72px', 
          minWidth: isHovered ? '240px' : '72px', 
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
        
        {/* Tool: Periodic Explorer */}
        <div 
          onClick={() => navigate('/student-dashboard/explorer/periodic')}
          style={navItemStyle(!isMolecule, '56, 189, 248')} // accent-cyan
          title="Periodic Explorer"
          onMouseOver={(e) => {
            if (isMolecule) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }
          }}
          onMouseOut={(e) => {
            if (isMolecule) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
            <Grid size={24} />
          </div>
          <span style={{ 
            opacity: isHovered ? 1 : 0, 
            transition: 'opacity 0.2s', 
            transitionDelay: isHovered ? '0.1s' : '0s',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            Periodic Explorer
          </span>
        </div>

        {/* Tool: Molecule Builder */}
        <div 
          onClick={() => navigate('/student-dashboard/explorer/molecule-builder')}
          style={navItemStyle(isMolecule, '236, 72, 153')} // pink-500
          title="Molecule Builder"
          onMouseOver={(e) => {
            if (!isMolecule) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }
          }}
          onMouseOut={(e) => {
            if (!isMolecule) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
            <Hexagon size={24} />
          </div>
          <span style={{ 
            opacity: isHovered ? 1 : 0, 
            transition: 'opacity 0.2s',
            transitionDelay: isHovered ? '0.1s' : '0s',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            Molecule Builder
          </span>
        </div>

      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Outlet />
      </div>
    </div>
  );
};

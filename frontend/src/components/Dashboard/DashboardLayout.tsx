import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EnterLabButton } from '../EnterLabButton';
import { HydroLabLogo } from '../HydroLabLogo';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isTools = location.pathname.includes('/faculty-dashboard/tools');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemStyle = (path: string) => {
    const isActive = location.pathname === path || (path === '/faculty-dashboard' && location.pathname === '/faculty-dashboard/');
    
    return {
      padding: '8px 16px',
      cursor: 'pointer',
      color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
      borderBottom: isActive ? '2px solid #fff' : '2px solid transparent',
      transition: 'all 0.2s ease',
      fontWeight: isActive ? 500 : 400,
      fontSize: '0.9rem',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap'
    };
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', overflow: 'hidden', color: 'var(--text-main)' }}>
      
      {/* Top Navigation Bar */}
      <header style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 5vw',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: 100,
        flexShrink: 0
      }}>
          {/* Left: Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 0 5px var(--accent-purple))' }}>
              <HydroLabLogo color="var(--accent-purple)" size={28} />
            </div>
            <span style={{ 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.5px'
            }}>
              HydroLab <span style={{ color: 'var(--accent-purple)', fontWeight: 900 }}>3D</span> <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.9rem', marginLeft: '6px' }}>| Faculty</span>
            </span>
          </div>

          {/* Center: Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '8px', height: '100%', alignItems: 'flex-end' }}>
            <div style={navItemStyle('/faculty-dashboard')} onClick={() => navigate('/faculty-dashboard')}>Overview</div>
            <div style={navItemStyle('/faculty-dashboard/analytics')} onClick={() => navigate('/faculty-dashboard/analytics')}>Analytics</div>
            <div style={navItemStyle('/faculty-dashboard/roster')} onClick={() => navigate('/faculty-dashboard/roster')}>Student Roster</div>
            <div style={navItemStyle('/faculty-dashboard/access')} onClick={() => navigate('/faculty-dashboard/access')}>Access Control</div>
            <div style={navItemStyle('/faculty-dashboard/tools')} onClick={() => navigate('/faculty-dashboard/tools')}>Tools</div>
          </nav>

          {/* Right: Actions & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <EnterLabButton onClick={() => navigate('/faculty-dashboard/modules')} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</span>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-muted)',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: isTools ? 'hidden' : 'auto', overflowX: 'hidden', display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <div style={{ 
          width: '100%', 
          maxWidth: isTools ? 'none' : '1200px', 
          padding: isTools ? '0' : '40px 20px',
          margin: '0 auto',
          height: isTools ? '100%' : 'auto'
        }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../state/simulationStore';
import { useAuth } from '../context/AuthContext';
import NexconnManager from '../services/nexconnManager';

export const Header: React.FC = () => {
  const {
    instructorMode,
    toggleInstructorMode,
    resetSimulation,
    isExperimentSubmitted,
    evaluationReport,
    theme,
    toggleTheme,
    showAllLabels,
    toggleShowAllLabels,
    activeModule,
    activeMode,
    exitModule,
  } = useSimulationStore();

  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Generate or retrieve a truly clean unique room code without experiment name (e.g. LAB-7K9M2)
  const [roomId] = useState<string>(() => {
    const existing = sessionStorage.getItem('current_active_lab_room');
    if (existing) {
      NexconnManager.getInstance().setActiveRoom(existing);
      return existing;
    }
    
    // Clean 5-character alphanumeric uppercase code
    const uniqueToken = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newRoom = `LAB-${uniqueToken}`;
    sessionStorage.setItem('current_active_lab_room', newRoom);
    NexconnManager.getInstance().setActiveRoom(newRoom);

    // Register room mapping with backend so any peer joining by this clean code knows which experiment to open
    fetch('/api/v1/nexconn/register-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: newRoom, module: activeModule || 'HARDNESS' })
    }).catch(() => {});

    return newRoom;
  });

  const [copied, setCopied] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const currentUserName = user?.name || user?.email?.split('@')[0] || 'Guru (Host)';
  const [collaborators, setCollaborators] = useState<string[]>([currentUserName]);
  const [joinNotification, setJoinNotification] = useState<string | null>(null);

  useEffect(() => {
    // Keep active room in Nexconn updated
    NexconnManager.getInstance().setActiveRoom(roomId);
    
    // Also broadcast room registration in case peer connects via broadcast channel
    fetch('/api/v1/nexconn/register-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: roomId, module: activeModule || 'HARDNESS' })
    }).catch(() => {});
  }, [roomId, activeModule]);

  useEffect(() => {
    // Listen for incoming supervisor announcements & partner joins via Nexconn
    const unsubscribe = NexconnManager.getInstance().subscribeTelemetry((data) => {
      if (data.type === 'ANNOUNCEMENT' && data.message) {
        setAnnouncement(data.message);
        setTimeout(() => setAnnouncement(null), 6000);
      } else if (data.type === 'USER_JOINED' && data.studentName) {
        setCollaborators((prev) => Array.from(new Set([...prev, data.studentName!])));
        setJoinNotification(`🎉 ${data.studentName} has joined your Lab Session!`);
        setTimeout(() => setJoinNotification(null), 5000);
      }
    });

    // Also poll backend for active room info / peer joins
    return unsubscribe;
  }, []);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Navigation blocker removed as it requires a data router in React Router v7

  const moduleBadgeText: Record<string, string> = {
    HARDNESS: 'EDTA Titration Simulation',
    ALKALINITY: 'Alkalinity Titration Simulation',
    COD: 'COD Titration Simulation',
    PH: 'pH Determination Simulation',
  };

  return (
    <>
      <header className="app-header">
        <div className="header-title-container" style={{ display: 'flex', alignItems: 'center' }}>
        {activeMode !== 'ASSESSMENT' && (
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              if (window.confirm("Leave Experiment? All your current progress and beaker contents will be lost.")) {
                exitModule();
                navigate(user?.role === 'FACULTY' ? '/faculty-dashboard' : '/student-dashboard', { replace: true });
              }
            }}
            style={{ marginRight: '16px', padding: '6px 12px', fontSize: '0.9rem' }}
            title="Back to Modules"
          >
            &larr; Back
          </button>
        )}
        <h1>Water Analysis</h1>
        <div className="header-badge" style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'transparent', padding: 0 }}>
          <span style={{ background: 'var(--panel-bg)', padding: '4px 12px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            {activeModule ? moduleBadgeText[activeModule] : 'EDTA Titration Simulation'}
          </span>
          {activeMode && (
            <span style={{ 
              background: activeMode === 'PRACTICE' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(168, 85, 247, 0.1)', 
              color: activeMode === 'PRACTICE' ? 'var(--accent-cyan)' : 'var(--accent-purple)',
              border: `1px solid ${activeMode === 'PRACTICE' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
              padding: '4px 12px', 
              borderRadius: '12px',
              fontSize: '0.9em'
            }}>
              {activeMode === 'PRACTICE' ? '🧪 Practice' : '📝 Assessment'}
            </span>
          )}
        </div>
      </div>

      <div className="header-controls">
        {isExperimentSubmitted && evaluationReport && (
          <div
            className={`header-badge`}
            style={{
              background:
                evaluationReport.status === 'success'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : evaluationReport.status === 'partial_success'
                  ? 'rgba(245, 158, 11, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
              color:
                evaluationReport.status === 'success'
                  ? 'var(--success)'
                  : evaluationReport.status === 'partial_success'
                  ? 'var(--warning)'
                  : 'var(--danger)',
              borderColor:
                evaluationReport.status === 'success'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : evaluationReport.status === 'partial_success'
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)',
              borderStyle: 'solid',
              borderWidth: '1px',
            }}
          >
            Score: {evaluationReport.score} / 100
          </div>
        )}

        {/* Theme Switcher Button */}
        <button
          className="btn btn-secondary"
          onClick={toggleTheme}
          title="Switch Theme"
          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
        >
          {theme === 'dark' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
              </svg>
              Light Mode
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.277 7.277a7.208 7.208 0 0 0 3.46-.878.768.768 0 0 1 .86.081.768.768 0 0 1 .081.859 7.204 7.204 0 0 1-7.86 4.906A7.277 7.277 0 0 1 0 8.723 7.204 7.204 0 0 1 4.906.86a7.21 7.21 0 0 1 1.094-.582z"/>
              </svg>
              Dark Mode
            </span>
          )}
        </button>

        {/* Labels Toggle Button */}
        <button
          className={`btn btn-secondary ${showAllLabels ? 'active' : ''}`}
          onClick={toggleShowAllLabels}
          title="Toggle 3D Labels clutter"
          style={{
            padding: '6px 12px',
            fontSize: '0.8rem',
            borderColor: showAllLabels ? 'var(--accent-cyan)' : 'var(--panel-border)',
            background: showAllLabels ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            color: showAllLabels ? 'var(--accent-cyan)' : 'var(--text-main)',
          }}
        >
          {showAllLabels ? 'Hide 3D Tags' : 'Show 3D Tags'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Instructor Mode</span>
          <button
            className={`btn btn-secondary ${instructorMode ? 'active' : ''}`}
            onClick={toggleInstructorMode}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderColor: instructorMode ? 'var(--accent-purple)' : 'var(--panel-border)',
              background: instructorMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              color: instructorMode ? 'var(--accent-purple)' : 'var(--text-main)',
            }}
          >
            {instructorMode ? 'ON' : 'OFF'}
          </button>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={() => window.dispatchEvent(new Event('reset-lab-layout'))}
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          title="Reset panels to default width"
        >
          Reset Layout
        </button>

        <button className="btn btn-danger" onClick={resetSimulation} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          Reset Experiment
        </button>

        {/* Nexconn Collaborative Room Pill & Active Collaborators List */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(96, 165, 250, 0.3)', padding: '4px 10px', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600 }}>Room: {roomId}</span>
          
          {/* Active Collaborators Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {collaborators.map((name, i) => (
              <span key={i} style={{
                background: i === 0 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(34, 197, 94, 0.25)',
                color: i === 0 ? '#93c5fd' : '#4ade80',
                border: `1px solid ${i === 0 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === 0 ? '#60a5fa' : '#22c55e' }}></span>
                {name}
              </span>
            ))}
          </div>

          <button
            onClick={handleCopyInvite}
            style={{
              background: copied ? '#10b981' : '#2563eb',
              border: 'none',
              color: 'white',
              fontSize: '0.7rem',
              padding: '3px 8px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 500
            }}
            title="Invite Whitelisted Lab Partner"
          >
            {copied ? '✓ Copied' : '🔗 Invite'}
          </button>
        </div>
      </div>
    </header>

    {/* Real-time Toast when Partner joins */}
    {joinNotification && (
      <div style={{
        position: 'fixed',
        top: '70px',
        right: '24px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 600,
        fontSize: '13px',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <span>{joinNotification}</span>
      </div>
    )}

    {/* Faculty Real-time Announcement Toast */}
    {announcement && (
      <div style={{
        position: 'fixed',
        top: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.95), rgba(79, 70, 229, 0.95))',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '30px',
        boxShadow: '0 10px 25px -5px rgba(147, 51, 234, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: 600,
        fontSize: '14px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        animation: 'pulse 1.5s infinite'
      }}>
        <span style={{ fontSize: '18px' }}>📢</span>
        <span>Instructor Note: {announcement}</span>
      </div>
    )}

    </>
  );
};
export default Header;

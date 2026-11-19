import React from 'react';

export const StudentAchievements: React.FC = () => {
  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.5px', color: '#fff', margin: '0 0 8px 0' }}>Badges & Achievements</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Unlock exclusive badges for perfect titrations, high scores, and more.</p>
      </div>
      
      <div style={{ 
        background: 'var(--panel-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--panel-border)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}>
        <h2 style={{ color: 'var(--accent-cyan)', marginBottom: '16px', fontSize: '1.5rem', fontWeight: 500 }}>Coming Soon</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.6 }}>The achievement system is currently under development. Soon you'll be able to display your mastery!</p>
      </div>
    </div>
  );
};

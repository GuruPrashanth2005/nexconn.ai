import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface AILeaderboardEntry {
  rank: number;
  name: string;
  avgScore: number;
  totalSessions: number;
  isCurrentUser: boolean;
  aiCommentary: string;
}

export const StudentLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<AILeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAILeaderboard = async () => {
      try {
        const response = await axios.post('/api/v1/ai/leaderboard', {
          currentUser: {
            name: user?.name || 'Cadet',
            avgScore: 78 // Mocked average score since it is not in the JWT by default
          },
          engine: 'groq'
        });
        
        setLeaderboard(response.data.data);
      } catch (error) {
        console.error('Failed to generate AI leaderboard', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAILeaderboard();
  }, [user]);

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.5px', color: '#fff', margin: '0 0 8px 0' }}>Leaderboard</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Compete with your classmates. Evaluated in real-time by Dr. HydroAI.</p>
      </div>
      
      <div style={{ 
        background: 'var(--panel-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--panel-border)',
        borderRadius: '16px',
        padding: '32px',
        minHeight: '300px'
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px' }}>
            <div className="cube-loader">
              <div className="cube-face cube-face-front"></div>
              <div className="cube-face cube-face-back"></div>
              <div className="cube-face cube-face-right"></div>
              <div className="cube-face cube-face-left"></div>
              <div className="cube-face cube-face-top"></div>
              <div className="cube-face cube-face-bottom"></div>
            </div>
            <h3 style={{ color: 'var(--text-main)', margin: '0 0 8px 0', fontWeight: 500 }}>Analyzing Global Telemetry...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px', textAlign: 'center' }}>Dr. Hydro is simulating peer performance and evaluating your standing.</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Could not retrieve leaderboard data.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {leaderboard.map((entry, idx) => (
              <div key={idx} style={{ 
                display: 'grid', 
                gridTemplateColumns: '60px 1fr 1fr', 
                gap: '16px',
                padding: '20px', 
                background: entry.isCurrentUser ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.02)',
                border: entry.isCurrentUser ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                alignItems: 'center',
                boxShadow: entry.isCurrentUser ? '0 0 20px rgba(56, 189, 248, 0.05)' : 'none'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: entry.rank <= 3 ? 'var(--warning)' : 'var(--text-muted)', textAlign: 'center' }}>
                  #{entry.rank}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontWeight: 600, color: entry.isCurrentUser ? 'var(--accent-cyan)' : 'var(--text-main)', fontSize: '1.1rem' }}>
                    {entry.name} {entry.isCurrentUser && '(You)'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {entry.totalSessions} Sessions Completed
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {entry.avgScore}%
                  </div>
                  {entry.aiCommentary && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-muted)', 
                      fontStyle: 'italic',
                      textAlign: 'right',
                      maxWidth: '250px'
                    }}>
                      "{entry.aiCommentary}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export const StudentOverview: React.FC = () => {
  const [data, setData] = useState<{
    totalSessions: number;
    avgScore: number;
    totalTimeSpent: number;
    recentSessions: any[];
  } | null>(null);
  const [aiInsights, setAiInsights] = useState<{ type: string, title: string, description: string }[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const SESSIONS_PER_PAGE = 5;

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        const dashRes = await axios.get('/api/v1/student/dashboard');
        if (isMounted) {
          setData(dashRes.data.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        if (isMounted) {
          setData({ totalSessions: 0, avgScore: 0, totalTimeSpent: 0, recentSessions: [] });
          setIsLoading(false);
        }
      }
    };

    const fetchInsights = async () => {
      try {
        const insightRes = await axios.get('/api/v1/student/dashboard/insights');
        if (isMounted) {
          setAiInsights(insightRes.data.data.aiInsights || []);
        }
      } catch (error) {
        console.error('Failed to fetch insights', error);
        if (isMounted) {
          setAiInsights([]);
        }
      }
    };

    fetchDashboard();
    fetchInsights();
    
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) return <div style={{ color: 'var(--text-muted)', paddingTop: '40px' }}>Loading workspace...</div>;
  if (!data) return <div style={{ color: 'var(--danger)', paddingTop: '40px' }}>System offline.</div>;

  const bentoBoxStyle = {
    background: 'var(--panel-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--panel-border)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
  };

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.5px', color: '#fff', margin: '0 0 8px 0' }}>Overview</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Review your academic performance and recent laboratory sessions.</p>
      </div>

      {/* Bento Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', gridAutoRows: 'minmax(200px, auto)' }}>
        
        {/* Large Metric: Avg Score (Span 8) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 8', justifyContent: 'center', background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%)', border: '1px solid rgba(16, 185, 129, 0.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald, #10b981)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '12px', position: 'relative', zIndex: 1 }}>Average Academic Score</div>
          <div style={{ fontSize: '3rem', fontWeight: 700, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1, position: 'relative', zIndex: 1 }}>{data.avgScore}%</div>
          <div style={{ marginTop: '24px', height: '40px', display: 'flex', alignItems: 'flex-end', gap: '8px', position: 'relative', zIndex: 1 }}>
            {/* Minimalist mock bar chart */}
            {[40, 60, 50, 70, 85, 90, data.avgScore].map((val, i) => (
              <div key={i} style={{ width: '100%', flex: 1, background: i === 6 ? 'var(--accent-emerald, #10b981)' : 'rgba(16, 185, 129, 0.15)', height: `${val}%`, borderRadius: '4px 4px 0 0' }}></div>
            ))}
          </div>
        </div>

        {/* Small Metric: Sessions (Span 4) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 4', background: 'linear-gradient(145deg, rgba(244, 63, 94, 0.05) 0%, rgba(244, 63, 94, 0.01) 100%)', border: '1px solid rgba(244, 63, 94, 0.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(244, 63, 94, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-rose, #f43f5e)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 'auto', position: 'relative', zIndex: 1 }}>Total Experiments</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-1px', lineHeight: 1, position: 'relative', zIndex: 1 }}>{data.totalSessions}</div>
        </div>

        {/* Small Metric: Lab Time (Span 4) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 4', background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.01) 100%)', border: '1px solid rgba(139, 92, 246, 0.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple, #8b5cf6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 'auto', position: 'relative', zIndex: 1 }}>Total Lab Time</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-1px', lineHeight: 1, position: 'relative', zIndex: 1 }}>{Math.round(data.totalTimeSpent / 60)}<span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginLeft: '4px' }}>min</span></div>
        </div>

        {/* Equipment Mastery (Span 8) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 8', background: 'linear-gradient(145deg, rgba(14, 165, 233, 0.05) 0%, rgba(14, 165, 233, 0.01) 100%)', border: '1px solid rgba(14, 165, 233, 0.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan, #0ea5e9)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Equipment Competency</div>
            <span style={{ fontSize: '0.75rem', color: '#fff', background: 'rgba(14, 165, 233, 0.2)', padding: '4px 10px', borderRadius: '12px' }}>3 / 5 Certified</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', flex: 1, position: 'relative', zIndex: 1 }}>
            {[
              { name: 'Pipette', mastered: true },
              { name: 'Burette', mastered: true },
              { name: 'Conical Flask', mastered: true },
              { name: 'Bunsen Burner', mastered: false },
              { name: 'pH Meter', mastered: false }
            ].map((item, idx) => (
              <div key={idx} style={{ 
                border: item.mastered ? '1px solid rgba(255,255,255,0.3)' : '1px dashed rgba(255,255,255,0.1)',
                background: item.mastered ? 'rgba(255,255,255,0.05)' : 'transparent',
                borderRadius: '8px', 
                padding: '16px 8px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.mastered ? '#fff' : 'transparent', border: item.mastered ? 'none' : '1px solid rgba(255,255,255,0.2)', marginBottom: '12px' }}></div>
                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: item.mastered ? '#fff' : 'var(--text-muted)', textAlign: 'center' }}>
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Performance Analysis (Span 6) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 6', background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>System Analysis</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, position: 'relative', zIndex: 1 }}>
            {aiInsights === null ? (
               <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontStyle: 'italic' }}>
                 Generating AI performance analysis...
               </div>
            ) : aiInsights.length === 0 ? (
               <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                 Insufficient data for analysis.
               </div>
            ) : (
              aiInsights.map((insight, idx) => (
                <div key={idx} style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: insight.type === 'WARNING' ? 'var(--warning)' : insight.type === 'CRITICAL' ? 'var(--danger)' : '#fff' }}></div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>{insight.title}</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', paddingLeft: '18px' }}>{insight.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sessions Table (Span 6) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 6', background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Recent Sessions</div>
            
            {/* Pagination Controls */}
            {data.recentSessions.length > SESSIONS_PER_PAGE && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: currentPage === 0 ? 'rgba(255,255,255,0.2)' : '#fff', borderRadius: '4px', padding: '4px 8px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
                >&larr;</button>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {currentPage + 1} / {Math.ceil(data.recentSessions.length / SESSIONS_PER_PAGE)}
                </span>
                <button 
                  onClick={() => setCurrentPage(Math.min(Math.ceil(data.recentSessions.length / SESSIONS_PER_PAGE) - 1, currentPage + 1))}
                  disabled={currentPage >= Math.ceil(data.recentSessions.length / SESSIONS_PER_PAGE) - 1}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: currentPage >= Math.ceil(data.recentSessions.length / SESSIONS_PER_PAGE) - 1 ? 'rgba(255,255,255,0.2)' : '#fff', borderRadius: '4px', padding: '4px 8px', cursor: currentPage >= Math.ceil(data.recentSessions.length / SESSIONS_PER_PAGE) - 1 ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
                >&rarr;</button>
              </div>
            )}
          </div>
          
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '0 0 12px 0', fontWeight: 500 }}>Module</th>
                  <th style={{ padding: '0 0 12px 0', fontWeight: 500 }}>Date</th>
                  <th style={{ padding: '0 0 12px 0', fontWeight: 500, textAlign: 'right' }}>Score</th>
                </tr>
              </thead>
              <tbody style={{ color: '#fff' }}>
                {data.recentSessions.slice(currentPage * SESSIONS_PER_PAGE, (currentPage + 1) * SESSIONS_PER_PAGE).map((session: any, idx: number) => (
                  <tr key={session.id} style={{ borderBottom: idx === 4 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px 0', fontWeight: 500 }}>{session.module}</td>
                    <td style={{ padding: '16px 0', color: 'var(--text-muted)' }}>{new Date(session.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 0', textAlign: 'right' }}>{session.score}%</td>
                  </tr>
                ))}
                {data.recentSessions.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No session history recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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

export default StudentOverview;

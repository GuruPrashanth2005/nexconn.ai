import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

interface StudentAnalytics {
  studentId: string;
  name: string;
  email: string;
  totalSessions: number;
  passedSessions: number;
  avgScore: number;
  avgQuizScore: number;
  totalTimeSpent: number;
}

export const StudentRoster: React.FC = () => {
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const STUDENTS_PER_PAGE = 8;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/v1/faculty/analytics');
        setAnalytics(res.data.data.analytics);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) return <div style={{ color: 'var(--text-muted)', paddingTop: '40px' }}>Loading roster...</div>;

  const totalPages = Math.ceil(analytics.length / STUDENTS_PER_PAGE);
  const currentStudents = analytics.slice(currentPage * STUDENTS_PER_PAGE, (currentPage + 1) * STUDENTS_PER_PAGE);

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.5px', color: '#fff', margin: '0 0 8px 0' }}>Student Roster</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Manage and analyze individual student performances.</p>
        </div>
        
        {/* Pagination Controls */}
        {analytics.length > STUDENTS_PER_PAGE && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              type="button"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', color: currentPage === 0 ? 'rgba(255,255,255,0.2)' : '#fff', borderRadius: '6px', padding: '6px 12px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >&larr; Prev</button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 8px' }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button 
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', color: currentPage >= totalPages - 1 ? 'rgba(255,255,255,0.2)' : '#fff', borderRadius: '6px', padding: '6px 12px', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >Next &rarr;</button>
          </div>
        )}
      </div>
      
      {analytics.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No students whitelisted yet.
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '24px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '0 0 16px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Student</th>
                  <th style={{ padding: '0 0 16px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', textAlign: 'center' }}>Total Sessions</th>
                  <th style={{ padding: '0 0 16px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Pass Rate</th>
                  <th style={{ padding: '0 0 16px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', textAlign: 'center' }}>Avg Sim Score</th>
                  <th style={{ padding: '0 0 16px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', textAlign: 'center' }}>Avg Quiz Score</th>
                  <th style={{ padding: '0 0 16px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
            <tbody>
              {currentStudents.map((stat, idx) => {
                const passRate = stat.totalSessions > 0 ? Math.round((stat.passedSessions / stat.totalSessions) * 100) : 0;
                return (
                  <motion.tr 
                    key={stat.studentId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ borderBottom: idx === currentStudents.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td style={{ padding: '20px 0' }}>
                      <div style={{ fontWeight: 500, color: '#fff', fontSize: '1rem' }}>{stat.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>{stat.email}</div>
                    </td>
                    <td style={{ padding: '20px 0', textAlign: 'center', fontSize: '1rem', fontWeight: 500, color: '#fff' }}>{stat.totalSessions}</td>
                    <td style={{ padding: '20px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${passRate}%` }} 
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ height: '100%', background: '#fff' }} 
                          />
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>{passRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 0', textAlign: 'center', fontSize: '1rem', fontWeight: 600, color: '#34d399' }}>
                      {stat.avgScore}%
                    </td>
                    <td style={{ padding: '20px 0', textAlign: 'center', fontSize: '1rem', fontWeight: 600, color: '#0ea5e9' }}>
                      {stat.avgQuizScore ? `${stat.avgQuizScore}%` : 'N/A'}
                    </td>
                    <td style={{ padding: '20px 0', textAlign: 'right' }}>
                      <button 
                        type="button"
                        onClick={() => navigate(`/faculty-dashboard/roster/${stat.studentId}`)}
                        style={{ 
                          padding: '8px 20px', 
                          background: 'rgba(14, 165, 233, 0.05)', 
                          color: 'var(--accent-cyan)', 
                          border: '1px solid rgba(14, 165, 233, 0.3)', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          fontSize: '0.85rem', 
                          fontFamily: 'inherit',
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 10px rgba(14, 165, 233, 0.0)'
                        }}
                        onMouseOver={(e) => { 
                          e.currentTarget.style.background = 'rgba(14, 165, 233, 0.15)'; 
                          e.currentTarget.style.borderColor = 'var(--accent-cyan)'; 
                          e.currentTarget.style.boxShadow = '0 0 12px rgba(14, 165, 233, 0.4)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => { 
                          e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)'; 
                          e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.3)'; 
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(14, 165, 233, 0.0)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        Analyze
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default StudentRoster;

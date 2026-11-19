/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState({ totalStudents: 0, avgScore: 0, totalHours: 0 });
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [activityTimestamps, setActivityTimestamps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<{classPulse: string, earlyWarnings: any[]} | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/v1/faculty/analytics');
        const analytics = res.data.data.analytics;
        const timestamps = res.data.data.classActivityTimestamps || [];
        
        setAnalyticsData(analytics);
        setActivityTimestamps(timestamps);
        
        let totalScore = 0;
        let totalTime = 0;
        
        analytics.forEach((s: any) => {
          totalScore += s.avgScore;
          totalTime += s.totalTimeSpent;
        });

        const avgScore = analytics.length > 0 ? totalScore / analytics.length : 0;
        
        setStats({
          totalStudents: analytics.length,
          avgScore: Math.round(avgScore),
          totalHours: Math.round((totalTime / 3600) * 10) / 10
        });

        // Trigger AI Insights generation asynchronously
        axios.post('/api/v1/ai/faculty-insights', { analytics })
          .then(aiRes => {
            setAiInsights(aiRes.data.data);
          })
          .catch(err => console.error('AI Insights fetch failed', err))
          .finally(() => setIsAiLoading(false));

      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const [currentPage, setCurrentPage] = useState(0);
  const STUDENTS_PER_PAGE = 5;

  if (isLoading) return <div style={{ color: 'var(--text-muted)', paddingTop: '40px' }}>Loading analytics...</div>;

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
  
  // Process Curve Data (Activity per day over last 7 days)
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { 
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr: d.toDateString(),
      sessions: 0 
    };
  });

  activityTimestamps.forEach(ts => {
    const dateStr = new Date(ts).toDateString();
    const dayMatch = last7Days.find(d => d.dateStr === dateStr);
    if (dayMatch) {
      dayMatch.sessions++;
    }
  });

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Total Sessions', 'Practice', 'Assessment', 'Failed', 'Avg Score (%)', 'Avg Accuracy (%)', 'Top Mistake', 'Time Spent (mins)'];
    const rows = analyticsData.map(s => {
      const failed = s.totalSessions - (s.passedSessions || 0);
      const topMistake = s.topMistakes && s.topMistakes.length > 0 ? s.topMistakes[0].mistake : 'None';
      
      return [
        s.name,
        s.email,
        s.totalSessions,
        s.practiceSessions || 0,
        s.assessmentSessions || 0,
        failed,
        s.avgScore,
        s.avgAccuracy || 0,
        `"${topMistake}"`,
        Math.round(s.totalTimeSpent / 60)
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'class_analytics_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.5px', color: '#fff', margin: '0 0 8px 0' }}>Class Overview</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>High-level insights across all students and lab modules.</p>
      </div>
      
      {/* Bento Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', gridAutoRows: 'minmax(180px, auto)' }}>
        
        {/* AI Insight: Class Pulse (Span 8) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 8', background: 'linear-gradient(145deg, rgba(14, 165, 233, 0.05) 0%, rgba(14, 165, 233, 0.01) 100%)', border: '1px solid rgba(14, 165, 233, 0.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)' }}></div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>AI Class Pulse</div>
          </div>
          {isAiLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '90%', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '75%', animation: 'pulse 1.5s infinite' }}></div>
            </div>
          ) : (
            <p style={{ fontSize: '1.1rem', color: '#fff', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
              {aiInsights?.classPulse}
            </p>
          )}
        </div>

        {/* AI Insight: Early Warnings (Span 4) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 4', border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.03) 0%, transparent 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Early Warnings</div>
          </div>
          {isAiLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(!aiInsights?.earlyWarnings || aiInsights.earlyWarnings.length === 0) ? (
                <div style={{ color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✓</span> No at-risk students detected.
                </div>
              ) : (
                aiInsights.earlyWarnings.map((warning, idx) => (
                  <div key={idx} style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', padding: '10px 12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{warning.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>{warning.reason}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        {/* Large Metric: Avg Score (Span 6) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 6', justifyContent: 'center', background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%)', border: '1px solid rgba(16, 185, 129, 0.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)' }}></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)' }}></div>
            Cohort Average Score
          </div>
          <div style={{ fontSize: '3.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1, position: 'relative', zIndex: 1 }}>{stats.avgScore}%</div>
          <div style={{ marginTop: '24px', height: '40px', display: 'flex', alignItems: 'flex-end', gap: '8px', position: 'relative', zIndex: 1 }}>
            {/* Minimalist mock bar chart representing trend */}
            {[40, 60, 50, 70, 85, 90, stats.avgScore].map((val, i) => (
              <div key={i} style={{ width: '100%', flex: 1, background: i === 6 ? 'var(--accent-emerald)' : 'rgba(16, 185, 129, 0.15)', height: `${val}%`, borderRadius: '4px 4px 0 0' }}></div>
            ))}
          </div>
        </div>

        {/* Small Metric: Students (Span 3) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 3', background: 'linear-gradient(145deg, rgba(244, 63, 94, 0.05) 0%, rgba(244, 63, 94, 0.01) 100%)', border: '1px solid rgba(244, 63, 94, 0.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(244, 63, 94, 0.1) 0%, transparent 70%)' }}></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-rose, #f43f5e)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 'auto', position: 'relative', zIndex: 1 }}>Total Students</div>
          <div style={{ fontSize: '3rem', fontWeight: 700, color: '#fff', letterSpacing: '-1px', lineHeight: 1, position: 'relative', zIndex: 1 }}>{stats.totalStudents}</div>
        </div>

        {/* Small Metric: Lab Hours (Span 3) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 3', background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.01) 100%)', border: '1px solid rgba(139, 92, 246, 0.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' }}></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 'auto', position: 'relative', zIndex: 1 }}>Total Lab Hours</div>
          <div style={{ fontSize: '3rem', fontWeight: 700, color: '#fff', letterSpacing: '-1px', lineHeight: 1, position: 'relative', zIndex: 1 }}>{stats.totalHours}<span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginLeft: '4px' }}>h</span></div>
        </div>
        
        {/* Interactive Curve Chart Panel (Span 12) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 12', background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Activity Trend (Last 7 Days)</div>
            <span style={{ fontSize: '0.75rem', color: '#000', background: '#fff', padding: '4px 10px', borderRadius: '4px', fontWeight: 600 }}>Live View</span>
          </div>
          
          <div style={{ height: '250px', width: '100%', position: 'relative', zIndex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ background: 'var(--panel-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontWeight: 600 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#fff" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#000', stroke: '#fff', strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: '#fff', stroke: '#000', strokeWidth: 2 }} 
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Comprehensive Analytics Table Panel (Span 12) */}
        <div style={{ ...bentoBoxStyle, gridColumn: 'span 12' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Class Analytics Report</div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {/* Pagination Controls */}
              {analyticsData.length > STUDENTS_PER_PAGE && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '16px' }}>
                  <button 
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: currentPage === 0 ? 'rgba(255,255,255,0.2)' : '#fff', borderRadius: '4px', padding: '4px 8px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
                  >&larr;</button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {currentPage + 1} / {Math.ceil(analyticsData.length / STUDENTS_PER_PAGE)}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(Math.min(Math.ceil(analyticsData.length / STUDENTS_PER_PAGE) - 1, currentPage + 1))}
                    disabled={currentPage >= Math.ceil(analyticsData.length / STUDENTS_PER_PAGE) - 1}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: currentPage >= Math.ceil(analyticsData.length / STUDENTS_PER_PAGE) - 1 ? 'rgba(255,255,255,0.2)' : '#fff', borderRadius: '4px', padding: '4px 8px', cursor: currentPage >= Math.ceil(analyticsData.length / STUDENTS_PER_PAGE) - 1 ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
                  >&rarr;</button>
                </div>
              )}
              
              <button 
                onClick={exportToCSV}
                style={{ padding: '6px 16px', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}
              >
                Export CSV
              </button>
            </div>
          </div>

          <div style={{ width: '100%', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '0 0 12px 0', fontWeight: 500 }}>Student</th>
                  <th style={{ padding: '0 0 12px 0', fontWeight: 500, textAlign: 'center' }}>Total</th>
                  <th style={{ padding: '0 0 12px 0', fontWeight: 500, textAlign: 'center' }}>Practice</th>
                  <th style={{ padding: '0 0 12px 0', fontWeight: 500, textAlign: 'center' }}>Assessment</th>
                  <th style={{ padding: '0 0 12px 0', fontWeight: 500, textAlign: 'center', color: 'var(--danger)' }}>Failed</th>
                  <th style={{ padding: '0 0 12px 0', fontWeight: 500, textAlign: 'center' }}>Avg Score</th>
                  <th style={{ padding: '0 0 12px 0', fontWeight: 500, textAlign: 'center' }}>Accuracy</th>
                  <th style={{ padding: '0 0 12px 0', fontWeight: 500 }}>Top Mistake</th>
                </tr>
              </thead>
              <tbody style={{ color: '#fff' }}>
                {analyticsData.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No data available.</td>
                  </tr>
                ) : (
                  analyticsData.slice(currentPage * STUDENTS_PER_PAGE, (currentPage + 1) * STUDENTS_PER_PAGE).map((stat, idx) => {
                    const failed = stat.totalSessions - (stat.passedSessions || 0);
                    const topMistake = stat.topMistakes && stat.topMistakes.length > 0 ? stat.topMistakes[0].mistake : '-';

                    return (
                      <motion.tr 
                        key={stat.studentId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{ borderBottom: idx === STUDENTS_PER_PAGE - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <td style={{ padding: '16px 0' }}>
                          <div style={{ fontWeight: 500, color: '#fff' }}>{stat.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{stat.email}</div>
                        </td>
                        <td style={{ padding: '16px 0', textAlign: 'center', fontWeight: 500 }}>{stat.totalSessions}</td>
                        <td style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)' }}>{stat.practiceSessions || 0}</td>
                        <td style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)' }}>{stat.assessmentSessions || 0}</td>
                        <td style={{ padding: '16px 0', textAlign: 'center', color: failed > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: failed > 0 ? 500 : 400 }}>{failed}</td>
                        <td style={{ padding: '16px 0', textAlign: 'center', fontWeight: 600 }}>
                          {stat.avgScore}%
                        </td>
                        <td style={{ padding: '16px 0', textAlign: 'center', fontWeight: 500 }}>
                          {stat.avgAccuracy || 0}%
                        </td>
                        <td style={{ padding: '16px 0', color: failed > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                          {topMistake}
                        </td>
                      </motion.tr>
                    );
                  })
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

export default DashboardOverview;

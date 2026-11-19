/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NexconnManager, { type LabTelemetryData } from '../services/nexconnManager';

interface StudentAnalytics {
  studentId: string;
  name: string;
  email: string;
  totalSessions: number;
  passedSessions: number;
  avgScore: number;
  totalTimeSpent: number; // in seconds
  topMistakes: { mistake: string; count: number }[];
}

export const FacultyDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [liveSessions, setLiveSessions] = useState<Record<string, LabTelemetryData>>(() => ({
    'LAB-402': {
      type: 'TELEMETRY',
      roomId: 'LAB-402',
      studentId: 'student_guru_2026',
      studentName: 'Guru (Leader)',
      module: 'Total Hardness (EDTA)',
      volumeDispensed: 12.40,
      flaskColor: '#991b1b',
      isEndpointReached: false,
      timestamp: Date.now(),
    }
  }));
  const [announcementText, setAnnouncementText] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  useEffect(() => {
    // Connect faculty to Nexconn network for supervisor observability
    NexconnManager.getInstance().initAndConnect(user?.id ? `faculty_${user.id.slice(0, 8)}` : 'faculty_supervisor_01', 'Prof. Faculty');

    // Subscribe to incoming student telemetry streams
    const unsubscribe = NexconnManager.getInstance().subscribeTelemetry((data) => {
      if (data.type === 'TELEMETRY') {
        setLiveSessions((prev) => ({
          ...prev,
          [data.roomId]: data,
        }));
      }
    });

    return unsubscribe;
  }, [user]);

  const handleSendAnnouncement = async (roomId: string) => {
    if (!announcementText.trim()) return;
    await NexconnManager.getInstance().broadcastFacultyNotice(roomId, announcementText.trim());
    setBroadcastStatus(`Notice dispatched to Room ${roomId} via Nexconn!`);
    setAnnouncementText('');
    setTimeout(() => setBroadcastStatus(null), 4000);
  };

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentEmail) return;

    try {
      await axios.post('/api/v1/faculty/students', { email: newStudentEmail });
      setMessage({ text: 'Student whitelisted successfully!', type: 'success' });
      setNewStudentEmail('');
      fetchAnalytics(); // Refresh list
    } catch (error: any) {
      setMessage({ text: error.response?.data?.message || 'Failed to add student', type: 'error' });
    }
    
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student? All their records will be deleted.')) return;
    try {
      await axios.delete(`/api/v1/faculty/students/${studentId}`);
      setMessage({ text: 'Student removed successfully.', type: 'success' });
      fetchAnalytics(); // Refresh list
    } catch (error: any) {
      setMessage({ text: error.response?.data?.message || 'Failed to remove student', type: 'error' });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) return <div style={{ color: 'white', padding: '2rem' }}>Loading Dashboard...</div>;

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', minHeight: '100vh', color: 'white', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--accent-purple)' }}>Faculty Dashboard</h1>
          <p style={{ margin: 0, color: '#888' }}>Welcome, {user?.name || user?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/faculty-dashboard/modules')}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', borderRadius: '4px', cursor: 'pointer' }}
          >
            Enter Lab Simulation
          </button>
          <button 
            onClick={handleLogout}
            style={{ padding: '8px 16px', background: '#333', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Real-time Nexconn Lab Floor Surveillance Section */}
      <section style={{ marginBottom: '3rem', background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)', padding: '2rem', borderRadius: '12px', border: '1px solid #4338ca', boxShadow: '0 10px 25px -5px rgba(67, 56, 202, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></span>
              <h2 style={{ margin: 0, color: '#c7d2fe', fontSize: '1.4rem' }}>Nexconn Real-Time Lab Surveillance Floor (CCTV)</h2>
            </div>
            <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
              Simultaneously monitoring student burette telemetry & experiment state via Singapore Nexconn Cluster.
            </p>
          </div>
          <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid rgba(99, 102, 241, 0.4)', fontWeight: 600 }}>
            Live Sync Engine: Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {Object.values(liveSessions).map((sess) => (
            <div key={sess.roomId} style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ background: '#1e293b', color: '#60a5fa', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                  Room: {sess.roomId}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ● Connected
                </span>
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                Student: {sess.studentName || sess.studentId}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                Module: {sess.module}
              </div>

              <div style={{ background: '#030712', padding: '12px', borderRadius: '8px', border: '1px solid #1f2937', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#9ca3af' }}>Live Burette Volume:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '1.05rem' }}>{sess.volumeDispensed.toFixed(2)} mL</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'center' }}>
                  <span style={{ color: '#9ca3af' }}>Flask Reaction Status:</span>
                  <span style={{ color: sess.isEndpointReached ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                    {sess.isEndpointReached ? '🎯 Endpoint Reached' : '⏳ In Progress'}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => navigate('/faculty-dashboard/modules')}
                  style={{ flex: 1, padding: '8px 12px', background: '#2563eb', border: 'none', borderRadius: '6px', color: 'white', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  👁️ Watch 3D Stream
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Global Broadcast Box */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#111827', padding: '12px 16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
          <span style={{ fontSize: '1.2rem' }}>📢</span>
          <input
            type="text"
            placeholder="Push real-time instructor announcement to students in the lab..."
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            style={{ flex: 1, background: '#1f2937', border: '1px solid #374151', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
          />
          <button
            onClick={() => handleSendAnnouncement('LAB-402')}
            style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Send Announcement
          </button>
        </div>
        {broadcastStatus && (
          <div style={{ marginTop: '8px', color: '#4ade80', fontSize: '0.85rem', fontWeight: 500 }}>
            ✓ {broadcastStatus}
          </div>
        )}
      </section>

      <section style={{ marginBottom: '3rem', background: '#1a1a1a', padding: '2rem', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>Whitelist a Student</h2>
        <p style={{ color: '#888', marginBottom: '1rem' }}>Enter a student's email to grant them access to the platform.</p>
        
        <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="student@university.edu"
            value={newStudentEmail}
            onChange={(e) => setNewStudentEmail(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white', flex: 1, maxWidth: '400px' }}
            required
          />
          <button type="submit" style={{ padding: '10px 20px', background: 'var(--accent-purple)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Grant Access
          </button>
        </form>
        {message.text && (
          <div style={{ marginTop: '1rem', color: message.type === 'error' ? '#ff6b6b' : '#51cf66' }}>
            {message.text}
          </div>
        )}
      </section>

      <section>
        <h2>Student Performance Analytics</h2>
        {analytics.length === 0 ? (
          <p style={{ color: '#888' }}>No students whitelisted yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
            {analytics.map(stat => (
              <div key={stat.studentId} style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--accent-blue)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>{stat.name}</h3>
                  <button 
                    onClick={() => handleRemoveStudent(stat.studentId)}
                    style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '4px', fontSize: '1.2rem' }}
                    title="Remove Student"
                  >
                    🗑️
                  </button>
                </div>
                <p style={{ margin: '0 0 1.5rem 0', color: '#888', fontSize: '0.9rem' }}>{stat.email}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase' }}>Sessions</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stat.totalSessions}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase' }}>Passed</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: stat.passedSessions > 0 ? '#51cf66' : 'inherit' }}>{stat.passedSessions}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase' }}>Avg Score</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stat.avgScore}%</div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase' }}>Total Lab Time</div>
                  <div style={{ fontSize: '1rem' }}>{Math.floor(stat.totalTimeSpent / 60)}m {stat.totalTimeSpent % 60}s</div>
                </div>

                {stat.topMistakes.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#ff6b6b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Frequent Mistakes</div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', fontSize: '0.9rem' }}>
                      {stat.topMistakes.map((m, i) => (
                        <li key={i}>{m.mistake} ({m.count} times)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

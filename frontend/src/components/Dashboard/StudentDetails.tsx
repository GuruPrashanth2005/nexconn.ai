/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

export const StudentDetails: React.FC = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
    setCurrentQuizIndex(0);
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    
    const fetchDetails = async () => {
      try {
        // Fetch basic student profile and sessions
        const res = await axios.get(`/api/v1/faculty/students/${studentId}/sessions`);
        setStudent(res.data.data.student);
        setSessions(res.data.data.sessions || []);
        if (res.data.data.sessions && res.data.data.sessions.length > 0) {
          setSelectedSessionId(res.data.data.sessions[res.data.data.sessions.length - 1].id);
        }

        // Fetch advanced analytics
        const token = sessionStorage.getItem('token');
        const tRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/analytics/faculty/student/${studentId}/advanced`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tData = await tRes.json();
        if (tData.success) {
          // TODO: Use advancedData when UI is ready
          // setAdvancedData(tData.data);
        }
      } catch (error) {
        console.error('Failed to fetch student details', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [studentId]);

  if (isLoading) return <div style={{ color: 'var(--text-muted)', padding: '40px' }}>Loading advanced analytics...</div>;

  const bentoBoxStyle = {
    background: 'var(--panel-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--panel-border)',
    borderRadius: '16px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  let practiceChartData = sessions.map((s, index) => {
    const mCount = Array.isArray(s.mistakes) ? s.mistakes.length : (typeof s.mistakes === 'string' ? JSON.parse(s.mistakes).length : 0);
    const eff = Math.min(100, Math.max(0, Math.round((300 / (s.timeSpentSeconds || 1)) * 100)));
    return {
      name: `S${index + 1}`,
      module: s.module,
      score: s.score || 0,
      quizScore: s.quizScore !== null && s.quizScore !== undefined ? s.quizScore : null,
      accuracy: Math.max(0, 100 - (mCount * 15)),
      efficiency: eff,
      date: new Date(s.createdAt).toLocaleDateString()
    };
  });

  if (selectedSession && selectedSession.module) {
    practiceChartData = practiceChartData.filter(d => d.module === selectedSession.module);
  }

  const validChartDataLength = practiceChartData.length;
  const avgScore = validChartDataLength ? Math.round(practiceChartData.reduce((acc, curr) => acc + curr.score, 0) / validChartDataLength) : 0;
  const avgEff = validChartDataLength ? Math.round(practiceChartData.reduce((acc, curr) => acc + curr.efficiency, 0) / validChartDataLength) : 0;
  const validQuizSessions = practiceChartData.filter(d => d.quizScore !== null);
  const avgQuiz = validQuizSessions.length ? Math.round(validQuizSessions.reduce((acc, curr) => acc + (curr.quizScore || 0), 0) / validQuizSessions.length) : 0;

  const displayScore = selectedSession ? (selectedSession.score || 0) : avgScore;
  const displayEff = selectedSession ? Math.min(100, Math.max(0, Math.round((300 / (selectedSession.timeSpentSeconds || 1)) * 100))) : avgEff;
  const displayQuiz = selectedSession && selectedSession.quizScore !== null && selectedSession.quizScore !== undefined ? selectedSession.quizScore : avgQuiz;

  const selectedSessionIndex = sessions.findIndex(s => s.id === selectedSessionId);
  const selectedSessionName = selectedSessionIndex !== -1 ? `S${selectedSessionIndex + 1}` : null;

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <button 
        onClick={() => navigate('/faculty-dashboard/roster')}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, padding: 0 }}
      >
        &larr; Back to Roster
      </button>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', fontWeight: 600, letterSpacing: '-0.5px', color: '#fff' }}>{student?.name || 'Unknown Student'}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>{student?.email}</p>
        </div>
      </div>

      {/* --- Practice & Assessments Area --- */}
      <div style={{ marginTop: '0px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '24px' }}>Practice & Assessments</h2>
        
        {sessions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No practice sessions recorded.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              
              {/* Performance Over Time Chart */}
              <div style={{ ...bentoBoxStyle, height: '400px', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>
                    Performance Trend {selectedSession ? <span style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '8px', fontWeight: 400}}>({selectedSession.module})</span> : ''}
                  </h3>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedSession ? 'Score' : 'Avg Score'}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{displayScore}%</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedSession ? 'Efficiency' : 'Avg Eff'}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{displayEff}%</div>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={practiceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-emerald, #10b981)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--accent-emerald, #10b981)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-purple, #c084fc)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--accent-purple, #c084fc)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-cyan, #0ea5e9)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--accent-cyan, #0ea5e9)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)'}} axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)'}} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                      {selectedSessionName && <ReferenceLine x={selectedSessionName} stroke="var(--accent-cyan)" strokeDasharray="3 3" />}
                      <Area type="monotone" dataKey="score" name="Score %" stroke="var(--accent-emerald, #10b981)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" dot={{ r: 4, fill: 'var(--panel-bg)', strokeWidth: 2, stroke: 'var(--accent-emerald)' }} activeDot={{ r: 6, fill: 'var(--accent-emerald)' }} />
                      <Area type="monotone" dataKey="accuracy" name="Accuracy %" stroke="var(--accent-purple, #c084fc)" strokeWidth={2} fillOpacity={1} fill="url(#colorAcc)" dot={{ r: 4, fill: 'var(--panel-bg)', strokeWidth: 2, stroke: 'var(--accent-purple)' }} activeDot={{ r: 6, fill: 'var(--accent-purple)' }} />
                      <Area type="monotone" dataKey="efficiency" name="Time Efficiency %" stroke="var(--accent-cyan, #0ea5e9)" strokeWidth={2} fillOpacity={1} fill="url(#colorEff)" dot={{ r: 4, fill: 'var(--panel-bg)', strokeWidth: 2, stroke: 'var(--accent-cyan)' }} activeDot={{ r: 6, fill: 'var(--accent-cyan)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quiz Score Over Time Chart */}
              <div style={{ ...bentoBoxStyle, height: '400px', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>
                    Quiz Trend {selectedSession ? <span style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '8px', fontWeight: 400}}>({selectedSession.module})</span> : ''}
                  </h3>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedSession && selectedSession.quizScore !== null ? 'Session Quiz' : 'Avg Quiz'}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>{displayQuiz}%</div>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={practiceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorQuizSeparate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)'}} axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)'}} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                      {selectedSessionName && <ReferenceLine x={selectedSessionName} stroke="#f59e0b" strokeDasharray="3 3" />}
                      <Area type="monotone" dataKey="quizScore" name="Quiz Score %" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorQuizSeparate)" dot={{ r: 4, fill: 'var(--panel-bg)', strokeWidth: 2, stroke: '#f59e0b' }} activeDot={{ r: 6, fill: '#f59e0b' }} connectNulls={true} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
              {/* Session Selector */}
              <div style={{ ...bentoBoxStyle, padding: '24px', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.1rem', position: 'sticky', top: 0, backgroundColor: 'var(--panel-bg)', zIndex: 2, paddingBottom: '8px' }}>
                  Session History
                </h3>
                {[...sessions].reverse().map((s, i) => {
                  const index = sessions.length - 1 - i;
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => handleSelectSession(s.id)}
                    style={{ 
                      padding: '12px', 
                      background: selectedSessionId === s.id ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selectedSessionId === s.id ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)'}`,
                      boxShadow: selectedSessionId === s.id ? '0 0 12px rgba(14, 165, 233, 0.3)' : 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ color: '#fff', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>S{index + 1}: {s.module}</span>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--accent-emerald)', background: 'rgba(52, 211, 153, 0.1)', padding: '2px 6px', borderRadius: '4px' }} title="Simulation Score">Sim: {s.score}%</span>
                        {s.quizScore !== null && s.quizScore !== undefined && (
                          <span style={{ color: 'var(--accent-cyan)', background: 'rgba(14, 165, 233, 0.1)', padding: '2px 6px', borderRadius: '4px' }} title="Quiz Score">Quiz: {s.quizScore}%</span>
                        )}
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                      {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Session Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {selectedSession && (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={selectedSession.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        style={{ ...bentoBoxStyle, display: 'flex', flexDirection: 'column', gap: '0', flex: 1 }}
                      >
                        {/* Metrics Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Simulation</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{selectedSession.score}%</div>
                          </div>
                          {selectedSession.quizScore !== null && selectedSession.quizScore !== undefined && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Quiz</div>
                              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{selectedSession.quizScore}%</div>
                            </div>
                          )}
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Mode</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginTop: 'auto' }}>{selectedSession.mode}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Status</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: selectedSession.status === 'PASSED' ? 'var(--success)' : 'var(--danger)', marginTop: 'auto' }}>{selectedSession.status}</div>
                          </div>
                        </div>

                        {/* Feedback & Improvements */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '12px', padding: '20px' }}>
                            <h4 style={{ margin: '0 0 16px 0', color: 'var(--danger)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>⚠️</span> Feedback & Mistakes
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {(() => {
                                const m = Array.isArray(selectedSession.mistakes) ? selectedSession.mistakes : (typeof selectedSession.mistakes === 'string' ? JSON.parse(selectedSession.mistakes) : []);
                                if (m.length === 0) return <li style={{ color: 'var(--success)', listStyle: 'none', marginLeft: '-20px' }}>✓ No mistakes made. Perfect!</li>;
                                return m.map((err: string, i: number) => <li key={i}>{err}</li>);
                              })()}
                            </ul>
                          </div>
                          <div style={{ background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.1)', borderRadius: '12px', padding: '20px' }}>
                            <h4 style={{ margin: '0 0 16px 0', color: 'var(--success)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>💡</span> Improvement Areas
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#fff', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {(() => {
                                const tips = Array.isArray(selectedSession.improvementAreas) ? selectedSession.improvementAreas : (typeof selectedSession.improvementAreas === 'string' ? JSON.parse(selectedSession.improvementAreas) : []);
                                if (tips.length === 0) return <li style={{ color: 'var(--text-muted)', listStyle: 'none', marginLeft: '-20px' }}>No specific tips available.</li>;
                                return tips.map((tip: string, i: number) => <li key={i} style={{ color: 'rgba(255,255,255,0.8)' }}>{tip}</li>);
                              })()}
                            </ul>
                          </div>
                        </div>

                        {selectedSession.quizData && (
                          <div style={{ marginTop: '16px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <h4 style={{ margin: '0 0 24px 0', color: '#fff', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
                              AI Quiz Breakdown
                              <span style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>Score: {selectedSession.quizScore}%</span>
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {(() => {
                                const qData = typeof selectedSession.quizData === 'string' ? JSON.parse(selectedSession.quizData) : selectedSession.quizData;
                                if (!qData || qData.length === 0) return null;
                                
                                const totalQuestions = qData.length;
                                const q = qData[currentQuizIndex];
                                
                                return (
                                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', borderLeft: `4px solid ${q.isCorrect ? 'var(--accent-emerald)' : 'var(--danger)'}`, position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Question {currentQuizIndex + 1} of {totalQuestions}</div>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                          onClick={() => setCurrentQuizIndex(prev => Math.max(0, prev - 1))}
                                          disabled={currentQuizIndex === 0}
                                          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: currentQuizIndex === 0 ? 'rgba(255,255,255,0.3)' : '#fff', borderRadius: '4px', padding: '4px 12px', cursor: currentQuizIndex === 0 ? 'not-allowed' : 'pointer', fontSize: '1.2rem' }}
                                        >
                                          &larr;
                                        </button>
                                        <button 
                                          onClick={() => setCurrentQuizIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                                          disabled={currentQuizIndex === totalQuestions - 1}
                                          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: currentQuizIndex === totalQuestions - 1 ? 'rgba(255,255,255,0.3)' : '#fff', borderRadius: '4px', padding: '4px 12px', cursor: currentQuizIndex === totalQuestions - 1 ? 'not-allowed' : 'pointer', fontSize: '1.2rem' }}
                                        >
                                          &rarr;
                                        </button>
                                      </div>
                                    </div>

                                    <div style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '16px', fontWeight: 500, lineHeight: 1.5 }}>
                                      {q.question}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                                      {q.options.map((opt: string, optIdx: number) => {
                                        let bg = 'transparent';
                                        let col = 'rgba(255,255,255,0.6)';
                                        if (optIdx === q.correctIndex) {
                                          bg = 'rgba(52, 211, 153, 0.15)';
                                          col = 'var(--accent-emerald)';
                                        } else if (optIdx === q.userSelectedIndex && !q.isCorrect) {
                                          bg = 'rgba(239, 68, 68, 0.15)';
                                          col = 'var(--danger)';
                                        }
                                        return (
                                          <div key={optIdx} style={{ padding: '10px 16px', borderRadius: '8px', background: bg, color: col, border: `1px solid ${bg !== 'transparent' ? col : 'rgba(255,255,255,0.05)'}` }}>
                                            {opt} {optIdx === q.userSelectedIndex && '(Student Answer)'} {optIdx === q.correctIndex && '(Correct)'}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                      <strong style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'normal' }}>Explanation:</strong> {q.explanation}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

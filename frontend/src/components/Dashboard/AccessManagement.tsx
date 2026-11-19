import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

export const AccessManagement: React.FC = () => {
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [students, setStudents] = useState<Array<{ id: string; name: string; email: string }>>([]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/v1/faculty/students');
      setStudents(res.data.data.students);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudents();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentEmail) return;

    try {
      await axios.post('/api/v1/faculty/students', { email: newStudentEmail });
      setMessage({ text: 'Access granted successfully.', type: 'success' });
      setNewStudentEmail('');
      fetchStudents();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage({ text: error.response?.data?.message || 'Failed to grant access', type: 'error' });
      } else {
        setMessage({ text: 'Failed to grant access', type: 'error' });
      }
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!window.confirm('Revoke access? This will permanently delete their lab records.')) return;
    try {
      await axios.delete(`/api/v1/faculty/students/${studentId}`);
      setMessage({ text: 'Access revoked.', type: 'success' });
      fetchStudents();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage({ text: error.response?.data?.message || 'Failed to revoke access', type: 'error' });
      } else {
        setMessage({ text: 'Failed to revoke access', type: 'error' });
      }
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };


  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.5px', color: '#fff', margin: '0 0 8px 0' }}>Access Control</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Manage system access and environment provisioning for your students.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Whitelist Form */}
        <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', position: 'relative', zIndex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 500 }}>Grant Access</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.9rem', position: 'relative', zIndex: 1 }}>Enter a student's email to securely provision their laboratory environment.</p>
          
          <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Student Email</label>
              <input 
                type="email" 
                placeholder="student@university.edu"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border 0.3s' }}
                onFocus={(e) => e.target.style.border = '1px solid #fff'}
                onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                required
              />
            </div>
            <button 
              type="submit" 
              style={{ padding: '16px', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', transition: 'opacity 0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              Provision Account
            </button>
          </form>

          {message.text && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', background: message.type === 'error' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: message.type === 'error' ? '#ff6b6b' : '#10b981', border: `1px solid ${message.type === 'error' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`, fontSize: '0.9rem', position: 'relative', zIndex: 1 }}
            >
              {message.text}
            </motion.div>
          )}
        </div>

        {/* Active Access List */}
        <div style={{ background: 'transparent', border: 'none', padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div className="glass-card" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', color: '#fff', fontWeight: 500, position: 'relative', zIndex: 1 }}>Active Provisions ({students.length})</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
              {students.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No active students.</p>}
              {students.map((student) => (
                <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: '#fff', fontSize: '0.95rem' }}>{student.name || 'Pending Onboarding'}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>{student.email}</div>
                  </div>
                  <button 
                    onClick={() => handleRemoveStudent(student.id)}
                    style={{ background: 'transparent', border: '1px solid rgba(255, 107, 107, 0.3)', color: '#ff6b6b', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 600, letterSpacing: '0.5px' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
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

export default AccessManagement;

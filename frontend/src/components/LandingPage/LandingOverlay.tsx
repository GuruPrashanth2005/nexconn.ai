/* eslint-disable */
import React from 'react';
import { Scroll, useScroll } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { HydroLabLogo } from '../HydroLabLogo';

export const LandingOverlay: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const scroll = useScroll();

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    height: '70px',
    width: '90%',
    maxWidth: '1200px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    zIndex: 100,
    background: 'rgba(2, 6, 23, 0.65)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: '100px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  };

  const linkStyle: React.CSSProperties = {
    color: 'var(--text-main)',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 500,
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    opacity: 0.7,
  };

  const textVariant: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] } }
  };

  const buttonStyle: React.CSSProperties = {
    background: 'rgba(14, 165, 233, 0.1)',
    border: '1px solid var(--accent-cyan)',
    color: 'var(--accent-cyan)',
    padding: '12px 32px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    letterSpacing: '1px',
    fontSize: '0.85rem',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(8px)',
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && scroll && scroll.el) {
      scroll.el.scrollTo({
        top: element.offsetTop,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Scroll html style={{ width: '100%', height: '100%' }}>
      {/* Abstract Glassmorphism Navbar */}
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 0 8px #2dd4bf)' }}>
            <HydroLabLogo color="#fbbf24" size={40} />
          </div>
          <span style={{ 
            color: 'var(--text-main)', 
            fontWeight: 800, 
            letterSpacing: '1px', 
            fontSize: '1.2rem',
            fontFamily: 'var(--font-sans)',
          }}>HYDROLAB <span style={{ color: 'var(--accent-cyan)' }}>3D</span></span>
        </div>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <span 
            style={linkStyle} 
            onMouseOver={(e) => {e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent-cyan)';}} 
            onMouseOut={(e) => {e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = 'var(--text-main)';}}
            onClick={() => scrollToSection('mission-section')}
          >
            Mission
          </span>
          <span 
            style={linkStyle} 
            onMouseOver={(e) => {e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent-cyan)';}} 
            onMouseOut={(e) => {e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = 'var(--text-main)';}}
            onClick={() => scrollToSection('features-section')}
          >
            Features
          </span>
          <span 
            style={linkStyle} 
            onMouseOver={(e) => {e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent-cyan)';}} 
            onMouseOut={(e) => {e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = 'var(--text-main)';}}
            onClick={() => scrollToSection('pricing-section')}
          >
            Pricing
          </span>
          <button 
            style={buttonStyle}
            onMouseOver={(e) => { 
              e.currentTarget.style.background = 'var(--accent-cyan)'; 
              e.currentTarget.style.color = '#020617'; 
              e.currentTarget.style.boxShadow = '0 0 20px rgba(56, 189, 248, 0.4)';
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)'; 
              e.currentTarget.style.color = 'var(--accent-cyan)'; 
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => {
              if (user) {
                navigate(user.role === 'FACULTY' ? '/faculty-dashboard' : '/student-dashboard');
              } else {
                navigate('/login');
              }
            }}
          >
            Access Terminal
          </button>
        </div>
      </nav>

      {/* Page 1: Deep Tech Hero */}
      <div id="mission-section" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8vw' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.5 }} variants={textVariant}>
          <h1 style={{ fontSize: '7vw', fontWeight: 800, margin: 0, color: 'var(--text-main)', lineHeight: 1, letterSpacing: '-2px', fontFamily: 'var(--font-sans)' }}>
            VIRTUAL
          </h1>
          <h1 style={{ 
            fontSize: '7vw', fontWeight: 800, margin: 0, lineHeight: 1, letterSpacing: '-2px', marginLeft: '6vw', fontFamily: 'var(--font-sans)',
            background: 'linear-gradient(135deg, var(--text-main) 20%, var(--accent-cyan))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            display: 'inline-block'
          }}>
            CHEMISTRY.
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '32px', maxWidth: '500px', lineHeight: 1.6, fontWeight: 400 }}>
            An immersive, highly-interactive 3D laboratory environment. Push the boundaries of chemical analysis with Agentic AI and real-time kinetic physics.
          </p>
        </motion.div>
      </div>

      {/* Page 2: Glassmorphism Details (Physics) */}
      <div id="features-section" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8vw' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.5 }} variants={textVariant} style={{ 
          maxWidth: '550px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          padding: '48px',
          borderRadius: '24px',
          border: '1px solid var(--panel-border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--accent-cyan)', letterSpacing: '2px', marginBottom: '16px', fontWeight: 600 }}>01 / KINETICS</h2>
          <h2 style={{ fontSize: '3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', lineHeight: 1.1, fontFamily: 'var(--font-sans)' }}>
            Real-Time Reactions
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginTop: '24px', lineHeight: 1.6 }}>
            Experience mathematically precise titration physics. Watch solutions diffuse, change color, and react at the exact dropwise threshold with 100% fidelity.
          </p>
        </motion.div>
      </div>

      {/* Page 3: AI Intelligence Highlight */}
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', padding: '0 8vw' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.5 }} variants={textVariant} style={{ 
          maxWidth: '550px', 
          textAlign: 'right',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          padding: '48px',
          borderRadius: '24px',
          border: '1px solid var(--panel-border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--accent-purple)', letterSpacing: '2px', marginBottom: '16px', fontWeight: 600 }}>02 / AGENTIC AI</h2>
          <h2 style={{ fontSize: '3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', lineHeight: 1.1, fontFamily: 'var(--font-sans)' }}>
            Meet Dr. Hydro
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginTop: '24px', lineHeight: 1.6 }}>
            Your personal, fully autonomous lab assistant. Ask Dr. Hydro to fetch reagents, control the burette, or troubleshoot your experiment—all powered by real-time spatial telemetry.
          </p>
        </motion.div>
      </div>
      
      {/* Page 4: Analytics */}
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8vw' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.5 }} variants={textVariant} style={{ 
          maxWidth: '550px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          padding: '48px',
          borderRadius: '24px',
          border: '1px solid var(--panel-border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--accent-emerald)', letterSpacing: '2px', marginBottom: '16px', fontWeight: 600 }}>03 / TELEMETRY</h2>
          <h2 style={{ fontSize: '3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', lineHeight: 1.1, fontFamily: 'var(--font-sans)' }}>
            Track Every Variable
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginTop: '24px', lineHeight: 1.6 }}>
            Automatically generate lab reports. Monitor titration curves in real-time, log observation data, and evaluate precision instantly across dedicated Student & Faculty dashboards.
          </p>
        </motion.div>
      </div>

      {/* Page 5: Pricing */}
      <div id="pricing-section" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 8vw' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.5 }} variants={textVariant} style={{ width: '100%', maxWidth: '1000px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>Flexible Plans</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Scale your laboratory seamlessly from individual students to entire university networks.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            
            {/* Student Tier */}
            <div style={{
              background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', padding: '40px', borderRadius: '24px',
              border: '1px solid var(--panel-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column'
            }}>
              <h3 style={{ fontSize: '1.5rem', color: '#fff', margin: '0 0 8px 0' }}>Student License</h3>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '24px' }}>
                $15<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/mo</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: 'var(--text-muted)', flex: 1 }}>
                <li style={{ marginBottom: '12px' }}>✓ Access to all core modules</li>
                <li style={{ marginBottom: '12px' }}>✓ Dr. Hydro AI Assistant (Limited)</li>
                <li style={{ marginBottom: '12px' }}>✓ Real-time Logbook</li>
              </ul>
              <button style={{ ...buttonStyle, width: '100%', textAlign: 'center' }} onClick={() => navigate('/login')}>Start Free Trial</button>
            </div>

            {/* Institution Tier */}
            <div style={{
              background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.05))', 
              backdropFilter: 'blur(20px)', padding: '40px', borderRadius: '24px',
              border: '1px solid var(--accent-cyan)', boxShadow: '0 0 30px rgba(14, 165, 233, 0.1)',
              display: 'flex', flexDirection: 'column', position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: '-12px', right: '32px', background: 'var(--accent-cyan)', color: '#000', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>MOST POPULAR</div>
              <h3 style={{ fontSize: '1.5rem', color: '#fff', margin: '0 0 8px 0' }}>University Network</h3>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>
                Custom
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: 'var(--text-main)', flex: 1 }}>
                <li style={{ marginBottom: '12px' }}>✓ Infinite scale and concurrency</li>
                <li style={{ marginBottom: '12px' }}>✓ Full LMS Integration (Canvas, Blackboard)</li>
                <li style={{ marginBottom: '12px' }}>✓ Advanced Faculty Dashboards</li>
                <li style={{ marginBottom: '12px' }}>✓ Unlimited Dr. Hydro API limits</li>
              </ul>
              <button style={{ ...buttonStyle, width: '100%', textAlign: 'center', background: 'var(--accent-cyan)', color: '#000' }}>Contact Sales</button>
            </div>

          </div>
        </motion.div>
      </div>

      {/* Page 6: Footer/Ending */}
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 8vw', textAlign: 'center' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.5 }} variants={textVariant}>
          <div style={{ width: '100%' }}>
            <h2 style={{ 
              fontSize: '5vw', fontWeight: 800, margin: 0, lineHeight: 1.1, fontFamily: 'var(--font-sans)',
              background: 'linear-gradient(135deg, var(--text-main) 20%, var(--accent-blue))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              display: 'inline-block'
            }}>
              REDEFINE THE LAB.
            </h2>
          </div>
          <button 
            style={{ ...buttonStyle, display: 'inline-block', marginTop: '48px', padding: '16px 48px', fontSize: '1rem' }}
            onMouseOver={(e) => { 
              e.currentTarget.style.background = 'var(--accent-cyan)'; 
              e.currentTarget.style.color = '#020617'; 
              e.currentTarget.style.boxShadow = '0 0 30px rgba(56, 189, 248, 0.6)';
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)'; 
              e.currentTarget.style.color = 'var(--accent-cyan)'; 
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => {
              if (user) {
                navigate(user.role === 'FACULTY' ? '/faculty-dashboard' : '/student-dashboard');
              } else {
                navigate('/login');
              }
            }}
          >
            INITIALIZE SESSION
          </button>
          
          <div style={{ marginTop: '100px', display: 'flex', gap: '32px', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>Privacy Policy</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>Terms of Service</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>Contact Support</span>
          </div>
        </motion.div>
      </div>
    </Scroll>
  );
};

export default LandingOverlay;

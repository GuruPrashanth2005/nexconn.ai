/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { HydroLabLogo } from './HydroLabLogo';

// 3D Background Component for Login
const LoginBackground3D = ({ role }: { role: 'STUDENT' | 'FACULTY' }) => {
  const sphereRef = useRef<THREE.Mesh>(null);

  const primaryColor = role === 'STUDENT' ? '#06b6d4' : '#a855f7';
  const secondaryColor = role === 'STUDENT' ? '#a855f7' : '#06b6d4';

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      sphereRef.current.rotation.x = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} color={primaryColor} />
      <directionalLight position={[-10, -10, -5]} intensity={1} color={secondaryColor} />

      {/* Abstract floating sphere off to the side */}
      <mesh ref={sphereRef} position={[0, 0, -5]} scale={4}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#020617"
          emissive={primaryColor}
          emissiveIntensity={0.5}
          distort={0.6}
          speed={2}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      <Sparkles count={300} scale={15} size={1.5} speed={0.4} opacity={0.4} color={primaryColor} />
      <Sparkles count={150} scale={15} size={2.5} speed={0.2} opacity={0.3} color={secondaryColor} />
    </>
  );
};

export const LoginPage: React.FC = () => {
  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const primaryColor = role === 'STUDENT' ? '#06b6d4' : '#a855f7';

  const handleSuccess = async (credentialResponse: any) => {
    try {
      setError(null);
      await login(credentialResponse.credential, role);

      if (role === 'FACULTY') {
        navigate('/faculty-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#020617',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* 3D Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Canvas dpr={[1, 1.5]} performance={{ min: 0.5 }} camera={{ position: [0, 0, 5], fov: 45 }}>
          <LoginBackground3D role={role} />
        </Canvas>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        style={{
          position: 'relative',
          padding: '3rem 2.5rem',
          background: 'rgba(10, 15, 30, 0.4)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
          textAlign: 'center',
          maxWidth: '420px',
          width: '90%',
          zIndex: 10
        }}
      >
        {/* The Official Logo */}
        <div style={{
          margin: '0 auto 20px',
          width: '64px', height: '64px',
          position: 'relative',
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <motion.div
            style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              filter: `drop-shadow(0 0 12px #2dd4bf)`
            }}
          >
            <HydroLabLogo color="#fbbf24" size={64} />
          </motion.div>
        </div>

        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: 800,
          margin: '0 0 8px 0',
          fontFamily: 'var(--font-sans)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span style={{
            color: '#ffffff',
            letterSpacing: '0.5px',
            fontFamily: 'var(--font-sans)',
            fontSize: '2.4rem',
            lineHeight: '1',
            paddingRight: '6px'
          }}>HydroLab</span>
          <span style={{
            color: primaryColor,
            fontFamily: 'var(--font-sans)',
            fontSize: '2.4rem',
            fontWeight: 900,
            textShadow: `0 0 10px ${primaryColor}40`
          }}>3D</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
          Virtual Chemistry Laboratory
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.9rem'
            }}
          >
            {error}
          </motion.div>
        )}

        <div style={{ marginBottom: '2.5rem', display: 'flex', gap: '12px', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '24px' }}>
          <button
            onClick={() => setRole('STUDENT')}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '18px',
              cursor: 'pointer',
              background: role === 'STUDENT' ? 'var(--accent-cyan)' : 'transparent',
              color: role === 'STUDENT' ? '#020617' : 'var(--text-muted)',
              border: role === 'STUDENT' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
              boxShadow: role === 'STUDENT' ? '0 0 20px rgba(14, 165, 233, 0.4)' : 'none',
              fontWeight: 600,
              transition: 'all 0.3s ease'
            }}
          >
            Student
          </button>
          <button
            onClick={() => setRole('FACULTY')}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '18px',
              cursor: 'pointer',
              background: role === 'FACULTY' ? 'var(--accent-purple)' : 'transparent',
              color: role === 'FACULTY' ? '#ffffff' : 'var(--text-muted)',
              border: role === 'FACULTY' ? '1px solid var(--accent-purple)' : '1px solid transparent',
              boxShadow: role === 'FACULTY' ? '0 0 20px rgba(139, 92, 246, 0.4)' : 'none',
              fontWeight: 600,
              transition: 'all 0.3s ease'
            }}
          >
            Faculty
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: '#1a1d2d',
            padding: '2px',
            borderRadius: '100px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s ease'
          }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError('Google Login Failed')}
              useOneTap={false}
              theme="filled_black"
              shape="pill"
            />
          </div>
        </div>

        <div style={{ marginTop: '2.5rem', minHeight: '40px' }}>
          {role === 'STUDENT' && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
              Students must be <span style={{ color: 'var(--accent-cyan)' }}>whitelisted</span> by a Faculty member to access the lab terminal.
            </motion.p>
          )}
          {role === 'FACULTY' && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
              New faculty members can sign up instantly and provision student access.
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;


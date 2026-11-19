import { useEffect, useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BACKGROUND_COLOR = '#08090b';
const BARB_COUNT = 1500;
const DUST_COUNT = 300;
const TOTAL_DURATION = 13.5;

const ParticleFeather = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dustRef = useRef<THREE.InstancedMesh>(null);
  
  const barbsRef = useRef<{
    t: number; side: number; width: number; baseY: number; angle: number;
    vx: number; vy: number; vz: number; detached: boolean;
    x: number; y: number; z: number; rotZ: number;
    colorIdx: number;
  }[]>([]);
  const dustsRef = useRef<{
    x: number; y: number; z: number; vx: number; vy: number; scale: number; colorIdx: number;
  }[]>([]);
  const startTime = useRef<number>(0);

  const PALETTE = useMemo(() => [
    new THREE.Color('#ff2a55'), // Red
    new THREE.Color('#00f2fe'), // Blue
    new THREE.Color('#00e676'), // Green
    new THREE.Color('#ffffff')  // White
  ], []);

  useEffect(() => {
    startTime.current = Date.now();
    
    barbsRef.current = Array.from({ length: BARB_COUNT }).map((_, i) => {
      const t = i / BARB_COUNT;
      const side = i % 2 === 0 ? 1 : -1;
      const width = Math.sin(t * Math.PI) * (1.2 - t * 0.4) + (Math.random() * 0.1);
      const angle = (Math.PI / 3) * side + (Math.random() * 0.1 * side);
      
      // Determine color based on position to create beautiful bands, plus some noise
      let colorIdx = Math.floor((t + (Math.random() * 0.1 - 0.05)) * 4);
      if (colorIdx < 0) colorIdx = 0;
      if (colorIdx > 3) colorIdx = 3;
      
      return {
        t, side, width, baseY: t * 5 - 2.5, angle,
        vx: 0, vy: 0, vz: 0, detached: false,
        x: 0, y: t * 5 - 2.5, z: 0, rotZ: angle,
        colorIdx
      };
    });

    dustsRef.current = Array.from({ length: DUST_COUNT }).map(() => ({
      x: (Math.random() - 0.5) * 12,
      y: (Math.random() - 0.5) * 12,
      z: (Math.random() - 0.5) * 5,
      vx: 0, vy: 0, scale: Math.random() * 0.04 + 0.01,
      colorIdx: Math.floor(Math.random() * 4)
    }));
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dummyDust = useMemo(() => new THREE.Object3D(), []);
  
  useFrame(({ camera, pointer }) => {
    if (barbsRef.current.length === 0 || startTime.current === 0) return;
    const elapsed = (Date.now() - startTime.current) / 1000;
    
    const targetCamX = pointer.x * 0.5;
    const targetCamY = pointer.y * 0.5;
    camera.position.x += (targetCamX - camera.position.x) * 0.05;
    camera.position.y += (targetCamY - camera.position.y) * 0.05;
    camera.position.z = 7;
    camera.lookAt(0, 0, 0);

    let globalX = -4.5; // Shift to the left
    let globalY = 0;
    let globalRot = -Math.PI / 12;
    
    if (elapsed >= 1.5) {
      globalY = Math.sin((elapsed - 1.5) * 1.5) * 0.2;
      globalRot += Math.sin((elapsed - 1.5) * 1.0) * 0.05;
    }
    
    if (elapsed >= TOTAL_DURATION - 2.5) {
      const catchT = Math.min((elapsed - (TOTAL_DURATION - 2.5)) / 1.0, 1);
      const ease = 1 - Math.pow(1 - catchT, 3);
      globalX += ease * 1.5;
      globalY += ease * 2.0;
      globalRot += ease * 0.2;
    }

    if (meshRef.current) {
      for (let i = 0; i < BARB_COUNT; i++) {
        const b = barbsRef.current[i];
        let currentScale = 0;
        
        if (elapsed < 0.5) {
          currentScale = 0;
        } else if (elapsed >= 0.5 && elapsed < 2.5) {
          const formT = (elapsed - 0.5) / 2.0;
          if (formT > b.t) {
            currentScale = Math.min((formT - b.t) * 5, 1);
          }
        } else {
          currentScale = 1;
        }

        if (elapsed >= TOTAL_DURATION - 1.5) {
          const dissolveT = (elapsed - (TOTAL_DURATION - 1.5)) / 1.0;
          if (!b.detached && dissolveT > (1 - b.t)) {
            b.detached = true;
            b.vx = 2 + Math.random() * 4;
            b.vy = 1 + Math.random() * 3;
            b.vz = (Math.random() - 0.5) * 2;
          }
        }

        if (b.detached) {
          b.x += b.vx * 0.016;
          b.y += b.vy * 0.016;
          b.z += b.vz * 0.016;
          b.rotZ += b.vx * 0.02;
          currentScale *= 0.95;
        } else {
          b.x = globalX;
          b.y = b.baseY + globalY;
          b.z = 0;
          b.rotZ = b.angle + globalRot;
        }

        let flutter = 0;
        if (elapsed >= 2.5 && !b.detached) {
          flutter = Math.sin(elapsed * 8 + b.t * 20) * 0.05 * b.t;
        }

        dummy.position.set(b.x, b.y, b.z);
        dummy.rotation.set(0, 0, b.rotZ + flutter);
        dummy.translateX((b.width * currentScale) / 2);
        dummy.scale.set(b.width * currentScale, 0.01, 0.01);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        
        const targetColor = PALETTE[b.colorIdx];
        const color = new THREE.Color('#111111');
        
        if (elapsed >= 2.5 && !b.detached) {
          const illT = (elapsed - 2.5) / 1.0;
          if (b.t < illT) {
            color.lerp(targetColor, 1);
          }
        } else if (b.detached) {
          color.lerp(targetColor, 0.5); // Slightly faded when detached
        }
        meshRef.current.setColorAt(i, color);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }

    if (dustRef.current) {
      let dustOpacity = 0;
      if (elapsed > 1.0 && elapsed < TOTAL_DURATION - 1.0) {
        dustOpacity = Math.min((elapsed - 1.0) / 1.0, 1);
      } else if (elapsed >= TOTAL_DURATION - 1.0) {
        dustOpacity = Math.max(1 - (elapsed - (TOTAL_DURATION - 1.0)) / 0.5, 0);
      }

      for (let i = 0; i < DUST_COUNT; i++) {
        const d = dustsRef.current[i];
        let windSpeed = 1;
        if (elapsed >= TOTAL_DURATION - 2.5) windSpeed = 5;
        if (elapsed >= TOTAL_DURATION - 1.5) windSpeed = 15;

        d.x += windSpeed * 0.016 + d.vx;
        if (d.x > 8) d.x = -8;
        
        const dx = targetCamX * 5 - d.x;
        const dy = targetCamY * 5 - d.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 2) {
           d.y -= (dy / dist) * 0.05;
        }

        dummyDust.position.set(d.x, d.y, d.z);
        dummyDust.scale.setScalar(d.scale * dustOpacity);
        dummyDust.updateMatrix();
        dustRef.current.setMatrixAt(i, dummyDust.matrix);
      }
      dustRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 5, 5]} intensity={2} />
      <instancedMesh ref={meshRef} args={[undefined, undefined, BARB_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={dustRef} args={[undefined, undefined, DUST_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </instancedMesh>
    </>
  );
};

const STEPS = [
  "Loading 3D Graphics Engine...",
  "Initializing Virtual Laboratory Environment...",
  "Calibrating Analytical Instruments...",
  "Loading Chemical Reagents and Solutions...",
  "Securing Assessment Environment..."
];

export default function AssessmentLoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [percent, setPercent] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    let frame: number;

    const loop = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      const newPercent = Math.min(Math.floor((elapsed / (TOTAL_DURATION - 1.5)) * 100), 100);
      setPercent(newPercent);
      
      let stepIndex = 0;
      if (elapsed > 2.0) stepIndex = 1;
      if (elapsed > 4.5) stepIndex = 2;
      if (elapsed > 7.5) stepIndex = 3;
      if (elapsed > 10.0) stepIndex = 4;
      if (elapsed > 12.0) stepIndex = 5;
      setCurrentStep(stepIndex);
      
      if (elapsed > TOTAL_DURATION - 0.5) {
        setIsFadingOut(true);
      }
      
      if (elapsed > TOTAL_DURATION) {
        onComplete();
      } else {
        frame = requestAnimationFrame(loop);
      }
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  return (
    <div style={{ 
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      boxSizing: 'border-box',
      backgroundColor: BACKGROUND_COLOR,
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      color: 'white',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: '10vw'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(8,9,11,0) 70%)',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: 'none'
      }} />

      {/* Film Grain */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        pointerEvents: 'none'
      }} />

      {/* 3D Canvas */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        opacity: isFadingOut ? 0 : 1, 
        transition: 'opacity 0.5s ease' 
      }}>
        <Canvas dpr={[1, 1.5]} performance={{ min: 0.5 }}>
          <ambientLight intensity={0.5} />
          <ParticleFeather />
        </Canvas>
      </div>

      {/* Cinematic UI Overlay */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '560px',
        maxWidth: '90%',
        height: '100vh',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.8s ease',
        pointerEvents: 'none'
      }}>
        
        <style>{`
          @keyframes slowSpin { 100% { transform: rotate(360deg); } }
        `}</style>

        {/* Title & Percentage */}
        <div style={{
          marginBottom: '60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}>
          <h2 style={{
            fontSize: '34px',
            fontWeight: 500,
            margin: '0 0 8px 0',
            letterSpacing: 'normal',
            color: 'rgba(255,255,255,0.95)'
          }}>
            Setting Up Environment
          </h2>
          <div style={{ 
            fontSize: '56px', 
            fontWeight: 600, 
            letterSpacing: 'normal',
            background: 'linear-gradient(90deg, #ffffff 0%, #00f2fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1
          }}>
            {percent}%
          </div>
        </div>

        {/* Rolling Cinematic Steps */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '240px', 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > index;
            const isActive = currentStep === index;
            const isPending = currentStep < index;
            
            let yOffset = 0;
            let scale = 1;
            let opacity = 1;
            let blur = 'blur(0px)';

            if (isCompleted) {
              const diff = currentStep - index;
              yOffset = -(diff * 50) - 20;
              scale = Math.max(1 - (diff * 0.1), 0.8);
              opacity = Math.max(0.4 - (diff * 0.15), 0);
              blur = 'blur(2px)';
            } else if (isPending) {
              const diff = index - currentStep;
              yOffset = (diff * 50) + 20;
              scale = Math.max(1 - (diff * 0.1), 0.8);
              opacity = Math.max(0.4 - (diff * 0.15), 0);
              blur = 'blur(2px)';
            }

            return (
              <div key={index} style={{
                position: 'absolute',
                left: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
                transform: `translateY(${yOffset}px) scale(${scale})`,
                opacity: opacity,
                filter: blur,
                transformOrigin: 'left center'
              }}>
                <div style={{ 
                  marginRight: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isActive ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                  color: isCompleted ? '#00e676' : (isActive ? '#00f2fe' : 'rgba(255,255,255,0.3)'),
                  fontSize: '18px',
                  animation: isActive ? 'slowSpin 4s linear infinite' : 'none'
                }}>
                  {isCompleted ? '✓' : (isActive ? '⚙' : '○')}
                </div>
                <div style={{
                  fontSize: isActive ? '20px' : '18px',
                  color: isCompleted ? 'rgba(255,255,255,0.8)' : (isActive ? '#ffffff' : 'rgba(255,255,255,0.5)'),
                  fontWeight: isActive ? 500 : 400,
                  letterSpacing: '0.01em',
                  transition: 'all 0.3s ease',
                  textShadow: isActive ? '0 2px 20px rgba(0, 242, 254, 0.3)' : 'none'
                }}>
                  {step}
                </div>
              </div>
            );
          })}
        </div>

        {/* Liquid Glass Pill Progress Bar */}
        <div style={{
          marginTop: '50px',
          width: '100%',
          height: '14px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '20px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          padding: '2px'
        }}>
          <div style={{
            height: '100%',
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
            borderRadius: '20px',
            boxShadow: 'inset 0 2px 2px rgba(255, 255, 255, 0.5), 0 0 12px rgba(0, 242, 254, 0.4)',
            transition: 'width 0.1s linear'
          }} />
        </div>
      </div>
    </div>
  );
}


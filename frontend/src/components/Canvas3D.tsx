import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import LabScene from './LabScene';


import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const CameraAnimator = ({ controlsRef }: { controlsRef: React.MutableRefObject<OrbitControlsImpl | null> }) => {
  const { cameraFocusTarget } = useSimulationStore();
  
  const animState = React.useRef<'idle' | 'zooming_in' | 'zooming_out'>('idle');
  const animTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const defaultCamPos = React.useRef(new THREE.Vector3(0, 1.5, 4.5));
  const defaultTarget = React.useRef(new THREE.Vector3(0, 0.4, 0));

  React.useEffect(() => {
    if (cameraFocusTarget) {
      animState.current = 'zooming_in';
      if (animTimer.current) clearTimeout(animTimer.current);
      
      // Zoom in for 2.5 seconds, then zoom out
      animTimer.current = setTimeout(() => {
         animState.current = 'zooming_out';
         
         // Idle after returning
         animTimer.current = setTimeout(() => {
            animState.current = 'idle';
         }, 2000);
      }, 2500);
    }
  }, [cameraFocusTarget]);

  // Reusable vector for calculations to prevent memory leaks in the render loop
  const targetPosRef = React.useRef(new THREE.Vector3());

  useFrame((state) => {
    if (!controlsRef.current) return;
    
    if (animState.current === 'zooming_in' && cameraFocusTarget) {
       targetPosRef.current.set(cameraFocusTarget.x, cameraFocusTarget.y + 0.5, cameraFocusTarget.z + 1.5);
       state.camera.position.lerp(targetPosRef.current, 0.05);
       controlsRef.current.target.lerp(cameraFocusTarget, 0.05);
    } else if (animState.current === 'zooming_out') {
       state.camera.position.lerp(defaultCamPos.current, 0.05);
       controlsRef.current.target.lerp(defaultTarget.current, 0.05);
    }
  });
  
  return null;
};

import { useSimulationStore } from '../state/simulationStore';

export const Canvas3D: React.FC = () => {
  const controlsRef = React.useRef<OrbitControlsImpl>(null);

  const [showHint, setShowHint] = useState(() => {
    return localStorage.getItem('lab_cameraHintSeen') !== 'true';
  });

  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
        localStorage.setItem('lab_cameraHintSeen', 'true');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showHint]);

  return (
    <div className="canvas-container">
      {/* Help button to re-trigger hint */}
      <button 
        className="camera-help-btn"
        onClick={() => setShowHint(true)}
        title="Camera Controls Help"
      >
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
          <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
        </svg>
      </button>

      {/* Visual camera helper label */}
      <div className={`canvas-instruction-overlay ${showHint ? 'visible' : 'hidden'}`}>
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
        </svg>
        Camera: Drag to rotate · Scroll to zoom
      </div>

      <Canvas dpr={[1, 1.5]} performance={{ min: 0.5 }}
        camera={{ position: [0, 1.5, 4.5], fov: 50 }}
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: true, alpha: true }}
      >
        
        {/* Ambient environment light */}
        <ambientLight intensity={0.6} />
        
        {/* Soft fill light */}
        <pointLight position={[-4, 3, -2]} intensity={0.3} />
        
        {/* Key Directional Light */}
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />

        {/* Studio Spotlight directly above the titration stand */}
        <spotLight
          position={[0, 5, 0]}
          intensity={1.5}
          angle={0.4}
          penumbra={0.5}
          castShadow
        />

        <Suspense fallback={null}>
          <Suspense fallback={null}>
          <LabScene />
        </Suspense>
        </Suspense>

        <CameraAnimator controlsRef={controlsRef} />
        <OrbitControls ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={2.5}
          maxDistance={7}
          maxPolarAngle={Math.PI / 2 - 0.05} // prevent going underneath the table
          target={[0, 0.4, 0]}
        />
      </Canvas>
    </div>
  );
};

export default Canvas3D;


import React from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
// Removed unused THREE import
import LandingScene from './LandingScene';
import LandingOverlay from './LandingOverlay';
import CustomCursor from './CustomCursor';

export const LandingPage: React.FC = () => {
  const bgColor = '#020617'; // Deep Oceanic Navy

  return (
    <div style={{ width: '100vw', height: '100vh', background: bgColor, overflow: 'hidden' }}>
      {/* Custom Global Cursor */}
      <CustomCursor />
      
      <Canvas dpr={[1, 1.5]} performance={{ min: 0.5 }} camera={{ position: [0, 0, 5], fov: 45 }}>
        <color attach="background" args={[bgColor]} />
        <ambientLight intensity={0.1} />
        <spotLight position={[5, 10, 5]} angle={0.25} penumbra={1} intensity={2} color="#ffffff" />
        <spotLight position={[-5, 5, -5]} angle={0.5} penumbra={0.5} intensity={1} color="#06b6d4" />
        
        {/* Pages = 6 means it takes 6 viewports to scroll to the bottom */}
        <ScrollControls pages={6} damping={0.2}>
          <LandingScene />
          <LandingOverlay />
        </ScrollControls>
      </Canvas>
    </div>
  );
};

export default LandingPage;


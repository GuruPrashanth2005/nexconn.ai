import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../state/simulationStore';

export const Burette: React.FC = () => {
  const {
    flaskTitrantVolume,
    isStopcockOpen,
    isBuretteFilled,
    selectedEquipment,
    selectEquipment,
    fillBurette,
    activeModule,
    codActiveStation,
    sampleBuretteFilled,
    blankBuretteFilled,
    sampleTitrantVolume,
    blankTitrantVolume,
  } = useSimulationStore();

  const currentBuretteFilled = activeModule === 'COD' 
    ? (codActiveStation === 'SAMPLE' ? sampleBuretteFilled : blankBuretteFilled)
    : isBuretteFilled;

  const currentFlaskTitrantVolume = activeModule === 'COD'
    ? (codActiveStation === 'SAMPLE' ? sampleTitrantVolume : blankTitrantVolume)
    : flaskTitrantVolume;

  const valveRef = useRef<THREE.Group>(null);
  const dropRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const theme = useSimulationStore((state) => state.theme);
  const highlightedEquipment = useSimulationStore((state) => state.highlightedEquipment);
  const isHighlighted = highlightedEquipment?.toLowerCase() === 'burette';
  const glassColor = theme === 'dark' ? '#f8fafc' : '#94a3b8';

  // Constants for burette liquid dimensions
  // Standard laboratory burette graduated scale is 25.0 ml (or 50.0 ml).
  // The simulation limits max titration to 25.0 ml and gradations are [0, 5, 10, 15, 20, 25].
  // totalCapacity MUST match the maximum graduated scale (25.0 ml) so that:
  // - At 0.0 ml dispensed, the meniscus is exactly at the top 0 ml mark.
  // - At V ml dispensed, the meniscus corresponds exactly to the V ml tick on the burette.
  const H = 2.4; // Height of the graduated section
  const totalCapacity = 25.0; // ml (matches the [0..25] scale)
  
  // Calculate remaining liquid height and position
  const remainingVolume = currentBuretteFilled ? Math.max(0, totalCapacity - currentFlaskTitrantVolume) : 0;
  const liquidHeight = H * (remainingVolume / totalCapacity);
  // Bottom of the 25 ml scale is at y = 1.6 - H = -0.8
  const liquidY = -0.8 + liquidHeight / 2;
  const meniscusY = -0.8 + liquidHeight;

  // Animate stopcock valve rotation and falling drops
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Set valve handle orientation: Vertical (0) = Open (Flowing), Horizontal (PI/2) = Closed (Off)
    if (valveRef.current) {
      const targetAngle = isStopcockOpen ? 0 : Math.PI / 2;
      valveRef.current.rotation.z = THREE.MathUtils.lerp(valveRef.current.rotation.z, targetAngle, 0.2);
    }

    // Animate falling drops
    if (dropRef.current) {
      if (isStopcockOpen && currentBuretteFilled && remainingVolume > 0) {
        // Drop falls from y = -1.2 to y = -2.0 repeatedly
        const speed = 6;
        const progress = (t * speed) % 1.0;
        dropRef.current.position.y = -1.2 - progress * 0.8;
        dropRef.current.scale.setScalar(0.015 * (1 - progress * 0.3));
        dropRef.current.visible = true;
      } else {
        dropRef.current.visible = false;
      }
    }

    if (groupRef.current) {
      if (isHighlighted) {
        groupRef.current.position.y = 2.1 + Math.sin(t * 3) * 0.04;
      } else {
        groupRef.current.position.y = 2.1;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, 2.1, 0]} // Center stand on bench
      onClick={(e) => {
        e.stopPropagation();
        if (selectedEquipment === 'EDTA_BOTTLE') {
          fillBurette();
        } else {
          selectEquipment(selectedEquipment === 'BURETTE' ? null : 'BURETTE');
        }
      }}
    >
      {/* 1. Burette Stand Structure */}
      {/* Heavy Rectangular Base */}
      <mesh position={[0, -2.1, -0.6]} receiveShadow castShadow>
        <boxGeometry args={[1.2, 0.08, 0.8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.8} />
      </mesh>
      
      {/* Vertical Metal Rod */}
      <mesh position={[0, 0.2, -0.8]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 4.0, 8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Stand Clamp (Holding Burette) */}
      <mesh position={[0, 0.5, -0.4]} castShadow>
        <boxGeometry args={[0.06, 0.04, 0.8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 16, 1, true]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* 2. Glass Burette Tube */}
      {/* Transparent Cylinder */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.04, 3.2, 16]} />
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          opacity={0.25}
          roughness={0.1}
          metalness={0.1}
          transmission={0.95}
          thickness={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Reagent liquid (EDTA) inside the burette */}
      {currentBuretteFilled && remainingVolume > 0 && (
        <group>
          {/* Liquid Cylinder */}
          <mesh position={[0, liquidY, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.038, liquidHeight, 16]} />
            <meshStandardMaterial
              color="#e0f2fe" // light sky blue/clear color
              transparent
              opacity={0.6}
              roughness={0.2}
            />
          </mesh>

          {/* Meniscus Top (curved disk) */}
          <mesh position={[0, meniscusY, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 0.01, 16]} />
            <meshStandardMaterial color="#93c5fd" roughness={0.1} />
          </mesh>

          {/* Meniscus Live Level Indicator Tag */}
          <Html
            position={[-0.14, meniscusY, 0]}
            center
            distanceFactor={4}
            zIndexRange={[120, 0]}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.6)',
              borderRadius: '4px',
              padding: '2px 6px',
              color: '#38bdf8',
              fontSize: '9px',
              fontFamily: 'monospace',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>◄</span>
              <span>{currentFlaskTitrantVolume.toFixed(2)} ml</span>
            </div>
          </Html>
        </group>
      )}

      {/* 4. Graduation Lines & Labels (rendered in 3D space) */}
      {/* Major tick lines at 0, 5, 10, 15, 20, 25 ml */}
      {[0, 5, 10, 15, 20, 25].map((ml) => {
        // Ticks go from top (0 ml) to bottom (25 ml)
        const tickY = 1.6 - (ml / totalCapacity) * H;
        return (
          <group key={ml} position={[0, tickY, 0]}>
            {/* Small Ring representation for major scale line */}
            <mesh>
              <torusGeometry args={[0.046, 0.002, 8, 24]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
            </mesh>
            {/* Value Label */}
            <Html
              position={[0.08, 0, 0]}
              center
              distanceFactor={4}
              zIndexRange={[100, 0]}
              style={{ pointerEvents: 'none', color: 'var(--text-main)', fontSize: '8px', fontFamily: 'monospace' }}
            >
              <div>{ml}</div>
            </Html>
          </group>
        );
      })}

      {/* 5. Stopcock / Flow Valve Mechanism */}
      {/* Valve Body */}
      <mesh position={[0, -1.1, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.02, 0.2, 16]} />
        <meshPhysicalMaterial color={glassColor} transparent opacity={0.5} transmission={0.9} depthWrite={false} />
      </mesh>

      {/* Rotating Key & Valve handle bar (Rotates together as a unit) */}
      <group 
        ref={valveRef} 
        position={[0, -1.1, 0.05]} 
        rotation={[0, 0, isStopcockOpen ? 0 : Math.PI / 2]}
      >
        <mesh castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        
        {/* Valve handle bar (Red handle perpendicular to valve axis) */}
        <mesh position={[0, 0, 0.06]} castShadow>
          <boxGeometry args={[0.12, 0.02, 0.03]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
      </group>

      {/* Nozzle/Tip at very bottom */}
      <mesh position={[0, -1.25, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.005, 0.15, 8]} />
        <meshPhysicalMaterial color={glassColor} transparent opacity={0.5} transmission={0.9} depthWrite={false} />
      </mesh>

      {/* 6. Liquid Drop Animation (Dynamic Mesh) */}
      <mesh ref={dropRef} position={[0, -1.3, 0]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.8} />
      </mesh>

      {/* AI Agentic Highlight Glow */}
      {isHighlighted && (
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 3.6, 16]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.3} side={THREE.BackSide} />
          <pointLight color="#00ffcc" intensity={2} distance={2} />
        </mesh>
      )}
    </group>
  );
};

export default Burette;

/* eslint-disable */
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../state/simulationStore';

export const ConicalFlask: React.FC = () => {
  const {
    flaskHasSample,
    flaskTitrantVolume,
    isSwirling,
    solutionColor,
    selectedEquipment,
    selectEquipment,
    pipetteDispense,
    addIndicatorToFlask,
    triggerSwirl,
    theme,
    activeModule,
    codActiveStation,
    sampleHasWater,
    blankHasWater,
    sampleTitrantVolume,
    blankTitrantVolume,
  } = useSimulationStore();

  const currentFlaskHasContent = activeModule === 'COD'
    ? (codActiveStation === 'SAMPLE' ? sampleHasWater : blankHasWater)
    : flaskHasSample;

  const currentFlaskTitrantVolume = activeModule === 'COD'
    ? (codActiveStation === 'SAMPLE' ? sampleTitrantVolume : blankTitrantVolume)
    : flaskTitrantVolume;

  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const highlightedEquipment = useSimulationStore((state) => state.highlightedEquipment);
  const isHighlighted = highlightedEquipment?.toLowerCase() === 'conical flask' || highlightedEquipment?.toLowerCase() === 'flask';
  
  const glassColor = theme === 'dark' ? '#f8fafc' : '#94a3b8';

  // Swirl translation and tilting animation
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (isSwirling) {
      // Fast circular orbital agitation
      const speed = 14;
      const radius = 0.05;
      const xOffset = Math.sin(t * speed) * radius;
      const zOffset = Math.cos(t * speed) * radius;
      
      groupRef.current.position.set(xOffset, 0.28, zOffset);
      
      // Dynamic tilting following the circular motion
      groupRef.current.rotation.set(
        Math.cos(t * speed) * 0.05,
        0,
        -Math.sin(t * speed) * 0.05
      );
    } else if (isHighlighted) {
      // Float vertically when highlighted
      groupRef.current.position.set(0, 0.28 + Math.sin(t * 3) * 0.04, 0);
      groupRef.current.rotation.set(0, 0, 0);
    } else {
      // Reset position and angle smoothly
      groupRef.current.position.set(0, 0.28, 0);
      groupRef.current.rotation.set(0, 0, 0);
    }
  });

  const handleFlaskClick = (e: any) => {
    e.stopPropagation();

    // Check if user is holding Pipette and wants to dispense water
    if (selectedEquipment === 'PIPETTE') {
      pipetteDispense();
      return;
    }

    // Check if user is holding EBT Indicator and wants to add it
    if (selectedEquipment === 'EBT_BOTTLE') {
      addIndicatorToFlask('EBT');
      return;
    }

    // Otherwise, select the flask or trigger a swirl if sample is present
    if (currentFlaskHasContent) {
      triggerSwirl();
    } else {
      selectEquipment(selectedEquipment === 'CONICAL_FLASK' ? null : 'CONICAL_FLASK');
    }
  };

  return (
    <group
      ref={groupRef}
      position={[0, 0.28, 0]} // Positioned on the table bench
      onClick={handleFlaskClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Conical Glass Outer Shell */}
      {/* Lower Cone Part */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.38, 0.5, 16]} />
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          opacity={0.35}
          roughness={0.05}
          metalness={0.1}
          transmission={0.98}
          thickness={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Narrow Cylindrical Neck */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.16, 16]} />
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          opacity={0.35}
          roughness={0.05}
          transmission={0.98}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Top rim lip */}
      <mesh position={[0, 0.4, 0]}>
        <torusGeometry args={[0.07, 0.008, 8, 16]} />
        <meshPhysicalMaterial color={glassColor} transparent opacity={0.6} transmission={0.9} clearcoat={1.0} depthWrite={false} />
      </mesh>

      {/* 2. Liquid Solution Inside Flask */}
      {currentFlaskHasContent && (
        <mesh position={[0, -0.15, 0]} castShadow>
          {/* Conical shaped liquid volume */}
          <cylinderGeometry
            args={[
              0.16 + (currentFlaskTitrantVolume > 0 ? currentFlaskTitrantVolume * 0.003 : 0), // radius expands slightly as volume increases
              0.34,
              0.16,
              16,
            ]}
          />
          <meshStandardMaterial
            color={solutionColor.hex}
            emissive={solutionColor.hex}
            emissiveIntensity={0.3}
            transparent
            opacity={Math.max(0.6, solutionColor.opacity)}
            roughness={0.1}
          />
          {/* 3D Particle Titrant Droplet Splashes */}
          {useSimulationStore.getState().isStopcockOpen && (
            <Sparkles 
              count={20} 
              scale={0.2} 
              size={1} 
              speed={0.8} 
              color="#e0f2fe" 
              position={[0, 0.1, 0]} 
            />
          )}
          {/* Endpoint Burst Effect */}
          {solutionColor.isStable && solutionColor.opacity > 0.8 && (
            <Sparkles 
              count={50} 
              scale={0.4} 
              size={2} 
              speed={1.5} 
              color={solutionColor.hex} 
              position={[0, 0, 0]} 
            />
          )}
        </mesh>
      )}

      {/* Ring highlighting when cursor is hovering or action is possible */}
      {hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.24, 0]}>
          <ringGeometry args={[0.42, 0.45, 32]} />
          <meshBasicMaterial color={selectedEquipment ? 'lime' : 'cyan'} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* AI Agentic Highlight Glow */}
      {isHighlighted && (
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.7, 16]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.3} side={THREE.BackSide} />
          <pointLight color="#00ffcc" intensity={2} distance={2} />
        </mesh>
      )}
    </group>
  );
};

export default ConicalFlask;


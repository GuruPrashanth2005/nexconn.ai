import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../state/simulationStore';

interface PipetteProps {
  position: [number, number, number];
  rotation: [number, number, number];
  isSelected: boolean;
  activeLiquid: 'WATER' | 'DISTILLED' | null;
  showLabel: boolean;
  onClick: () => void;
}

export const Pipette: React.FC<PipetteProps> = ({
  position,
  rotation,
  isSelected,
  activeLiquid,
  showLabel,
  onClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const theme = useSimulationStore((state) => state.theme);
  const highlightedEquipment = useSimulationStore((state) => state.highlightedEquipment);
  const glassColor = theme === 'dark' ? '#e2e8f0' : '#94a3b8';
  
  const isHighlighted = highlightedEquipment?.toLowerCase() === 'pipette';

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (isSelected) {
      // Float vertically when selected
      groupRef.current.position.set(0, 1.2 + Math.sin(t * 3) * 0.04, 0.4);
      groupRef.current.rotation.set(-Math.PI / 6, 0, 0); // Angled for action
    } else {
      groupRef.current.position.set(position[0], hovered ? position[1] + 0.03 : position[1], position[2]);
      groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
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
      {/* Long Glass Pipette Shaft */}
      <mesh castShadow>
        <cylinderGeometry args={[0.015, 0.01, 1.4, 8]} />
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          opacity={0.35}
          roughness={0.1}
          metalness={0.1}
          transmission={0.9}
          thickness={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Rubber Bulb (Top) */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.6} />
      </mesh>

      {/* Bulb neck spacer */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Pipette Tip (Bottom) */}
      <mesh position={[0, -0.73, 0]}>
        <cylinderGeometry args={[0.01, 0.003, 0.1, 8]} />
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          opacity={0.4}
          transmission={0.9}
          depthWrite={false}
        />
      </mesh>

      {/* Water liquid inside pipette if full */}
      {activeLiquid === 'WATER' && (
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.012, 0.011, 0.7, 8]} />
          <meshStandardMaterial
            color="#93c5fd"
            transparent
            opacity={0.7}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* Outline Ring when Pipette is Selected */}
      {isSelected && (
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.12, 16]} />
          <meshBasicMaterial color="cyan" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Label overlay */}
      {showLabel && (
        <Html
          position={[0, 0.9, 0]}
          center
          distanceFactor={6}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: isSelected ? 'var(--accent-cyan)' : 'var(--panel-bg)',
              color: isSelected ? '#000' : 'var(--text-main)',
              border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.15)'}`,
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '9px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {activeLiquid === 'WATER' ? 'Pipette (Full 20ml)' : 'Pipette (Empty)'}
          </div>
        </Html>
      )}

      {/* AI Agentic Highlight Glow */}
      {isHighlighted && (
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.6, 16]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.3} side={THREE.BackSide} />
          <pointLight color="#00ffcc" intensity={2} distance={2} />
        </mesh>
      )}
    </group>
  );
};

export default Pipette;

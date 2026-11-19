import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../state/simulationStore';

interface ReagentBottleProps {
  position: [number, number, number];
  name: string;
  label: string;
  color: string;
  liquidColor?: string;
  isSelected: boolean;
  showLabel: boolean;
  onClick: () => void;
}

export const ReagentBottle: React.FC<ReagentBottleProps> = ({
  position,
  name,
  label,
  color,
  liquidColor = '#ffffff',
  isSelected,
  showLabel,
  onClick,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const theme = useSimulationStore((state) => state.theme);
  const highlightedEquipment = useSimulationStore((state) => state.highlightedEquipment);
  const glassColor = theme === 'dark' ? '#a5f3fc' : '#38bdf8';
  
  const searchStr = highlightedEquipment?.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nameStr = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const labelStr = label.toLowerCase().replace(/[^a-z0-9]/g, '');

  const isHighlighted = !!searchStr && (
    nameStr.includes(searchStr) || 
    labelStr.includes(searchStr) || 
    searchStr.includes(nameStr.replace('bottle', ''))
  );

  // Slow idle rotation or hover lift
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    
    // Smooth hovering animation if selected
    // Smooth hovering animation if selected or highlighted
    if (isSelected || isHighlighted) {
      meshRef.current.position.y = position[1] + Math.sin(t * 4) * 0.04 + 0.1;
    } else if (hovered) {
      meshRef.current.position.y = position[1] + 0.05;
    } else {
      meshRef.current.position.y = position[1];
    }
  });

  return (
    <group
      ref={meshRef}
      position={[position[0], position[1], position[2]]}
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
      {/* Bottle Glass Outer Shell */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.7, 16]} />
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          opacity={0.35}
          roughness={0.1}
          metalness={0.1}
          transmission={0.9}
          thickness={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Liquid inside the bottle */}
      <mesh position={[0, -0.05, 0]} castShadow>
        <cylinderGeometry args={[0.20, 0.20, 0.5, 16]} />
        <meshStandardMaterial
          color={liquidColor}
          transparent
          opacity={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* Bottle Neck */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          opacity={0.4}
          roughness={0.1}
          transmission={0.9}
          depthWrite={false}
        />
      </mesh>

      {/* Cap */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>

      {/* Bottle Label Paper */}
      <mesh position={[0, 0, 0.15]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.22, 0.35]} />
        <meshStandardMaterial color="#fffef0" roughness={0.8} />
      </mesh>

      {/* Label Text via HTML overlay */}
      {showLabel && (
        <Html
          position={[0, 0.7, 0]}
          center
          distanceFactor={6}
          zIndexRange={[100, 0]}
          style={{
            transition: 'all 0.2s',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              background: isSelected ? 'var(--accent-cyan)' : 'var(--panel-bg)',
              color: isSelected ? '#000' : 'var(--text-main)',
              border: `1.5px solid ${isSelected ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.2)'}`,
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              boxShadow: isSelected ? '0 0 10px var(--accent-cyan)' : '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {label}
          </div>
        </Html>
      )}

      {/* Glowing ring under bottle if selected */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.34, 0]}>
          <ringGeometry args={[0.25, 0.3, 32]} />
          <meshBasicMaterial color="cyan" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* AI Agentic Highlight Glow */}
      {isHighlighted && (
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.8, 16]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.3} side={THREE.BackSide} />
          <pointLight color="#00ffcc" intensity={2} distance={2} />
        </mesh>
      )}
    </group>
  );
};

export default ReagentBottle;

/* eslint-disable */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Ring } from '@react-three/drei';
import * as THREE from 'three';

export interface ElementData {
  number: number;
  atomic_mass: number;
  shells: number[];
  color?: string;
  symbol: string;
}

interface AtomicStructureProps {
  elementData: ElementData;
  radius: number; // The radius of the outer shell (to scale the internal structure)
}

export const AtomicStructure: React.FC<AtomicStructureProps> = ({ elementData, radius }) => {
  // Cap nucleons to avoid browser crash on heavy elements
  const MAX_RENDER_NUCLEONS = 40; 
  
  const protonsCount = elementData.number;
  const neutronsCount = Math.max(0, Math.round(elementData.atomic_mass) - protonsCount);
  
  const renderProtons = Math.min(protonsCount, MAX_RENDER_NUCLEONS);
  const renderNeutrons = Math.min(neutronsCount, MAX_RENDER_NUCLEONS);

  // Generate clustered positions for the nucleus
  const nucleusParticles = useMemo(() => {
    const particles: { pos: [number, number, number], type: 'proton' | 'neutron' }[] = [];
    const radiusLimit = 0.3 * radius; // Nucleus takes up about 30% of the atom space
    
    // Protons
    for (let i = 0; i < renderProtons; i++) {
      const r = radiusLimit * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      particles.push({
        type: 'proton',
        pos: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ]
      });
    }

    // Neutrons
    for (let i = 0; i < renderNeutrons; i++) {
      const r = radiusLimit * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      particles.push({
        type: 'neutron',
        pos: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ]
      });
    }

    return particles;
  }, [renderProtons, renderNeutrons, radius]);

  // Generate electrons
  const shells = elementData.shells || [];
  
  return (
    <group>
      {/* Nucleus Core */}
      {nucleusParticles.map((p, i) => (
        <Sphere key={`nucleon-${i}`} args={[radius * 0.08, 8, 8]} position={p.pos}>
          <meshPhysicalMaterial 
            color={p.type === 'proton' ? '#ef4444' : '#3b82f6'} 
            emissive={p.type === 'proton' ? '#ef4444' : '#3b82f6'}
            emissiveIntensity={0.6}
            roughness={0.2} 
            metalness={0.2} 
          />
        </Sphere>
      ))}

      {/* Electron Shells */}
      {shells.map((electronCount, shellIdx) => {
        // Space shells out evenly between the nucleus (0.3*r) and the outer boundary (1.0*r)
        const shellRadius = radius * 0.4 + (radius * 0.55 * ((shellIdx + 1) / shells.length));
        return (
          <ElectronShell 
            key={`shell-${shellIdx}`} 
            radius={shellRadius} 
            electronCount={electronCount} 
            speed={1 + (shellIdx * 0.5)} // inner shells rotate faster? Or slower. Just add variance.
            electronRadius={radius * 0.05}
          />
        );
      })}
    </group>
  );
};

// Component for a single orbiting shell
const ElectronShell = ({ radius, electronCount, speed, electronRadius }: { radius: number, electronCount: number, speed: number, electronRadius: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create randomized orbit angles for the shell so they aren't all flat on the same plane
  const tiltX = useMemo(() => (Math.random() - 0.5) * Math.PI, []);
  const tiltY = useMemo(() => (Math.random() - 0.5) * Math.PI, []);

  const electrons = useMemo(() => {
    const list = [];
    const angleStep = (2 * Math.PI) / electronCount;
    for (let i = 0; i < electronCount; i++) {
      const angle = i * angleStep;
      list.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    }
    return list;
  }, [electronCount, radius]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += speed * delta * 0.5;
    }
  });

  return (
    <group rotation={[tiltX, tiltY, 0]}>
      {/* Shell Ring */}
      <Ring args={[radius - 0.01, radius + 0.01, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} side={THREE.DoubleSide} />
      </Ring>
      
      {/* Orbiting Electrons */}
      <group ref={groupRef}>
        {electrons.map((pos, i) => (
          <Sphere key={`e-${i}`} args={[electronRadius, 8, 8]} position={pos as [number, number, number]}>
            <meshBasicMaterial color="#fbbf24" />
          </Sphere>
        ))}
      </group>
    </group>
  );
};

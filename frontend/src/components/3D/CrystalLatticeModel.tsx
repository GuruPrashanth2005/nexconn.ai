/* eslint-disable */
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Box, Torus } from '@react-three/drei';
import * as THREE from 'three';

// --- LAYER 5 (Subatomic) ---
const GluonField = ({ opacity }: { opacity: number }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current && opacity > 0) {
      ref.current.rotation.x += 0.1;
      ref.current.rotation.y += 0.15;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.1;
      ref.current.scale.set(scale, scale, scale);
    }
  });
  
  return (
    <group ref={ref}>
      <Sphere args={[0.012, 8, 8]}>
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} transparent opacity={opacity * 0.3} wireframe />
      </Sphere>
    </group>
  );
};

const Nucleon = ({ type, position, color, isDecaying }: { type: 'proton' | 'neutron', position: [number, number, number], color: string, isDecaying: boolean }) => {
  const outerRef = useRef<THREE.Mesh>(null);
  const quarksRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const vec = useMemo(() => new THREE.Vector3(...position), [position]);

  const quarks = useMemo(() => {
    if (type === 'proton') return [{ pos: [0.005, 0.005, 0], color: '#ef4444' }, { pos: [-0.005, 0.005, 0], color: '#ef4444' }, { pos: [0, -0.005, 0], color: '#3b82f6' }];
    return [{ pos: [0.005, 0.005, 0], color: '#3b82f6' }, { pos: [-0.005, 0.005, 0], color: '#3b82f6' }, { pos: [0, -0.005, 0], color: '#ef4444' }];
  }, [type]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Decay animation: if decaying, fly outwards
    if (isDecaying) {
       groupRef.current.position.y += 0.02; // Fly upwards
       groupRef.current.position.x += (Math.random() - 0.5) * 0.01;
    } else {
       groupRef.current.position.copy(vec);
    }
    
    // World position of the nucleon is its local pos + atom pos [0, -0.5, 0]
    const worldPos = new THREE.Vector3().copy(groupRef.current.position).add(new THREE.Vector3(0, -0.5, 0));
    const d = state.camera.position.distanceTo(worldPos);
    
    // Fade into quarks when camera is extremely close (d < 0.1)
    const outerOpacity = THREE.MathUtils.clamp((d - 0.025) / 0.02, 0, 1);
    const innerOpacity = THREE.MathUtils.clamp(1 - (d - 0.05) / 0.04, 0, 1);
    
    if (outerRef.current) {
      (outerRef.current.material as THREE.Material).opacity = outerOpacity;
    }
    
    if (quarksRef.current) {
      quarksRef.current.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
           (child.material as THREE.Material).opacity = innerOpacity;
        }
      });
      if (innerOpacity > 0) {
        quarksRef.current.rotation.y += 0.05;
        quarksRef.current.rotation.z += 0.02;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere ref={outerRef} args={[0.015, 12, 12]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={1} />
      </Sphere>
      <group ref={quarksRef}>
        <GluonField opacity={1} />
        {quarks.map((q, i) => (
          <Sphere key={i} position={q.pos as [number, number, number]} args={[0.004, 12, 12]}>
            <meshStandardMaterial color={q.color} emissive={q.color} emissiveIntensity={2} transparent opacity={0} />
          </Sphere>
        ))}
      </group>
    </group>
  );
};

const DetailedNucleusCluster = ({ protons, neutrons, isDecaying }: { protons: number, neutrons: number, isDecaying: boolean }) => {
  const particles = useMemo(() => {
    const arr = [];
    const total = protons + neutrons;
    let pCount = 0;
    let nCount = 0;
    
    for (let i = 0; i < total; i++) {
      const type = (pCount < protons && (nCount >= neutrons || Math.random() > 0.5)) ? 'proton' : 'neutron';
      if (type === 'proton') pCount++; else nCount++;
      
      const radius = 0.015 * Math.pow(i, 1/3); // Dense packing
      const phi = Math.acos(-1 + (2 * i) / total);
      const theta = Math.sqrt(total * Math.PI) * phi;
      
      arr.push({
        id: i,
        type,
        position: [
          radius * Math.cos(theta) * Math.sin(phi),
          radius * Math.sin(theta) * Math.sin(phi),
          radius * Math.cos(phi)
        ] as [number, number, number],
        color: type === 'proton' ? '#ff3366' : '#3366ff',
        isDecayingParticle: isDecaying && (i === total - 1 || i === total - 2) // Emit last two particles during decay
      });
    }
    return arr;
  }, [protons, neutrons, isDecaying]);

  return (
    <group>
      {particles.map(p => (
        <Nucleon key={p.id} type={p.type as 'proton' | 'neutron'} position={p.position} color={p.color} isDecaying={p.isDecayingParticle} />
      ))}
      <pointLight intensity={0.5} distance={2} color={isDecaying ? '#ff0000' : '#ffffff'} />
    </group>
  );
};

// Generic distant Nucleus (for background atoms to save performance)
const NucleusCluster = ({ color }: { color: string }) => {
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 12; i++) {
      arr.push([
        (Math.random() - 0.5) * 0.06,
        (Math.random() - 0.5) * 0.06,
        (Math.random() - 0.5) * 0.06,
        i % 2 === 0 ? '#ff3366' : '#3366ff'
      ]);
    }
    return arr;
  }, []);

  return (
    <group>
      {particles.map((p, i) => (
        <Sphere key={i} args={[0.015, 8, 8]} position={[p[0] as number, p[1] as number, p[2] as number]}>
          <meshStandardMaterial color={p[3] as string} emissive={p[3] as string} emissiveIntensity={1} transparent opacity={1} />
        </Sphere>
      ))}
      <pointLight intensity={0.5} distance={2} color={color} />
    </group>
  );
};

const DynamicLighting = () => {
  const lightRef = useRef<THREE.PointLight>(null);
  const color1 = useMemo(() => new THREE.Color('#22d3ee'), []); // Cyan
  const color2 = useMemo(() => new THREE.Color('#a78bfa'), []); // Purple
  const color3 = useMemo(() => new THREE.Color('#100020'), []); // Dark Void
  const color4 = useMemo(() => new THREE.Color('#ff3366'), []); // Red Core
  
  useFrame((state) => {
    if (!lightRef.current) return;
    const d = state.camera.position.distanceTo(new THREE.Vector3(0, -0.5, 0));
    
    let targetColor = color1;
    if (d < 4.5 && d >= 2.0) {
      targetColor = color1.clone().lerp(color2, (4.5 - d) / 2.5);
    } else if (d < 2.0 && d >= 1.2) {
      targetColor = color2.clone().lerp(color3, (2.0 - d) / 0.8);
    } else if (d < 1.2) {
      targetColor = color3.clone().lerp(color4, Math.min((1.2 - d) / 1.0, 1));
    }
    
    lightRef.current.color.copy(targetColor);
    lightRef.current.intensity = d < 2.0 && d >= 1.2 ? 0.2 : 1.5;
  });
  
  return <pointLight ref={lightRef} position={[-10, -10, -10]} intensity={1.5} color="#22d3ee" />;
};

const AtomNode = ({ position, color, isCenter, nucleusData }: { position: [number, number, number], color: string, isCenter: boolean, nucleusData: any }) => {
  const outerGlassRef = useRef<THREE.Mesh>(null);
  const outerCoreRef = useRef<THREE.Mesh>(null);
  const innerOrbitalsRef = useRef<THREE.Group>(null);
  const nucleusGroupRef = useRef<THREE.Group>(null);
  const vec = useMemo(() => new THREE.Vector3(...position), [position]);
  
  useFrame((state) => {
    const d = state.camera.position.distanceTo(vec);
    
    const layer1Opacity = THREE.MathUtils.clamp((d - 4.5) / 1.5, 0, 1);
    let layer2Opacity = 0;
    if (d > 2.0 && d < 6.0) layer2Opacity = 1.0 - Math.abs(d - 4.0) / 2.0;
    const layer4Opacity = THREE.MathUtils.clamp(1.0 - (d - 0.2) / 1.0, 0, 1);

    if (outerGlassRef.current) {
      (outerGlassRef.current.material as THREE.Material).opacity = layer1Opacity;
      (outerGlassRef.current.material as THREE.Material).transparent = true;
      (outerGlassRef.current.material as THREE.Material).needsUpdate = true;
    }
    if (outerCoreRef.current) {
      (outerCoreRef.current.material as THREE.Material).opacity = layer1Opacity;
      (outerCoreRef.current.material as THREE.Material).transparent = true;
    }
    
    if (innerOrbitalsRef.current) {
      innerOrbitalsRef.current.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.Material).opacity = Math.max(0, layer2Opacity);
        }
      });
      innerOrbitalsRef.current.rotation.x += 0.02;
      innerOrbitalsRef.current.rotation.y += 0.03;
      innerOrbitalsRef.current.rotation.z += 0.01;
    }
    
    if (nucleusGroupRef.current) {
      if (!isCenter) {
        nucleusGroupRef.current.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.Material).opacity = Math.max(0, layer4Opacity);
          }
        });
      }
      
      if (layer4Opacity > 0 || isCenter) {
        // Unstable isotopes tremble violently!
        const intensity = nucleusData.isDecaying ? 0.02 : 0.005;
        nucleusGroupRef.current.position.x = vec.x + Math.sin(state.clock.elapsedTime * 60) * intensity;
        nucleusGroupRef.current.position.y = vec.y + Math.cos(state.clock.elapsedTime * 67) * intensity;
        nucleusGroupRef.current.position.z = vec.z + Math.sin(state.clock.elapsedTime * 53) * intensity;
      } else {
        nucleusGroupRef.current.position.copy(vec);
      }
    }
  });

  return (
    <group>
      <group position={position}>
        <Sphere ref={outerCoreRef} args={[0.25, 24, 24]}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} roughness={0.2} metalness={0.8} transparent />
        </Sphere>
        <Sphere ref={outerGlassRef} args={[0.4, 24, 24]}>
          <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={1} metalness={0.1} roughness={0.1} ior={1.5} thickness={0.5} transparent />
        </Sphere>
      </group>

      <group ref={innerOrbitalsRef} position={position}>
        <Torus args={[0.15, 0.02, 16, 24]} rotation={[Math.PI/2, 0, 0]}>
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} transparent opacity={0} />
        </Torus>
        <Torus args={[0.15, 0.02, 16, 24]} rotation={[0, Math.PI/2, 0]}>
          <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={2} transparent opacity={0} />
        </Torus>
        <Sphere args={[0.08, 12, 12]}>
          <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={1} transparent opacity={0} />
        </Sphere>
      </group>

      <group ref={nucleusGroupRef} position={position}>
        {isCenter ? (
          <DetailedNucleusCluster protons={nucleusData.protons} neutrons={nucleusData.neutrons} isDecaying={nucleusData.isDecaying} />
        ) : (
          <NucleusCluster color={color} />
        )}
      </group>
    </group>
  );
};

const ConductionElectrons = ({ bonds, isMetal }: { bonds: [THREE.Vector3, THREE.Vector3][], isMetal: boolean }) => {
  const electronsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!isMetal || !electronsRef.current) return;
    const t = state.clock.elapsedTime * 2.0;
    
    electronsRef.current.children.forEach((electron, i) => {
      const bond = bonds[i % bonds.length];
      const progress = (Math.sin(t + i * 1.5) + 1) / 2; 
      electron.position.lerpVectors(bond[0], bond[1], progress);
    });
  });

  if (!isMetal) return null;

  return (
    <group ref={electronsRef}>
      {bonds.map((_, i) => (
        <Sphere key={`electron-${i}`} args={[0.04, 8, 8]} position={[0,0,0]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </Sphere>
      ))}
    </group>
  );
};

const LatticeAtoms = ({ elementData, setLatticeType, nucleusData }: { elementData: any, setLatticeType: (type: string) => void, nucleusData: any }) => {
  const atomicNumber = elementData.atomicNumber;
  let latticeType = 'Simple Cubic';
  let bondThreshold = 3.1;
  const isMetal = [3, 11, 19, 37, 55, 29, 47, 79, 28, 46, 78, 13, 82, 22, 40, 72, 27, 30, 48].includes(atomicNumber);
  
  if ([3, 11, 19, 37, 55, 23, 41, 73, 24, 42, 74].includes(atomicNumber)) { latticeType = 'BCC'; bondThreshold = 3.1; }
  else if ([28, 46, 78, 29, 47, 79, 13, 82].includes(atomicNumber)) { latticeType = 'FCC'; bondThreshold = 3.1; }
  else if ([6, 14, 32].includes(atomicNumber)) { latticeType = 'Diamond'; bondThreshold = 1.5; }
  else if ([4, 12, 20, 38, 21, 39, 22, 40, 72, 27, 30, 48].includes(atomicNumber)) { latticeType = 'HCP'; bondThreshold = 3.1; }

  useMemo(() => {
    setLatticeType(latticeType);
  }, [latticeType, setLatticeType]);

  const { uniquePositions, bonds } = useMemo(() => {
    const pos: [number, number, number][] = [];
    const scale = 3;
    const size = 1; 
    
    if (latticeType === 'BCC') {
      for (let x = -size; x <= size; x++) {
        for (let y = -size; y <= size; y++) {
          for (let z = -size; z <= size; z++) {
            pos.push([x * scale, y * scale, z * scale]);
            if (x < size && y < size && z < size) {
              pos.push([(x + 0.5) * scale, (y + 0.5) * scale, (z + 0.5) * scale]);
            }
          }
        }
      }
    } else if (latticeType === 'FCC') {
      for (let x = -size; x <= size; x++) {
        for (let y = -size; y <= size; y++) {
          for (let z = -size; z <= size; z++) {
            pos.push([x * scale, y * scale, z * scale]);
            if (x < size && y < size) pos.push([(x + 0.5) * scale, (y + 0.5) * scale, z * scale]);
            if (y < size && z < size) pos.push([x * scale, (y + 0.5) * scale, (z + 0.5) * scale]);
            if (x < size && z < size) pos.push([(x + 0.5) * scale, y * scale, (z + 0.5) * scale]);
          }
        }
      }
    } else if (latticeType === 'Diamond') {
      for (let x = -size; x < size; x++) {
        for (let y = -size; y < size; y++) {
          for (let z = -size; z < size; z++) {
            pos.push([x * scale, y * scale, z * scale]);
            pos.push([(x + 0.5) * scale, (y + 0.5) * scale, z * scale]);
            pos.push([x * scale, (y + 0.5) * scale, (z + 0.5) * scale]);
            pos.push([(x + 0.5) * scale, y * scale, (z + 0.5) * scale]);
            pos.push([(x + 0.25) * scale, (y + 0.25) * scale, (z + 0.25) * scale]);
            pos.push([(x + 0.75) * scale, (y + 0.75) * scale, (z + 0.25) * scale]);
            pos.push([(x + 0.25) * scale, (y + 0.75) * scale, (z + 0.75) * scale]);
            pos.push([(x + 0.75) * scale, (y + 0.25) * scale, (z + 0.75) * scale]);
          }
        }
      }
    } else {
      bondThreshold = 3.1;
      for (let x = -size; x <= size; x++) {
        for (let y = -size; y <= size; y++) {
          for (let z = -size; z <= size; z++) {
            pos.push([x * scale, y * scale, z * scale]);
          }
        }
      }
    }
    
    const map = new Map();
    pos.forEach(p => {
      const key = `${Math.round(p[0]*100)},${Math.round(p[1]*100)},${Math.round(p[2]*100)}`;
      map.set(key, p);
    });
    const unique = Array.from(map.values()) as [number, number, number][];

    const computedBonds: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const dx = unique[i][0] - unique[j][0];
        const dy = unique[i][1] - unique[j][1];
        const dz = unique[i][2] - unique[j][2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist > 0.1 && dist <= bondThreshold) {
          computedBonds.push([
            new THREE.Vector3(...unique[i]),
            new THREE.Vector3(...unique[j])
          ]);
        }
      }
    }

    return { uniquePositions: unique, bonds: computedBonds };
  }, [latticeType]);

  const color = '#22d3ee';

  return (
    <group position={[0, -0.5, 0]}>
      <Box args={[6, 6, 6]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.03} />
      </Box>

      {bonds.map((bond, i) => (
        <Line 
          key={`bond-${i}`} 
          points={[bond[0], bond[1]]} 
          color={color} 
          opacity={0.3} 
          transparent 
          lineWidth={2} 
        />
      ))}

      <ConductionElectrons bonds={bonds} isMetal={isMetal} />

      {uniquePositions.map((pos, i) => (
        <AtomNode 
           key={`atom-${i}`} 
           position={pos} 
           color={color} 
           isCenter={pos[0] === 0 && pos[1] === 0 && pos[2] === 0}
           nucleusData={nucleusData}
        />
      ))}
    </group>
  );
};

export const CrystalLatticeModel = ({ elementData }: { elementData: any }) => {
  const [latticeType, setLatticeType] = useState('Unknown');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#050505' }}>
      
      {/* Premium UI Overlay */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ 
          background: 'rgba(20, 20, 20, 0.7)', 
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '16px 24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            Crystal Structure
          </div>
          <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            {latticeType}
            <div style={{ padding: '4px 10px', background: 'rgba(34, 211, 238, 0.2)', color: '#22d3ee', borderRadius: '8px', fontSize: '0.8rem' }}>
              {elementData.symbol}
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px', maxWidth: '280px', lineHeight: '1.4' }}>
            Scroll to zoom deep into the atom and explore the 5 layers: Outer Orbitals, Inner Shells, The Void, Nucleus, and Subatomic Quarks.
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0 }}>
        {/* camera near=0.001 allows zooming inside a proton to see quarks */}
        <Canvas dpr={[1, 1.5]} performance={{ min: 0.5 }} camera={{ position: [8, 6, 12], fov: 45, near: 0.001, far: 1000 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 15, 10]} intensity={1.5} color="#ffffff" />
          <DynamicLighting />
          <spotLight position={[0, -10, 0]} intensity={2} color="#ffffff" distance={20} angle={0.5} penumbra={1} />
          
          <LatticeAtoms elementData={elementData} setLatticeType={setLatticeType} nucleusData={{ protons: elementData.atomicNumber, neutrons: Math.round(elementData.atomicMass || elementData.atomicNumber*2) - elementData.atomicNumber, isDecaying: false }} />
          
          <OrbitControls 
            autoRotate 
            autoRotateSpeed={0.8} 
            enablePan={false} 
            enableZoom={true} 
            minDistance={0.01} // Extreme subatomic zoom
            maxDistance={30}
            target={[0, -0.5, 0]} 
          />
        </Canvas>
      </div>
    </div>
  );
};



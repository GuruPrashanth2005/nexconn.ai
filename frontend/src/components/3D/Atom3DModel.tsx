import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';
import elementsNewData from '../../data/elements_new.json';
import { Layers } from 'lucide-react';
import { OrbitalCloud } from './OrbitalCloud';

interface Atom3DModelProps {
  atomicNumber: number;
  symbol: string;
  neutronOverride?: number;
  selectedShell?: number | null;
}

const SUBSHELL_COLORS: Record<string, string> = {
  's': '#ef4444', // Red
  'p': '#3b82f6', // Blue
  'd': '#eab308', // Yellow
  'f': '#a855f7', // Purple
};

const formatConfig = (config: string) => {
  const superMap: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return config.replace(/([spdf])(\d+)/g, (_match, p1, p2) => {
    return p1 + p2.split('').map((c: string) => superMap[c]).join('');
  });
};

// --- LAYER 5 (Subatomic) ---
const GluonField = ({ opacity }: { opacity: number }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current && opacity > 0) {
      ref.current.rotation.x += 0.05;
      ref.current.rotation.y += 0.08;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 15) * 0.1;
      ref.current.scale.set(scale, scale, scale);
    }
  });
  
  return (
    <group ref={ref}>
      <Sphere args={[0.18, 12, 12]}>
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} transparent opacity={opacity * 0.4} wireframe />
      </Sphere>
    </group>
  );
};

const AdvancedNucleon = ({ isProton, position, isDecayingParticle }: { isProton: boolean, position: [number, number, number], isDecayingParticle: boolean }) => {
  const outerRef = useRef<THREE.Mesh>(null);
  const quarksRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const basePos = useMemo(() => new THREE.Vector3(...position), [position]);

  const color = isProton ? '#ef4444' : '#64748b';
  const quarks = useMemo(() => {
    if (isProton) return [{ pos: [0.08, 0.08, 0], color: '#ef4444' }, { pos: [-0.08, 0.08, 0], color: '#ef4444' }, { pos: [0, -0.08, 0], color: '#3b82f6' }];
    return [{ pos: [0.08, 0.08, 0], color: '#3b82f6' }, { pos: [-0.08, 0.08, 0], color: '#3b82f6' }, { pos: [0, -0.08, 0], color: '#ef4444' }];
  }, [isProton]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Decay animation: if this particle is decaying, fly outwards
    if (isDecayingParticle) {
       groupRef.current.position.y += 0.05; // Fly upwards/outwards
       groupRef.current.position.x += (Math.random() - 0.5) * 0.05;
    } else {
       groupRef.current.position.copy(basePos);
    }
    
    const worldPos = new THREE.Vector3().copy(groupRef.current.position);
    const d = state.camera.position.distanceTo(worldPos);
    
    // Fade into quarks when camera is extremely close (d < 1.0)
    // The Atom3DModel is larger than CrystalLatticeModel, so we adjust distances.
    const outerOpacity = THREE.MathUtils.clamp((d - 0.5) / 0.5, 0, 1);
    const innerOpacity = THREE.MathUtils.clamp(1 - (d - 1.0) / 0.8, 0, 1);
    
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
      <Sphere ref={outerRef} args={[0.22, 12, 12]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} metalness={0.3} transparent opacity={1} />
      </Sphere>
      <group ref={quarksRef}>
        <GluonField opacity={1} />
        {quarks.map((q, i) => (
          <Sphere key={i} position={q.pos as [number, number, number]} args={[0.06, 12, 12]}>
            <meshStandardMaterial color={q.color} emissive={q.color} emissiveIntensity={2} transparent opacity={0} />
          </Sphere>
        ))}
      </group>
    </group>
  );
};

const Nucleus = ({ atomicNumber, atomicMass, neutronOverride, isDecaying }: { atomicNumber: number, atomicMass: number, neutronOverride?: number, isDecaying: boolean }) => {
  const nucleons = useMemo(() => {
    const protons = atomicNumber;
    const neutrons = neutronOverride !== undefined ? neutronOverride : Math.round(atomicMass) - atomicNumber;
    const total = protons + neutrons;
    
    // Generate Face-Centered Cubic (FCC) lattice for perfect dense packing
    const points = [];
    const gridLimit = Math.ceil(Math.pow(total * 2, 1/3)) + 1;
    
    for (let i = -gridLimit; i <= gridLimit; i++) {
      for (let j = -gridLimit; j <= gridLimit; j++) {
        for (let k = -gridLimit; k <= gridLimit; k++) {
          if ((i + j + k) % 2 === 0) {
            points.push({ x: i, y: j, z: k, d: i * i + j * j + k * k });
          }
        }
      }
    }
    
    points.sort((a, b) => a.d - b.d);
    const selectedPoints = points.slice(0, total);
    
    const scale = 0.29; 
    const protonRatio = protons / total;
    const phi = 1.61803398875; 

    return selectedPoints.map((pt, i) => {
      const isProton = ((i * phi) % 1) < protonRatio;
      const isDecayingParticle = isDecaying && (i === total - 1 || i === total - 2); // Eject last few particles

      return (
        <AdvancedNucleon 
          key={i} 
          isProton={isProton} 
          position={[pt.x * scale, pt.y * scale, pt.z * scale]} 
          isDecayingParticle={isDecayingParticle} 
        />
      );
    });
  }, [atomicNumber, atomicMass, neutronOverride, isDecaying]);

  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
     if (groupRef.current && isDecaying) {
        // Tremble violently
        groupRef.current.position.x = (Math.random() - 0.5) * 0.2;
        groupRef.current.position.y = (Math.random() - 0.5) * 0.2;
        groupRef.current.position.z = (Math.random() - 0.5) * 0.2;
     } else if (groupRef.current) {
        groupRef.current.position.set(0,0,0);
     }
  });

  return (
    <group ref={groupRef}>
      <pointLight distance={10} intensity={isDecaying ? 5 : 2} color={isDecaying ? "#ff3366" : "#ffffff"} />
      {nucleons}
    </group>
  );
};

const ElectronShell = ({ baseRadius, subshells, isExpanded, activeOrbital, onSelect, n }: { baseRadius: number, subshells: { l: string; count: number }[], isExpanded: boolean, activeOrbital: string | null, onSelect: (key: string | null) => void, n: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredSubshell, setHoveredSubshell] = useState<string | null>(null);

  useFrame(() => {
    if (groupRef.current) {
      // Realistic spin: Inner shells rotate faster, outer shells slower.
      const speed = 0.02 / n;
      groupRef.current.rotation.z -= speed;
    }
  });

  const totalElectrons = subshells.reduce((acc, sub) => acc + sub.count, 0);
  const gap = subshells.length > 1 ? 0.15 : 0; // Gap between segments in radians

  // Calculate segment arcs and starting angles
  const segments: { l: string, count: number, arcLength: number, startAngle: number }[] = [];
  let currentAngle = 0;
  for (const sub of subshells) {
    const fraction = sub.count / totalElectrons;
    let arcLength = fraction * (Math.PI * 2);
    
    if (subshells.length > 1) {
      arcLength -= gap;
    }
    
    const startAngle = currentAngle;
    currentAngle += arcLength + gap;
    
    segments.push({ ...sub, arcLength, startAngle });
  }

  return (
    <group ref={groupRef}>
      {/* Continuous thin base track */}
      <Torus args={[baseRadius, 0.01, 8, 100]}>
        <meshBasicMaterial color="rgba(255, 255, 255, 0.2)" transparent opacity={0.3} />
      </Torus>

      {segments.map((segment, idx: number) => {
        const color = SUBSHELL_COLORS[segment.l] || '#ffffff';
        const subKey = `${n}${segment.l}`;
        const isDimmed = activeOrbital !== null && activeOrbital !== subKey;
        const isHovered = hoveredSubshell === subKey;
        const ringOpacity = isDimmed ? 0.05 : (isHovered ? 0.6 : 0.3);
        const ringEmissive = isDimmed ? 0.1 : (isHovered ? 0.8 : 0.5);
        const eIntensity = isDimmed ? 0.1 : (isHovered ? 1.5 : 0.8);
        
        return (
          <group key={idx} rotation={[0, 0, segment.startAngle]}>
            {isExpanded && (
              <Torus 
                args={[baseRadius, 0.12, 16, 64, segment.arcLength]}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onSelect(activeOrbital === subKey ? null : subKey); 
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                  setHoveredSubshell(subKey);
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'default';
                  setHoveredSubshell(null);
                }}
              >
                <meshStandardMaterial color={color} transparent opacity={ringOpacity} emissive={color} emissiveIntensity={ringEmissive} />
              </Torus>
            )}
            
            {Array.from({ length: segment.count }).map((_, eIdx) => {
              const eAngle = segment.count === 1
                ? segment.arcLength / 2
                : 0.1 + (eIdx / (segment.count - 1)) * Math.max(0, segment.arcLength - 0.2);

              return (
                <Sphere 
                  key={eIdx} 
                  args={[0.2, 12, 12]} 
                  position={[Math.cos(eAngle) * baseRadius, Math.sin(eAngle) * baseRadius, 0]}
                >
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={eIntensity} transparent opacity={isDimmed ? 0.2 : 1} />
                </Sphere>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

export const Atom3DModel: React.FC<Atom3DModelProps> = ({ atomicNumber, neutronOverride, selectedShell }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeOrbital, setActiveOrbital] = useState<string | null>(null);
  
  const [isDecaying, setIsDecaying] = useState(false);

  const elementData = useMemo(() => {
    return elementsNewData.elements.find((e: { number: number }) => e.number === atomicNumber);
  }, [atomicNumber]);

  const atomicMass = elementData?.atomic_mass || atomicNumber * 2;
  const standardNeutrons = Math.round(atomicMass) - atomicNumber;
  const currentNeutrons = neutronOverride !== undefined ? neutronOverride : standardNeutrons;
  
  // Decay logic
  useEffect(() => {
    const isStable = Math.abs(currentNeutrons - standardNeutrons) <= 1;
    if (!isStable) {
      const timer = setTimeout(() => {
        setIsDecaying(true);
        // Turn off decay after 2 seconds
        setTimeout(() => setIsDecaying(false), 2000);
      }, 4000); // 4 seconds before decay happens
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setIsDecaying(false), 0);
    }
  }, [currentNeutrons, standardNeutrons]);

  const { shellGroups, configFull, allSubshells, configSemantic } = useMemo(() => {
    if (!elementData || !elementData.electron_configuration) {
       return { shellGroups: [], allSubshells: [], configFull: '', configSemantic: '' };
    }

    const config = elementData.electron_configuration;
    const parts = config.split(' ');
    let parsed = parts.map((p: string) => {
      const match = p.match(/^(\d+)([spdf])(\d+)$/);
      if (match) return { n: parseInt(match[1]), l: match[2], count: parseInt(match[3]) };
      return null;
    }) as { n: number; l: string; count: number }[];
    parsed = parsed.filter(Boolean);

    const groups: Record<number, { n: number; l: string; count: number }[]> = {};
    parsed.forEach((p: { n: number; l: string; count: number }) => {
      if (!groups[p.n]) groups[p.n] = [];
      groups[p.n].push(p);
    });

    const shellGroups = Object.keys(groups).sort().map((nStr) => {
      const n = parseInt(nStr);
      const subshells = groups[n];
      return { n, subshells };
    });

    return { 
      shellGroups, 
      allSubshells: parsed,
      configFull: config,
      configSemantic: elementData.electron_configuration_semantic
    };
  }, [elementData]);


  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 10 }}>
        <button 
          onClick={() => {
            setIsExpanded(!isExpanded);
            setActiveOrbital(null);
          }}
          style={{ 
            background: isExpanded ? '#fff' : 'rgba(0,0,0,0.5)', 
            color: isExpanded ? '#000' : '#fff',
            border: '1px solid rgba(255,255,255,0.2)', 
            borderRadius: '50%', width: '40px', height: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            backdropFilter: 'blur(4px)', transition: 'all 0.2s'
          }}
          title="Toggle 3D Orbitals"
        >
          <Layers size={20} />
        </button>
      </div>

      {configFull && (
        <div style={{ 
          position: 'absolute', top: '50%', right: '24px', transform: 'translateY(-50%)', zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', pointerEvents: 'none'
        }}>
          {(() => {
            const activeType = activeOrbital ? activeOrbital.match(/^[1-7]([spdf])/)?.[1] : null;

            if (!activeType && configSemantic) {
              return configSemantic.split(' ').map((part: string, index: number) => {
                const isCore = part.startsWith('[');
                return (
                  <div key={index} style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                    userSelect: 'none'
                  }}>
                    {isCore ? part : formatConfig(part)}
                  </div>
                );
              });
            }

            return allSubshells
              .filter((sub: { n: number; l: string; count: number }) => sub.l === activeType)
              .map((sub: { n: number; l: string; count: number }, index: number) => {
                const part = `${sub.n}${sub.l}${sub.count}`;
                const key = `${sub.n}${sub.l}`;
                const isMatch = activeOrbital === key;
                const highlightColor = SUBSHELL_COLORS[sub.l] || '#000';
                
                return (
                  <div key={index} style={{
                    color: isMatch ? highlightColor : 'rgba(255, 255, 255, 0.7)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: isMatch ? `1px solid ${highlightColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    opacity: activeOrbital ? (isMatch ? 1 : 0.5) : 1,
                    transition: 'all 0.2s',
                    boxShadow: isMatch ? `0 0 12px ${highlightColor}, inset 0 0 8px ${highlightColor}40` : '0 4px 6px rgba(0,0,0,0.2)',
                    textShadow: isMatch ? `0 0 8px ${highlightColor}` : 'none',
                    userSelect: 'none'
                  }}>
                    {formatConfig(part)}
                  </div>
                );
              });
          })()}
        </div>
      )}

      <Canvas dpr={[1, 1.5]} performance={{ min: 0.5 }} camera={{ position: [0, 15, 20], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        
        <Nucleus atomicNumber={atomicNumber} atomicMass={atomicMass} neutronOverride={neutronOverride} isDecaying={isDecaying} />
        
        {selectedShell !== undefined && selectedShell !== null ? (
          (() => {
            const group = shellGroups.find(g => g.n === selectedShell + 1);
            if (group) {
              const radius = 2.5 + selectedShell * 2.5; 
              return <OrbitalCloud n={group.n} subshells={group.subshells} scale={radius * 1.5} />;
            }
            return null;
          })()
        ) : (
          shellGroups.map((group, idx) => {
            const radius = 2.5 + idx * 2.5; // Base radius for principal shell
            return (
              <group key={idx} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
                 <ElectronShell baseRadius={radius} subshells={group.subshells} isExpanded={isExpanded} activeOrbital={activeOrbital} onSelect={setActiveOrbital} n={group.n} />
              </group>
            );
          })
        )}
        
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={0.01} maxDistance={100} />
      </Canvas>
    </div>
  );
};



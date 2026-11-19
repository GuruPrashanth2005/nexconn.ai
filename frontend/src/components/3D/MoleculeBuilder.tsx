/* eslint-disable */
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Cylinder, Text, Billboard, Float, MeshWobbleMaterial, QuadraticBezierLine } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AtomicStructure } from './AtomicStructure';
import elementsData from '../../data/elements_new.json';
import { logActivity } from '../../services/analyticsService';

export interface AtomNode {
  id: string;
  symbol: string;
  position: [number, number, number];
  color: string;
  radius: number;
}

export interface BondEdge {
  id: string;
  sourceId: string;
  targetId: string;
  order?: number;
}

export interface LooseAtom {
  id: string;
  symbol: string;
  color: string;
  radius: number;
}

interface MoleculeBuilderProps {
  looseAtoms: LooseAtom[];
  isReacting: boolean;
  compoundAtoms?: AtomNode[];
  compoundBonds?: BondEdge[];
  isRotationPaused?: boolean;
  showInternalStructure?: boolean;
  showElectronCloud?: boolean;
  replayMechanismKey?: number;
}

// Bouncing Loose Atom
const PhysicalAtom = ({ node, index, showInternalStructure, showElectronCloud }: { node: LooseAtom, index: number, showInternalStructure?: boolean, showElectronCloud?: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<any>(null);
  const [opacity, setOpacity] = React.useState(1);
  const element = elementsData.elements.find(e => e.symbol === node.symbol);

  // Spawn slightly randomized position so they don't spawn inside each other
  const [initialPosition] = React.useState<[number, number, number]>(() => [
    (Math.random() - 0.5) * 4,
    4 + (index * 1.5),
    (Math.random() - 0.5) * 4
  ]);

  useFrame((state) => {
    if (meshRef.current) {
      const worldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPos);
      const dist = state.camera.position.distanceTo(worldPos);

      const fadeStart = node.radius * 7.0;
      const fadeEnd = node.radius * 2.5;
      
      let newOpacity = 1;
      let newTransmission = 0.1;
      
      if (showInternalStructure) {
        newOpacity = 0.1;
        newTransmission = 1.0;
      } else {
        if (dist < fadeEnd) newOpacity = 0;
        else if (dist > fadeStart) newOpacity = 1;
        else newOpacity = (dist - fadeEnd) / (fadeStart - fadeEnd);
        newTransmission = 0.1;
      }

      if (meshRef.current.material instanceof THREE.MeshPhysicalMaterial) {
        meshRef.current.material.opacity = newOpacity;
        meshRef.current.material.transparent = newOpacity < 1 || newTransmission > 0;
        meshRef.current.material.transmission = newTransmission;
        meshRef.current.material.roughness = showInternalStructure ? 0.0 : 0.1;
        meshRef.current.material.thickness = showInternalStructure ? 0.05 : 0.5;
      }
      
      if (textRef.current) {
         textRef.current.fillOpacity = newOpacity;
         textRef.current.strokeOpacity = newOpacity;
      }

      if ((newOpacity < 1 && opacity === 1) || (newOpacity === 1 && opacity < 1)) {
        setOpacity(newOpacity);
      }
    }
  });

  return (
    <RigidBody position={initialPosition as [number, number, number]} colliders="ball" restitution={0.8} friction={0.2}>
      <Sphere ref={meshRef} args={[node.radius, 24, 24]}>
        <meshPhysicalMaterial 
          color={node.color} 
          metalness={0.6} 
          roughness={0.05}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          transmission={0.2}
          thickness={0.5}
          transparent={true}
          envMapIntensity={2.0}
        />
      </Sphere>
      <Billboard>
        <Text
          ref={textRef}
          fontSize={node.radius * 0.8}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
          depthOffset={-1}
        >
          {node.symbol}
        </Text>
      </Billboard>
      {(showInternalStructure || opacity < 1) && element && (
         <AtomicStructure elementData={element} radius={node.radius} />
      )}
      
      {/* Electron Cloud / Orbital Surface */}
      {showElectronCloud && (
        <Sphere args={[node.radius * 2.2, 24, 24]}>
          <MeshWobbleMaterial
            color="cyan"
            emissive="cyan"
            emissiveIntensity={0.5}
            transparent={true}
            opacity={0.15}
            roughness={0}
            metalness={0.1}
            factor={0.5} // Wobble factor
            speed={2}    // Wobble speed
          />
        </Sphere>
      )}
    </RigidBody>
  );
};

// Static/Floating Atom for Final Molecule
const Atom = ({ node, showInternalStructure, showElectronCloud }: { node: AtomNode, showInternalStructure?: boolean, showElectronCloud?: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<any>(null);
  const [opacity, setOpacity] = React.useState(1);
  const element = elementsData.elements.find(e => e.symbol === node.symbol);

  useFrame((state) => {
    if (meshRef.current) {
      // Get distance from camera to this atom in world space
      const worldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPos);
      const dist = state.camera.position.distanceTo(worldPos);

      // Fade out outer shell when getting close
      const fadeStart = node.radius * 7.0;
      const fadeEnd = node.radius * 2.5;
      
      let newOpacity = 1;
      let newTransmission = 0.1;
      
      if (showInternalStructure) {
        newOpacity = 0.1;
        newTransmission = 1.0;
      } else {
        if (dist < fadeEnd) newOpacity = 0;
        else if (dist > fadeStart) newOpacity = 1;
        else newOpacity = (dist - fadeEnd) / (fadeStart - fadeEnd);
        newTransmission = 0.1;
      }

      if (meshRef.current.material instanceof THREE.MeshPhysicalMaterial) {
        meshRef.current.material.opacity = newOpacity;
        meshRef.current.material.transparent = newOpacity < 1 || newTransmission > 0;
        meshRef.current.material.transmission = newTransmission;
        meshRef.current.material.roughness = showInternalStructure ? 0.0 : 0.1;
        meshRef.current.material.thickness = showInternalStructure ? 0.05 : 0.5;
      }
      
      if (textRef.current) {
         textRef.current.fillOpacity = newOpacity;
         textRef.current.strokeOpacity = newOpacity;
      }

      // Only trigger re-render for showing/hiding AtomicStructure if crossing threshold
      // To optimize, we just set state when crossing the threshold of being fully opaque vs somewhat transparent
      if ((newOpacity < 1 && opacity === 1) || (newOpacity === 1 && opacity < 1)) {
        setOpacity(newOpacity);
      }
    }
  });

  return (
    <group position={node.position}>
      <Sphere ref={meshRef} args={[node.radius, 24, 24]}>
        <meshPhysicalMaterial 
          color={node.color} 
          metalness={0.6} 
          roughness={0.05}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          transmission={0.2}
          thickness={0.5}
          transparent={true}
          envMapIntensity={2.0}
        />
      </Sphere>
      <Billboard>
        <Text
          ref={textRef}
          fontSize={node.radius * 0.8}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
          depthOffset={-1}
        >
          {node.symbol}
        </Text>
      </Billboard>

      {/* Render internal atomic structure if we are zoomed in enough to see it or x-ray is on */}
      {(showInternalStructure || opacity < 1) && element && (
         <AtomicStructure elementData={element} radius={node.radius} />
      )}

      {/* Electron Cloud / Orbital Surface */}
      {showElectronCloud && (
        <Sphere args={[node.radius * 2.2, 24, 24]}>
          <MeshWobbleMaterial
            color="cyan"
            emissive="cyan"
            emissiveIntensity={0.5}
            transparent={true}
            opacity={0.15}
            roughness={0}
            metalness={0.1}
            factor={0.5} // Wobble factor
            speed={2}    // Wobble speed
          />
        </Sphere>
      )}
    </group>
  );
};

const Bond = ({ source, target, order = 1 }: { source: AtomNode; target: AtomNode, order?: number }) => {
  const start = new THREE.Vector3(...source.position);
  const end = new THREE.Vector3(...target.position);
  const distance = start.distanceTo(end);
  const position = start.clone().lerp(end, 0.5);
  
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const direction = end.clone().sub(start).normalize();
  quaternion.setFromUnitVectors(up, direction);

  const getOffsets = () => {
    if (order === 2) return [-0.15, 0.15];
    if (order === 3) return [-0.25, 0, 0.25];
    return [0];
  };

  return (
    <group position={position.toArray()} quaternion={quaternion}>
      {getOffsets().map((offset, i) => (
        <Cylinder key={i} args={[0.08, 0.08, distance, 16]} position={[offset, 0, 0]}>
          <meshPhysicalMaterial 
            color="#ffffff" 
            emissive="#ffffff"
            emissiveIntensity={0.2}
            metalness={0.8} 
            roughness={0.05} 
            clearcoat={1.0}
            envMapIntensity={2.0}
          />
        </Cylinder>
      ))}
    </group>
  );
};

const AutoRotateGroup: React.FC<{ children: React.ReactNode, isPaused?: boolean }> = ({ children, isPaused }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current && !isPaused) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.x += 0.002;
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

const MechanismArrow = ({ start, end, onComplete }: { start: THREE.Vector3, end: THREE.Vector3, onComplete: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<any>(null);
  const [progress, setProgress] = React.useState(0);

  // Calculate mid point for curve
  const mid = React.useMemo(() => {
    const m = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    // Add some random offset perpendicular to the line for a nice curve
    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    let perp = new THREE.Vector3().crossVectors(dir, up);
    if (perp.lengthSq() < 0.01) perp = new THREE.Vector3(1, 0, 0); // parallel fallback
    perp.normalize().multiplyScalar(1.5); // curve height
    m.add(perp);
    return m;
  }, [start, end]);

  useFrame((_state, delta) => {
    const speed = 2.5;
    const newProgress = Math.min(1, progress + delta * speed);
    setProgress(newProgress);
    
    if (meshRef.current) {
      const t = newProgress;
      const x = (1-t)*(1-t)*start.x + 2*(1-t)*t*mid.x + t*t*end.x;
      const y = (1-t)*(1-t)*start.y + 2*(1-t)*t*mid.y + t*t*end.y;
      const z = (1-t)*(1-t)*start.z + 2*(1-t)*t*mid.z + t*t*end.z;
      meshRef.current.position.set(x, y, z);
    }
    
    if (newProgress >= 1 && progress < 1) {
       onComplete();
    }
  });

  return (
    <group>
      <QuadraticBezierLine
        ref={lineRef}
        start={start}
        end={end}
        mid={mid}
        color="cyan"
        lineWidth={2.5}
        transparent
        opacity={0.4}
      />
      <Sphere ref={meshRef} args={[0.1, 16, 16]}>
        <meshBasicMaterial color="#00ffff" />
        <Sphere args={[0.25, 16, 16]}>
          <meshBasicMaterial color="#00ffff" transparent opacity={0.3} depthWrite={false} />
        </Sphere>
      </Sphere>
    </group>
  );
};


export const MoleculeBuilder: React.FC<MoleculeBuilderProps> = ({ 
  looseAtoms, 
  isReacting, 
  compoundAtoms, 
  compoundBonds,
  isRotationPaused = false,
  showInternalStructure = false,
  showElectronCloud = false,
  replayMechanismKey = 0
}) => {
  const [visibleBonds, setVisibleBonds] = React.useState<string[]>([]);
  const [activeArrow, setActiveArrow] = React.useState<{bondId: string, sourcePos: THREE.Vector3, targetPos: THREE.Vector3} | null>(null);
  const [arrowQueue, setArrowQueue] = React.useState<BondEdge[]>([]);

  // When isReacting or replayMechanismKey becomes true, initialize the queue
  React.useEffect(() => {
    if (isReacting && compoundBonds && compoundBonds.length > 0) {
      setVisibleBonds([]);
      setActiveArrow(null);
      setArrowQueue([...compoundBonds]);
    } else if (isReacting) {
      setVisibleBonds([]);
      setActiveArrow(null);
    }
  }, [isReacting, compoundBonds, replayMechanismKey]);

  // Process the queue
  React.useEffect(() => {
    if (isReacting && arrowQueue.length > 0 && !activeArrow) {
      const nextBond = arrowQueue[0];
      const source = compoundAtoms?.find(a => a.id === nextBond.sourceId);
      const target = compoundAtoms?.find(a => a.id === nextBond.targetId);
      if (source && target) {
        setActiveArrow({
           bondId: nextBond.id,
           sourcePos: new THREE.Vector3(...source.position),
           targetPos: new THREE.Vector3(...target.position)
        });
      } else {
        setVisibleBonds(prev => [...prev, nextBond.id]);
        setArrowQueue(prev => prev.slice(1));
      }
    }
  }, [isReacting, arrowQueue, activeArrow, compoundAtoms]);

  const handleArrowComplete = React.useCallback(() => {
    if (activeArrow) {
      setVisibleBonds(prev => [...prev, activeArrow.bondId]);
      setActiveArrow(null);
      setArrowQueue(prev => prev.slice(1));
    }
  }, [activeArrow]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
      
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }} dpr={[1, 1.5]} performance={{ min: 0.5 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} />
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.9} intensity={0.5} mipmapBlur />
        </EffectComposer>
        
        {/* If we are not reacting, show the loose atoms bouncing around */}
        {!isReacting ? (
          <Physics gravity={[0, -2, 0]}>
            <CuboidCollider position={[0, -5, 0]} args={[10, 0.5, 10]} />
            <CuboidCollider position={[0, 10, 0]} args={[10, 0.5, 10]} />
            <CuboidCollider position={[-10, 0, 0]} args={[0.5, 10, 10]} />
            <CuboidCollider position={[10, 0, 0]} args={[0.5, 10, 10]} />
            <CuboidCollider position={[0, 0, -10]} args={[10, 10, 0.5]} />
            <CuboidCollider position={[0, 0, 10]} args={[10, 10, 0.5]} />
            
            {looseAtoms.map((node, i) => (
              <PhysicalAtom key={node.id} node={node} index={i} showInternalStructure={showInternalStructure} showElectronCloud={showElectronCloud} />
            ))}
          </Physics>
        ) : (
          // Final Reaction Mode (Static Final Molecule)
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <AutoRotateGroup isPaused={isRotationPaused}>
              {compoundBonds?.map(bond => {
                if (!visibleBonds.includes(bond.id)) return null;
                const source = compoundAtoms?.find(a => a.id === bond.sourceId);
                const target = compoundAtoms?.find(a => a.id === bond.targetId);
                if (!source || !target) return null;
                return <Bond key={bond.id} source={source} target={target} order={bond.order} />;
              })}
              {compoundAtoms?.map(node => (
                <Atom key={node.id} node={node} showInternalStructure={showInternalStructure} showElectronCloud={showElectronCloud} />
              ))}
              {activeArrow && (
                <MechanismArrow 
                  key={`arrow-${activeArrow.bondId}`} 
                  start={activeArrow.sourcePos} 
                  end={activeArrow.targetPos} 
                  onComplete={handleArrowComplete} 
                />
              )}
            </AutoRotateGroup>
          </Float>
        )}
        
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          minDistance={0.5} 
          maxDistance={30} 
          enablePan={false}
          onChange={() => {
            // Log interaction but throttle at the batcher level, or just rely on batcher
            // We'll pass a small duration (e.g. 100ms) to represent active interaction time
            logActivity('INTERACT_3D_MODEL', { action: 'camera_move' }, 'MOLECULE_BUILDER', 100);
          }}
        />
      </Canvas>

      <style>{`
        @keyframes pulse {
          from { opacity: 0.2; }
          to { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

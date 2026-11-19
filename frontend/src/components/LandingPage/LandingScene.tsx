import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, Float, ContactShadows, Environment, Sparkles, Lightformer, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { ParrotModel } from '../ParrotModel';



const MovingLights = () => {
  const lightGroup = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (lightGroup.current) {
      // Rapid cinematic sweeping back and forth
      lightGroup.current.position.z = Math.sin(state.clock.elapsedTime * 1.5) * 10;
      lightGroup.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });
  return (
    <group ref={lightGroup} rotation={[-Math.PI / 4, -0.3, 0]}>
      <Lightformer intensity={8} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[20, 10, 1]} />
      <Lightformer intensity={4} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 2, 1]} />
      <Lightformer intensity={4} rotation-y={Math.PI / 2} position={[5, 1, -1]} scale={[20, 2, 1]} />
      <Lightformer intensity={10} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[40, 2, 1]} />
    </group>
  );
};

const FloatingRings = () => {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1.current) { ring1.current.rotation.x = t * 0.2; ring1.current.rotation.y = t * 0.1; }
    if (ring2.current) { ring2.current.rotation.y = t * 0.15; ring2.current.rotation.z = t * 0.25; }
    if (ring3.current) { ring3.current.rotation.x = -t * 0.1; ring3.current.rotation.z = -t * 0.15; }
  });

  return (
    <group position={[0, -1, -5]}>
      <mesh ref={ring1}>
        <torusGeometry args={[5, 0.02, 16, 100]} />
        <meshPhysicalMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} transparent opacity={0.5} />
      </mesh>
      <mesh ref={ring2} scale={1.2}>
        <torusGeometry args={[5, 0.01, 16, 100]} />
        <meshPhysicalMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2} transparent opacity={0.3} />
      </mesh>
      <mesh ref={ring3} scale={1.5}>
        <torusGeometry args={[5, 0.03, 16, 100]} />
        <meshPhysicalMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

export const LandingScene: React.FC = () => {
  const scroll = useScroll();
  const group = useRef<THREE.Group>(null);
  const backgroundSphere = useRef<THREE.Mesh>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const distortMaterial = useRef<any>(null);
  
  // Materials
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 0.5,
    transparent: true,
  });

  const fluidMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state) => {
    if (!group.current) return;
    
    const offset = scroll.offset;
    
    // Abstract slow rotation
    group.current.rotation.y = offset * Math.PI * 2 + (state.clock.elapsedTime * 0.05);

    // Mouse Tracking Parallax (Noomo style)
    const targetX = (state.pointer.x * Math.PI) / 8;
    const targetY = (state.pointer.y * Math.PI) / 8;
    group.current.rotation.x += 0.05 * (targetY - group.current.rotation.x);
    group.current.rotation.z += 0.05 * (-targetX - group.current.rotation.z);
    
    // Animate the massive distorted background sphere
    if (backgroundSphere.current && distortMaterial.current) {
      backgroundSphere.current.rotation.y = state.clock.elapsedTime * 0.1;
      backgroundSphere.current.rotation.x = state.clock.elapsedTime * 0.05;
      
      // As you scroll deeper into the strict assessment mode, the background distortion gets violent
      distortMaterial.current.distort = 0.2 + (offset * 0.6);
      distortMaterial.current.speed = 1 + (offset * 5);
      
      // Change color based on offset
      if (offset > 0.7) {
        distortMaterial.current.color.lerp(new THREE.Color('#3f0000'), 0.05); // Dark Red
        distortMaterial.current.emissive.lerp(new THREE.Color('#ef4444'), 0.05);
      } else {
        distortMaterial.current.color.lerp(new THREE.Color('#000000'), 0.05); // Pitch Black
        distortMaterial.current.emissive.lerp(new THREE.Color('#06b6d4'), 0.05);
      }
    }

    // Cinematic camera sweep based on scroll (6 pages)
    // 0.0 - Page 1: Hero (Wide Shot)
    // 0.2 - Page 2: Thermodynamics (Close up on Flask)
    // 0.4 - Page 3: AI (Focus on Parrot)
    // 0.6 - Page 4: Analytics (High angle)
    // 0.8 - Page 5: Certification / Strict Focus (Focus on red warning color/abstract angle)
    // 1.0 - Page 6: Ending (Wide Shot)
    
    const targetCameraPos = new THREE.Vector3(0, 0, 10);
    
    if (offset < 0.2) {
      const t = offset / 0.2;
      targetCameraPos.lerpVectors(new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, -1, 5), t);
    } else if (offset < 0.4) {
      const t = (offset - 0.2) / 0.2;
      targetCameraPos.lerpVectors(new THREE.Vector3(0, -1, 5), new THREE.Vector3(2.5, 1.5, 4), t);
    } else if (offset < 0.6) {
      const t = (offset - 0.4) / 0.2;
      targetCameraPos.lerpVectors(new THREE.Vector3(2.5, 1.5, 4), new THREE.Vector3(-2, 3, 6), t);
    } else if (offset < 0.8) {
      const t = (offset - 0.6) / 0.2;
      // Focus on intense, abstract angle for Certification
      targetCameraPos.lerpVectors(new THREE.Vector3(-2, 3, 6), new THREE.Vector3(0, -2, 7), t);
    } else {
      const t = (offset - 0.8) / 0.2;
      targetCameraPos.lerpVectors(new THREE.Vector3(0, -2, 7), new THREE.Vector3(0, 0, 12), t);
    }
    
    state.camera.position.lerp(targetCameraPos, 0.05);
    
    // Camera tracking target with dynamic shake/intensity based on scroll
    const lookTarget = new THREE.Vector3(0, offset * -2, 0);
    if (offset > 0.6 && offset < 0.9) {
      // Add slight jitter for "Strict Mode" intensity
      lookTarget.x += Math.sin(state.clock.elapsedTime * 20) * 0.02;
    }
    state.camera.lookAt(lookTarget);

    // High-Performance Cinematic Dolly Zoom (Vertigo Effect)
    // As we scroll down, we drastically warp the field of view while moving the camera
    let targetFov = 45;
    if (offset > 0.2 && offset < 0.8) {
      // Warp the perspective in the middle sections
      targetFov = 45 + Math.sin((offset - 0.2) * Math.PI * (1 / 0.6)) * 40; 
    }
    const perspectiveCamera = state.camera as THREE.PerspectiveCamera;
    perspectiveCamera.fov = THREE.MathUtils.lerp(perspectiveCamera.fov, targetFov, 0.05);
    perspectiveCamera.updateProjectionMatrix();

    // Pulse the main group scale rhythmically like a heartbeat
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    group.current.scale.set(pulse, pulse, pulse);
    
    // Animate fluid color (Titration Reaction -> Assessment Red)
    if (fluidMaterialRef.current) {
      const targetColor = new THREE.Color();
      if (offset > 0.7) {
        targetColor.setHex(0xef4444); // Strict Mode Red
      } else if (offset > 0.3) {
        targetColor.setHex(0xa855f7); // Endpoint purple
      } else {
        targetColor.setHex(0x06b6d4); // Initial cyan
      }
      fluidMaterialRef.current.color.lerp(targetColor, 0.05);
    }
  });

  return (
    <>
      {/* Cinematic Environment Lighting & Reflections (High Performance) */}
      <Environment resolution={256}>
        <MovingLights />
      </Environment>

      {/* Massive 3D Sci-Fi Orbital Rings */}
      <FloatingRings />

      {/* Massive 3D Liquid Energy Field Backdrop */}
      <mesh ref={backgroundSphere} position={[0, 0, -15]} scale={12}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial 
          ref={distortMaterial}
          color="#000000"
          emissive="#06b6d4"
          emissiveIntensity={0.2}
          roughness={0.1}
          metalness={1}
        />
      </mesh>

      {/* Floating Sparkles in the background */}
      <Sparkles count={150} scale={15} size={2} speed={0.4} opacity={0.3} color="#06b6d4" />
      <Sparkles count={100} scale={15} size={4} speed={0.2} opacity={0.1} color="#a855f7" />

      <group ref={group}>
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
          {/* Burette Tube */}
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 3, 32]} />
            <primitive object={glassMaterial} attach="material" />
          </mesh>
          {/* Burette Tip */}
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.2, 0.05, 0.5, 32]} />
            <primitive object={glassMaterial} attach="material" />
          </mesh>
          {/* Stopcock */}
          <mesh position={[0.2, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
          </mesh>
          
          {/* Conical Flask */}
          <mesh position={[0, -2, 0]}>
            <coneGeometry args={[1.2, 2, 32]} />
            <primitive object={glassMaterial} attach="material" />
          </mesh>
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 1, 32]} />
            <primitive object={glassMaterial} attach="material" />
          </mesh>
          
          {/* Titrant Fluid in Flask */}
          <mesh position={[0, -2.3, 0]}>
            <coneGeometry args={[1.0, 1.4, 32]} />
            <meshPhysicalMaterial 
              ref={fluidMaterialRef}
              color="#06b6d4" 
              transmission={0.5} 
              opacity={0.9} 
              transparent 
            />
          </mesh>

          {/* Falling Drop */}
          <mesh position={[0, -0.8, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshPhysicalMaterial color="#06b6d4" transmission={0.8} transparent />
          </mesh>
        </Float>
      </group>
      
      {/* Floor Shadows */}
      <ContactShadows position={[0, -3.2, 0]} opacity={0.5} scale={10} blur={2} far={4} />

      {/* Realistic Glass Environment (Generated to avoid network issues) */}
      <Environment resolution={256} background={false}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
          <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[5, 1, -1]} scale={[50, 2, 1]} />
          <Lightformer intensity={2} rotation-x={-Math.PI / 2} position={[0, -5, 0]} scale={[10, 10, 1]} />
        </group>
      </Environment>

      {/* 3D Flying Parrot AI Companion */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1} position={[3, 1, 0]}>
        <group rotation={[0, -Math.PI / 4, 0]}>
          <ParrotModel scale={[0.06, 0.06, 0.06]} />
        </group>
      </Float>
    </>
  );
};

export default LandingScene;

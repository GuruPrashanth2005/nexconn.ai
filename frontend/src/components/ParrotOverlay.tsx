import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ParrotModel } from './ParrotModel';

export const ParrotOverlay: React.FC = () => {
  const outerGroup = useRef<THREE.Group>(null);
  const innerGroup = useRef<THREE.Group>(null);
  const { camera, size } = useThree();
  const [targetPos, setTargetPos] = useState(new THREE.Vector3(0, 0, 0));
  const [hasLanded, setHasLanded] = useState(false);
  
  // Physics state for natural flying
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  
  // Flight curve reference
  const flightCurve = useRef<THREE.CatmullRomCurve3 | null>(null);
  
  // Start the parrot off-screen slightly top-center to initiate the first right-sweep
  useEffect(() => {
    if (outerGroup.current) {
      outerGroup.current.position.set(-1, 3, -5);
      velocity.current.set(0.02, 0, 0); // initial velocity moving right
    }
  }, []);

  useFrame((state) => {
    if (!outerGroup.current || !innerGroup.current) return;
    
    const time = state.clock.elapsedTime;
    const currentTarget = new THREE.Vector3();

    // 1. Calculate Landing Position (the "W")
    const wElement = document.getElementById('title-w');
    const landingPos = new THREE.Vector3(0, 0, 0);
    if (wElement) {
      const rect = wElement.getBoundingClientRect();
      const x = ((rect.left + rect.width / 2) / size.width) * 2 - 1;
      const y = -((rect.top - 10) / size.height) * 2 + 1;
      
      const vector = new THREE.Vector3(x, y, 0.5);
      vector.unproject(camera);
      
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z; 
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));
      
      // Offset slightly to sit on top of the W
      pos.y += 0.4;
      pos.x += 0.2;
      pos.z = 0; 
      landingPos.copy(pos);
    }

    // 2. Initialize or Update Flight Curve
    if (!flightCurve.current && landingPos.lengthSq() > 0) {
      // "go right end then u turn downwards left end and sit"
      flightCurve.current = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1, 3, -5),      // Start slightly left of center (high)
        new THREE.Vector3(3.5, 2.5, -3),   // Go to the Right End (high)
        new THREE.Vector3(3.8, -2.0, 1),   // U-Turn DOWNWARDS (deep dive below/across modules, coming forward in Z)
        new THREE.Vector3(-3.5, -0.5, 2),  // Swoop left (low pass across the screen)
        landingPos                         // Final Landing Spot (Sit)
      ]);
      flightCurve.current.tension = 0.8; // High tension for smoother, wider curves
    }

    // Determine flight phase (Changed to exactly 5 seconds)
    if (time < 5.0 && flightCurve.current) {
      // Phase 1: Smoothly move the target along the curve
      const t = time / 5.0; // 0.0 to 1.0
      flightCurve.current.getPoint(t, currentTarget);
    } else {
      // Phase 2: Snap target directly to the landing position
      currentTarget.copy(landingPos);
    }

    setTargetPos(currentTarget);

    const currentPos = outerGroup.current.position;
    const distanceToTarget = currentPos.distanceTo(targetPos);
    
    if (time < 5.0 || distanceToTarget > 0.3) {
      // Flying state
      setHasLanded(false);
      
      // NATURAL STEERING BEHAVIOR
      const maxSpeed = 0.045; // Slightly faster to cover path in 5 seconds
      const maxForce = 0.0015; // Wider, slower turn radius
      
      // Calculate desired velocity
      const desired = targetPos.clone().sub(currentPos);
      const d = desired.length();
      
      // Slow down as we approach the landing target (only if we are landing, phase 2)
      if (time >= 5.0 && d < 2.0) {
        const m = THREE.MathUtils.mapLinear(d, 0, 2.0, 0, maxSpeed);
        desired.setLength(m);
      } else {
        desired.setLength(maxSpeed);
      }
      
      // Calculate steering force (desired - current)
      const steer = desired.clone().sub(velocity.current);
      if (steer.length() > maxForce) {
        steer.setLength(maxForce);
      }
      
      // Apply force to velocity, update position
      velocity.current.add(steer);
      currentPos.add(velocity.current);
      
      // Bob effect
      innerGroup.current.position.y = Math.sin(time * 15) * 0.05;
      
      // Face the direction of flight smoothly
      if (velocity.current.lengthSq() > 0.0001) {
        const targetRotationY = Math.atan2(velocity.current.x, velocity.current.z);
        // Bank (roll) based on horizontal turning
        const targetRotationZ = -velocity.current.x * 5.0; // Bank into turns
        
      // Smoothly interpolate rotations (flying horizontal)
        outerGroup.current.rotation.x = THREE.MathUtils.lerp(outerGroup.current.rotation.x, 0, 0.05);
        outerGroup.current.rotation.y = THREE.MathUtils.lerp(outerGroup.current.rotation.y, targetRotationY, 0.05);
        outerGroup.current.rotation.z = THREE.MathUtils.lerp(outerGroup.current.rotation.z, targetRotationZ, 0.05);
      }
      
    } else {
      // Landed state
      if (!hasLanded) setHasLanded(true);
      
      // Stop moving
      velocity.current.set(0, 0, 0);
      
      // Snap nicely to target
      currentPos.lerp(targetPos, 0.1);
      
      // Keep horizontal
      outerGroup.current.rotation.x = THREE.MathUtils.lerp(outerGroup.current.rotation.x, 0, 0.1);
      
      // Face forward/user slightly (like hovering)
      outerGroup.current.rotation.y = THREE.MathUtils.lerp(outerGroup.current.rotation.y, Math.PI / 8, 0.1);
      
      // Reset roll
      outerGroup.current.rotation.z = THREE.MathUtils.lerp(outerGroup.current.rotation.z, 0, 0.1);
      
      // Subtle idle bob
      innerGroup.current.position.y = Math.sin(time * 2) * 0.01;
    }
  });

  return (
    <group ref={outerGroup}>
      <group ref={innerGroup}>
        {/* Hovering scale */}
        <ParrotModel scale={[0.015, 0.015, 0.015]} />
      </group>
      
      <pointLight position={[0, 2, 2]} intensity={2} color="#06b6d4" />
      <ambientLight intensity={1.5} />
    </group>
  );
};

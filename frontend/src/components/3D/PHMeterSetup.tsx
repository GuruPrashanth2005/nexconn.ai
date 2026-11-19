import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../../state/simulationStore';
import { calculatePHReading, getBufferTrueValue } from '../../logic/phEngine';

// Premium Push Button
const PushButton = ({ position, color, label, onClick }: { position: [number, number, number], color: string, label: string, onClick: () => void }) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); setPressed(false); document.body.style.cursor = 'default'; }}
        onPointerDown={(e) => { e.stopPropagation(); setPressed(true); }}
        onPointerUp={(e) => { e.stopPropagation(); setPressed(false); onClick(); }}
        position={[0, 0, pressed ? -0.01 : 0]}
      >
        <boxGeometry args={[0.12, 0.05, 0.02]} />
        <meshStandardMaterial color={hovered ? '#60a5fa' : color} roughness={0.3} metalness={0.8} />
      </mesh>
      <Text position={[0, -0.05, 0.02]} fontSize={0.03} color="#94a3b8" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
};

// Premium Digital Screen
const DigitalScreen = ({ position, powerOn, reading }: { position: [number, number, number], powerOn: boolean, reading: number | null }) => {
  return (
    <group position={position}>
      {/* Screen Bezel */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[0.7, 0.35, 0.02]} />
        <meshStandardMaterial color="#020617" roughness={0.5} />
      </mesh>
      {/* Screen Display Area */}
      <mesh>
        <boxGeometry args={[0.65, 0.3, 0.01]} />
        <meshStandardMaterial color={powerOn ? '#064e3b' : '#000000'} emissive={powerOn ? '#064e3b' : '#000000'} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>
      {powerOn && (
        <Text position={[0, 0, 0.01]} fontSize={0.15} color="#4ade80" anchorX="center" anchorY="middle">
          {typeof reading === 'number' && !isNaN(reading) ? reading.toFixed(2) : '---'}
        </Text>
      )}
    </group>
  );
};

// Premium Beaker
const PHBeaker = ({ position, label, targetType, color, highlightColor }: { position: [number, number, number], label?: string, targetType: "SAMPLE" | "BUFFER_4" | "BUFFER_7" | "BUFFER_10" | null, color: string, highlightColor: string }) => {
  const { moveElectrode, phElectrodeSubmergedIn } = useSimulationStore();
  const isSelected = phElectrodeSubmergedIn === targetType;
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      {/* Interaction Hitbox & Glass */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (targetType) moveElectrode(targetType);
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
        position={[0, 0.2, 0]}
      >
        <cylinderGeometry args={[0.15, 0.15, 0.4, 24]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          transmission={0.95}
          opacity={1}
          transparent
          roughness={0.05}
          ior={1.5}
          thickness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Liquid */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.3, 24]} />
        <meshPhysicalMaterial 
          color={color}
          transmission={0.8}
          opacity={0.9}
          transparent
          roughness={0.1}
        />
      </mesh>

      {/* Hover/Selected Glow */}
      {(hovered || isSelected) && (
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.42, 24]} />
          <meshBasicMaterial color={highlightColor} transparent opacity={0.2} side={THREE.BackSide} />
        </mesh>
      )}

      {/* Standard UI Tooltip */}
      {label && (
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
    </group>
  );
};

// Premium Wash Bottle
const WashBottle = ({ position }: { position: [number, number, number] }) => {
  const { cleanElectrode, moveElectrode } = useSimulationStore();
  const [isWashing, setIsWashing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const bottleRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Mesh>(null);

  const handleWash = () => {
    if (isWashing) return;
    setIsWashing(true);
    moveElectrode(null); // Move to stand
    setTimeout(() => {
      cleanElectrode();
      setIsWashing(false);
    }, 2000);
  };

  const tissueRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (bottleRef.current) {
      if (isWashing) {
        // Move towards electrode stand
        const targetPos = new THREE.Vector3(-1.8, 1.0, 0.0);
        bottleRef.current.position.lerp(targetPos, 0.08);
        bottleRef.current.rotation.z = THREE.MathUtils.lerp(bottleRef.current.rotation.z, Math.PI / 4, 0.08);
        
        if (waterRef.current && bottleRef.current.position.distanceTo(targetPos) < 0.6) {
           waterRef.current.visible = true;
           waterRef.current.position.y -= 0.05;
           if (waterRef.current.position.y < -0.6) waterRef.current.position.y = 0;
        }
        if (tissueRef.current && bottleRef.current.position.distanceTo(targetPos) < 0.6) {
           tissueRef.current.visible = true;
           tissueRef.current.position.y = -0.3 + Math.sin(state.clock.elapsedTime * 15) * 0.15;
        }
      } else {
        // Return to original position
        const origPos = new THREE.Vector3(position[0], position[1], position[2]);
        bottleRef.current.position.lerp(origPos, 0.08);
        bottleRef.current.rotation.z = THREE.MathUtils.lerp(bottleRef.current.rotation.z, 0, 0.08);
        if (waterRef.current) waterRef.current.visible = false;
        if (tissueRef.current) tissueRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={bottleRef} position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); handleWash(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
        position={[0, 0.25, 0]}
      >
        <cylinderGeometry args={[0.12, 0.15, 0.5, 24]} />
        <meshPhysicalMaterial color="#f8fafc" roughness={0.3} clearcoat={0.5} />
      </mesh>
      
      {/* Bottle neck & nozzle */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh position={[0.06, 0.62, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <cylinderGeometry args={[0.015, 0.015, 0.2, 16]} />
        <meshPhysicalMaterial color="#f8fafc" roughness={0.1} transmission={0.5} transparent />
      </mesh>

      {/* Hover Glow */}
      {hovered && (
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.13, 0.16, 0.52, 24]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.2} side={THREE.BackSide} />
        </mesh>
      )}

      {/* Standard UI Tooltip */}
      <Html
        position={[0, 0.75, 0]}
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
            background: hovered ? 'var(--accent-cyan)' : 'var(--panel-bg)',
            color: hovered ? '#000' : 'var(--text-main)',
            border: `1.5px solid ${hovered ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.2)'}`,
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            boxShadow: hovered ? '0 0 10px var(--accent-cyan)' : '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          Distilled Water
        </div>
      </Html>

      {/* Animated Water Stream */}
      <mesh ref={waterRef} position={[-0.2, 0, 0]} rotation={[0, 0, -Math.PI/8]} visible={false}>
         <cylinderGeometry args={[0.01, 0.01, 0.4, 8]} />
         <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
      </mesh>
      
      {/* Tissue Wipe */}
      <mesh ref={tissueRef} position={[-0.4, -0.3, -0.2]} visible={false} rotation={[0, 0, Math.PI / 8]}>
         <boxGeometry args={[0.08, 0.1, 0.08]} />
         <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>
    </group>
  );
};

// Main Component

const PHExperimentGuide = () => {
  const { 
    setCameraFocusTarget, showCompanionMessage, 
    activeModule, phMeterPowerOn, checklist 
  } = useSimulationStore();
  
  const lastStep = useRef(-1);

  React.useEffect(() => {
    if (activeModule !== 'PH') return;
    let currentStep: number;

    if (!phMeterPowerOn) currentStep = 1;
    else if (!checklist.phCleanElectrode1) currentStep = 2;
    else if (!checklist.phCalibrate7) currentStep = 3;
    else if (!checklist.phCleanElectrode2) currentStep = 4;
    else if (!checklist.phCalibrate4) currentStep = 5;
    else if (!checklist.phCleanElectrode3) currentStep = 6;
    else if (!checklist.phLogResult) currentStep = 7;
    else currentStep = 8; // Done

    if (currentStep !== lastStep.current) {
      lastStep.current = currentStep;
      
      switch (currentStep) {
        case 1:
          setCameraFocusTarget(new THREE.Vector3(-1.0, 0.5, 0));
          showCompanionMessage("Welcome to the pH determination lab! First, let's turn on the pH meter.", "default");
          break;
        case 2:
        case 4:
        case 6:
          setCameraFocusTarget(new THREE.Vector3(1.8, 0.2, 0.3));
          showCompanionMessage("Before the next step, you must wash the electrode with distilled water to prevent cross-contamination.", "default");
          break;
        case 3:
          setCameraFocusTarget(new THREE.Vector3(-0.9, 0, 0.6));
          showCompanionMessage("Submerge the electrode in the pH 7.00 buffer and press CALIBRATE to set our neutral point.", "default");
          break;
        case 5:
          setCameraFocusTarget(new THREE.Vector3(-1.8, 0, 0.6));
          showCompanionMessage("Now submerge the electrode in the pH 4.01 buffer and press CALIBRATE again to set the acidic slope.", "default");
          break;
        case 7:
          setCameraFocusTarget(new THREE.Vector3(0, 0, 0.6));
          showCompanionMessage("Calibration complete! Place the electrode in the unknown water sample. Wait for a stable reading and record it in your logbook.", "default");
          break;
        case 8:
          setCameraFocusTarget(null); // Release lock
          showCompanionMessage("Great job! You have successfully determined the pH of the sample. Submit your results for evaluation.", "default");
          break;
      }
    }
  }, [phMeterPowerOn, checklist, activeModule, setCameraFocusTarget, showCompanionMessage]);

  return null;
};

export const PHMeterSetup: React.FC = () => {
  const {
    phMeterPowerOn, togglePHPower, calibratePHMeter,
    phMeterCurrentReading, setPHReading,
    phElectrodeSubmergedIn,
    showAllLabels, phElectrodeClean,
    phTrueSampleValue, phCalibrationOffset
  } = useSimulationStore();

  const timeSubmerged = useRef(0);
  const lastUpdate = useRef(0);
  const electrodeRef = useRef<THREE.Group>(null);
  const cableRef = useRef<THREE.Mesh>(null);

  // Electrode target positions based on state
  const targetPositions = useMemo(() => {
    return {
      'BUFFER_4': new THREE.Vector3(-1.8, 0.1, 0.6),
      'BUFFER_7': new THREE.Vector3(-0.9, 0.1, 0.6),
      'SAMPLE': new THREE.Vector3(0.0, 0.1, 0.6),
      'WASTE': new THREE.Vector3(1.2, 0.1, 0.6),
      'DEFAULT': new THREE.Vector3(-2.2, 0.6, 0)
    };
  }, []);

  useFrame((state, delta) => {
    // Smoothly animate the electrode arm to the target position
    if (electrodeRef.current) {
      let target;
      if (phElectrodeSubmergedIn) {
         target = targetPositions[phElectrodeSubmergedIn as keyof typeof targetPositions];
      } else {
         target = targetPositions['DEFAULT'];
      }
      
      // Interpolate position
      electrodeRef.current.position.lerp(target, 8 * delta);
    }

    // Dynamic Cable
    if (cableRef.current && electrodeRef.current) {
      const start = new THREE.Vector3().copy(electrodeRef.current.position);
      start.y += 0.3; // Top of the electrode arm
      start.x -= 0.1;
      const end = new THREE.Vector3(-1.0, 0.3, -1.0); // Back of the pH meter
      const mid = new THREE.Vector3((start.x + end.x) / 2, Math.min(start.y, end.y) - 0.4, (start.z + end.z) / 2);
      
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const geom = new THREE.TubeGeometry(curve, 20, 0.015, 8, false);
      if (cableRef.current.geometry) cableRef.current.geometry.dispose();
      cableRef.current.geometry = geom;
    }

    if (!phMeterPowerOn) {
      if (phMeterCurrentReading !== null) setPHReading(null);
      return;
    }

    // Throttle updates to 5 times a second to prevent React infinite update crashes
    if (state.clock.elapsedTime - lastUpdate.current < 0.2) return;
    lastUpdate.current = state.clock.elapsedTime;

    if (!phElectrodeSubmergedIn) {
      // Wandering reading when in air
      setPHReading(7.0 + Math.sin(state.clock.elapsedTime) * 0.5);
      timeSubmerged.current = 0;
    } else {
      // Calculate realistic drift
      timeSubmerged.current += delta + 0.2; // Add the throttled time
      let trueV: number;
      if (phElectrodeSubmergedIn === 'SAMPLE') trueV = phTrueSampleValue;
      else trueV = getBufferTrueValue(phElectrodeSubmergedIn as 'BUFFER_4' | 'BUFFER_7');

      const reading = calculatePHReading(trueV, timeSubmerged.current, phCalibrationOffset, phElectrodeClean);
      setPHReading(reading);
    }
  });

  return (
    <group position={[0, -0.05, 0]}>
      <PHExperimentGuide />
      {/* Sleek Analytical Machine Body */}
      <group position={[-1.0, 0.5, -0.8]}>
        <mesh castShadow receiveShadow>

          <RoundedBox args={[1.4, 0.9, 0.6]} radius={0.05} smoothness={4}>
            <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
          </RoundedBox>
        </mesh>
        
        {/* Silver accent plate */}
        <mesh position={[0, -0.2, 0.301]}>
           <boxGeometry args={[1.2, 0.3, 0.01]} />
           <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.8} />
        </mesh>

        {/* Brand Logo/Text */}
        <Text position={[-0.45, 0.3, 0.31]} fontSize={0.06} color="#94a3b8" anchorX="left">
          NEXUS pH-9000
        </Text>

        {/* Buttons */}
        <PushButton position={[-0.4, -0.2, 0.31]} color="#ef4444" label="POWER" onClick={togglePHPower} />
        <PushButton position={[-0.1, -0.2, 0.31]} color="#3b82f6" label="CALIBRATE" onClick={calibratePHMeter} />
        
        {/* Screen */}
        <DigitalScreen position={[0.25, 0.1, 0.31]} powerOn={phMeterPowerOn} reading={phMeterCurrentReading} />
      </group>

      {/* Articulated Electrode Stand (Static Base) */}
      <group position={[-2.2, 0, 0]}>
        {/* Heavy metal base */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.3, 0.1, 24]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.4} />
        </mesh>
        {/* Vertical Pole */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.9, 16]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* Moving Electrode Arm Assembly */}
      <group ref={electrodeRef} position={[-2.2, 0.6, 0]}>
        {/* Horizontal mounting arm */}
        <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 16]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.9} />
        </mesh>
        
        {/* The glass electrode probe itself */}
        <group position={[0, -0.1, 0]}>
           {/* Probe body */}
           <mesh castShadow>
             <cylinderGeometry args={[0.015, 0.015, 0.5, 16]} />
             <meshPhysicalMaterial color="#3b82f6" transmission={0.2} transparent opacity={0.9} roughness={0.2} />
           </mesh>
           {/* Probe glass tip (bulb) */}
           <mesh position={[0, -0.28, 0]}>
             <sphereGeometry args={[0.02, 12, 12]} />
             <meshPhysicalMaterial color="#f8fafc" transmission={0.95} transparent opacity={0.9} roughness={0.05} />
           </mesh>
           {/* Cable running up */}
           <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0]}>
             <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
             <meshStandardMaterial color="#000000" roughness={0.9} />
           </mesh>
        </group>
      </group>

      {/* Solutions Array */}
      <PHBeaker position={[-1.8, 0, 0.6]} label={showAllLabels ? "Buffer pH 4.01" : undefined} targetType="BUFFER_4" color="#fca5a5" highlightColor="#ef4444" />
      <PHBeaker position={[-0.9, 0, 0.6]} label={showAllLabels ? "Buffer pH 7.00" : undefined} targetType="BUFFER_7" color="#fcd34d" highlightColor="#eab308" />
      <PHBeaker position={[0.0, 0, 0.6]} label={showAllLabels ? "Water Sample" : undefined} targetType="SAMPLE" color="#93c5fd" highlightColor="#3b82f6" />
      
      {/* Rest/Waste beaker */}
      <group position={[1.2, 0, 0.6]}>
        <PHBeaker position={[0,0,0]} label={showAllLabels ? "Waste (Resting)" : undefined} targetType={null} color="#e2e8f0" highlightColor="#94a3b8" />
      </group>

      <WashBottle position={[1.8, 0, 0.3]} />
      {/* Dynamic Cable */}
      <mesh ref={cableRef}>
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>
    </group>
  );
};


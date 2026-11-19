import React from 'react';
import { useSimulationStore } from '../state/simulationStore';
import Burette from './Burette';
import ConicalFlask from './ConicalFlask';
import ReagentBottle from './ReagentBottle';
import Pipette from './Pipette';
import { PHMeterSetup } from './3D/PHMeterSetup';
import { TitrationExperimentGuide } from './3D/TitrationExperimentGuide';
import { CODExperimentGuide } from './3D/CODExperimentGuide';

export const LabScene: React.FC = () => {
  const {
    selectedEquipment,
    selectEquipment,
    activePipetteLiquid,
    theme,
    showAllLabels,
    isExperimentFailed,
    isExperimentSubmitted,
    safetyBriefingRead,
    activeModule,
    codActiveStation,
    sampleIsRefluxing,
    sampleRefluxCompleted,
    blankIsRefluxing,
    blankRefluxCompleted,
  } = useSimulationStore();

  const tableColor = theme === 'dark' ? '#1e293b' : '#cbd5e1';
  const lipColor = theme === 'dark' ? '#0f172a' : '#94a3b8';
  const shouldShowLabels = showAllLabels && safetyBriefingRead && !isExperimentFailed && !isExperimentSubmitted;

  const isSample = codActiveStation === 'SAMPLE';
  const isRefluxing = isSample ? sampleIsRefluxing : blankIsRefluxing;
  const refluxCompleted = isSample ? sampleRefluxCompleted : blankRefluxCompleted;


  return (
    <group>
      {/* 1. Lab Table Bench */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[6.0, 0.1, 4.0]} />
        <meshStandardMaterial color={tableColor} roughness={0.6} metalness={0.1} />
      </mesh>
      
      {/* Table border lip */}
      <mesh position={[0, -0.05, 2.01]}><boxGeometry args={[6.02, 0.12, 0.02]} /><meshStandardMaterial color={lipColor} roughness={0.8} /></mesh>
      <mesh position={[0, -0.05, -2.01]}><boxGeometry args={[6.02, 0.12, 0.02]} /><meshStandardMaterial color={lipColor} roughness={0.8} /></mesh>

      {/* Heating Mantle for COD */}
      {activeModule === 'COD' && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.22, 0.25, 0.1, 32]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.105, 0]}>
            <cylinderGeometry args={[0.2, 0.22, 0.01, 32]} />
            <meshStandardMaterial color={isRefluxing ? '#ef4444' : '#1e293b'} emissive={isRefluxing ? '#ef4444' : '#000000'} emissiveIntensity={isRefluxing ? 0.8 : 0} roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* 2. Burette and Stand assembly */}
      <group position={activeModule === 'PH' ? [2.5, 0, -1.5] : [0, 0, 0]}>
        <Burette />
      </group>

      {/* 3. Conical Flask (titrand solution container) */}
      <group position={activeModule === 'PH' ? [2.5, 0, -1.5] : [0, activeModule === 'COD' ? 0.1 : 0, 0]}>
        <ConicalFlask />
        {/* Soft local fill light to make the flask and liquid pop */}
        <pointLight position={[0, 0.5, 0.5]} intensity={1.5} distance={2} color="#ffffff" decay={2} />
      </group>

      {/* Reflux Condenser for COD */}
      {activeModule === 'COD' && !refluxCompleted && (
        <group position={[0, 0.7, 0]}>
          {/* Main tube */}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 16]} />
            <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={0.6} transparent roughness={0.1} />
          </mesh>
          {/* Outer cooling jacket */}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 16]} />
            <meshPhysicalMaterial color="#e0f2fe" transmission={0.8} opacity={0.4} transparent roughness={0.2} />
          </mesh>
          {/* Hose connectors */}
          <mesh position={[0.045, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.005, 0.005, 0.02, 8]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[-0.045, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.005, 0.005, 0.02, 8]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </group>
      )}

            {/* Guides */}
      {(activeModule === 'ALKALINITY' || activeModule === 'HARDNESS') && <TitrationExperimentGuide />}
      {activeModule === 'COD' && <CODExperimentGuide />}

      {/* PH Module */}
      {activeModule === 'PH' && (
        <group position={[0, 0, 0]}>
          <PHMeterSetup />
        </group>
      )}

      {/* 4. Titrant Bottle (Left side, back) */}
      {activeModule === 'HARDNESS' && <ReagentBottle position={[-0.8, 0.35, 0.4]} name="EDTA_BOTTLE" label="EDTA (0.01M)" color="#3b82f6" liquidColor="#f0f9ff" isSelected={selectedEquipment === 'EDTA_BOTTLE'} onClick={() => selectEquipment('EDTA_BOTTLE')} showLabel={shouldShowLabels} />}
      {activeModule === 'ALKALINITY' && <ReagentBottle position={[-0.8, 0.35, 0.4]} name="HCL_BOTTLE" label="Standard HCl" color="#3b82f6" liquidColor="#f0f9ff" isSelected={selectedEquipment === 'HCL_BOTTLE'} onClick={() => selectEquipment('HCL_BOTTLE')} showLabel={shouldShowLabels} />}
      {activeModule === 'COD' && <ReagentBottle position={[-0.8, 0.35, 0.4]} name="FAS_BOTTLE" label="FAS (0.1N)" color="#3b82f6" liquidColor="#f0f9ff" isSelected={selectedEquipment === 'FAS_BOTTLE'} onClick={() => selectEquipment('FAS_BOTTLE')} showLabel={shouldShowLabels} />}

      {/* 5. Water Sample / Blank Bottle (Left side, front) */}
      {activeModule !== 'COD' && (
        <ReagentBottle 
          position={activeModule === 'PH' ? [-2.5, 0.35, -1.5] : [-0.6, 0.35, -0.2]} 
          name="WATER_BOTTLE" 
          label="Water Sample" 
          color="#10b981" 
          liquidColor="#e2e8f0" 
          isSelected={selectedEquipment === 'WATER_BOTTLE'} 
          onClick={() => selectEquipment('WATER_BOTTLE')} 
          showLabel={shouldShowLabels} 
        />
      )}
      
      {activeModule === 'COD' && codActiveStation === 'SAMPLE' && (
        <ReagentBottle position={[-0.6, 0.35, -0.2]} name="WATER_BOTTLE" label="Water Sample" color="#10b981" liquidColor="#e2e8f0" isSelected={selectedEquipment === 'WATER_BOTTLE'} onClick={() => selectEquipment('WATER_BOTTLE')} showLabel={shouldShowLabels} />
      )}
      {activeModule === 'COD' && codActiveStation === 'BLANK' && (
        <ReagentBottle position={[-0.6, 0.35, -0.2]} name="BLANK_BOTTLE" label="Distilled Water" color="#94a3b8" liquidColor="#e2e8f0" isSelected={selectedEquipment === 'BLANK_BOTTLE'} onClick={() => selectEquipment('BLANK_BOTTLE')} showLabel={shouldShowLabels} />
      )}

      {/* 6. Indicators and Reagents */}
      {activeModule === 'HARDNESS' && <ReagentBottle position={[0.8, 0.35, 0.4]} name="EBT_BOTTLE" label="EBT Indicator" color="#ec4899" liquidColor="#991b1b" isSelected={selectedEquipment === 'EBT_BOTTLE'} onClick={() => selectEquipment('EBT_BOTTLE')} showLabel={shouldShowLabels} />}
      
      {activeModule === 'ALKALINITY' && (
        <group>
          <ReagentBottle position={[0.8, 0.35, 0.4]} name="PHENOL_BOTTLE" label="Phenolphthalein" color="#ec4899" liquidColor="#fdf2f8" isSelected={selectedEquipment === 'PHENOL_BOTTLE'} onClick={() => selectEquipment('PHENOL_BOTTLE')} showLabel={shouldShowLabels} />
          <ReagentBottle position={[0.95, 0.35, 0.1]} name="METHYL_BOTTLE" label="Methyl Orange" color="#f59e0b" liquidColor="#f59e0b" isSelected={selectedEquipment === 'METHYL_BOTTLE'} onClick={() => selectEquipment('METHYL_BOTTLE')} showLabel={shouldShowLabels} />
        </group>
      )}

      {activeModule === 'COD' && (
        <group>
          <ReagentBottle position={[0.6, 0.35, 0.4]} name="K2CR2O7_BOTTLE" label="K₂Cr₂O₇" color="#f97316" liquidColor="#f97316" isSelected={selectedEquipment === 'K2CR2O7_BOTTLE'} onClick={() => selectEquipment('K2CR2O7_BOTTLE')} showLabel={shouldShowLabels} />
          <ReagentBottle position={[0.8, 0.35, 0.2]} name="H2SO4_BOTTLE" label="H₂SO₄" color="#475569" liquidColor="#f8fafc" isSelected={selectedEquipment === 'H2SO4_BOTTLE'} onClick={() => selectEquipment('H2SO4_BOTTLE')} showLabel={shouldShowLabels} />
          <ReagentBottle position={[0.95, 0.35, -0.1]} name="FERROIN_BOTTLE" label="Ferroin" color="#ec4899" liquidColor="#991b1b" isSelected={selectedEquipment === 'FERROIN_BOTTLE'} onClick={() => selectEquipment('FERROIN_BOTTLE')} showLabel={shouldShowLabels} />
        </group>
      )}

      {/* 7. Pipette (Lying on the table, right front) */}
      <group position={activeModule === 'PH' ? [1.5, 0, -1.5] : [0, 0, 0]}>
        <Pipette
          position={[1.1, 0.02, 0.4]}
          rotation={[Math.PI / 2, 0, Math.PI / 4]}
          isSelected={selectedEquipment === 'PIPETTE'}
          activeLiquid={activePipetteLiquid}
          onClick={() => selectEquipment('PIPETTE')}
          showLabel={shouldShowLabels}
        />
      </group>


    </group>
  );
};

export default LabScene;

import React, { useEffect, useRef } from 'react';
import { useSimulationStore } from '../../state/simulationStore';
import * as THREE from 'three';

export const TitrationExperimentGuide: React.FC = () => {
  const {
    activeModule,
    checklist,
    showCompanionMessage,
    setCameraFocusTarget,
  } = useSimulationStore();

  const prevChecklist = useRef(checklist);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      showCompanionMessage("Welcome! First, let's select the correct titrant for this experiment from the shelf.", "default");
      setCameraFocusTarget(new THREE.Vector3(-0.8, 0.4, 0.4)); // Shelf
      hasInitialized.current = true;
      return;
    }

    const prev = prevChecklist.current;
    const curr = checklist;

    if (!prev.selectTitrant && curr.selectTitrant) {
      showCompanionMessage("Good! Now pipette the water sample into the conical flask.", "default");
      setCameraFocusTarget(new THREE.Vector3(1.1, 0.2, 0.4)); // Pipette
    } 
    else if (!prev.pipetteSample && curr.pipetteSample) {
      if (activeModule === 'HARDNESS') {
        showCompanionMessage("Excellent. Now add a few drops of Eriochrome Black T (EBT) indicator to the flask.", "default");
      } else {
        showCompanionMessage("Excellent. Now add Phenolphthalein indicator to the flask.", "default");
      }
      setCameraFocusTarget(new THREE.Vector3(0.8, 0.4, 0.4)); // Indicators
    }
    else if (!prev.addIndicator1 && curr.addIndicator1) {
      showCompanionMessage("The indicator is added. Now, fill the burette with the titrant.", "default");
      setCameraFocusTarget(new THREE.Vector3(0, 1.0, 0)); // Burette top
    }
    else if (!prev.fillBurette && curr.fillBurette) {
      showCompanionMessage("Burette is filled and zeroed! Open the stopcock to start titrating. Swirl the flask to mix.", "default");
      setCameraFocusTarget(new THREE.Vector3(0, 0.1, 0)); // Flask
    }
    else if (!prev.stopAtEndpoint && curr.stopAtEndpoint) {
      if (activeModule === 'ALKALINITY' && !curr.addIndicator2) {
        showCompanionMessage("First endpoint reached! Record your V1 reading, then add Methyl Orange indicator to continue.", "default");
        setCameraFocusTarget(new THREE.Vector3(0.95, 0.4, 0.1)); // Methyl Orange
      } else {
        showCompanionMessage("Endpoint reached! Record the final volume reading from the burette.", "default");
        setCameraFocusTarget(new THREE.Vector3(0, 0.5, 0)); // Burette middle
      }
    }
    else if (!prev.addIndicator2 && curr.addIndicator2) {
       showCompanionMessage("Methyl Orange added. Continue titrating until the solution turns pink.", "default");
       setCameraFocusTarget(new THREE.Vector3(0, 0.1, 0)); // Flask
    }

    prevChecklist.current = curr;
  }, [checklist, activeModule, showCompanionMessage, setCameraFocusTarget]);

  return null;
};

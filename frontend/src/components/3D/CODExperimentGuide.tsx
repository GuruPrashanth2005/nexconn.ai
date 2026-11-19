import React, { useEffect, useRef } from 'react';
import { useSimulationStore } from '../../state/simulationStore';
import * as THREE from 'three';

export const CODExperimentGuide: React.FC = () => {
  const {
    checklist,
    showCompanionMessage,
    setCameraFocusTarget,
    codActiveStation,
  } = useSimulationStore();

  const prevChecklist = useRef(checklist);
  const prevStation = useRef(codActiveStation);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      showCompanionMessage("Welcome to the COD test! We will prepare a water sample and a blank simultaneously. Let's start with the sample: pipette the water sample into the flask.", "default");
      setCameraFocusTarget(new THREE.Vector3(1.1, 0.2, 0.4)); // Pipette
      hasInitialized.current = true;
      return;
    }

    const prev = prevChecklist.current;
    const curr = checklist;
    const isSample = codActiveStation === 'SAMPLE';

    if (codActiveStation !== prevStation.current) {
      if (codActiveStation === 'BLANK' && !curr.codBlankPipette) {
         showCompanionMessage("Switched to Blank preparation. Pipette distilled water into the blank flask.", "default");
         setCameraFocusTarget(new THREE.Vector3(1.1, 0.2, 0.4));
      } else if (codActiveStation === 'SAMPLE' && !curr.codSamplePipette) {
         showCompanionMessage("Switched to Sample preparation. Pipette the water sample.", "default");
         setCameraFocusTarget(new THREE.Vector3(1.1, 0.2, 0.4));
      }
      prevStation.current = codActiveStation;
    }

    if (isSample) {
      if (!prev.codSamplePipette && curr.codSamplePipette) {
        showCompanionMessage("Sample added. Next, add Potassium Dichromate (K₂Cr₂O₇) to the flask.", "default");
        setCameraFocusTarget(new THREE.Vector3(0.6, 0.4, 0.4)); // K2Cr2O7
      } else if (!prev.codSampleK2Cr2O7 && curr.codSampleK2Cr2O7) {
        showCompanionMessage("Good. Now carefully add Sulfuric Acid (H₂SO₄).", "default");
        setCameraFocusTarget(new THREE.Vector3(0.8, 0.4, 0.2)); // H2SO4
      } else if (!prev.codSampleH2SO4 && curr.codSampleH2SO4) {
        showCompanionMessage("Reagents added. Now, turn on the heating mantle to start the 2-hour reflux process.", "default");
        setCameraFocusTarget(new THREE.Vector3(0, 0.1, 0)); // Heating mantle
      } else if (!prev.codSampleStartReflux && curr.codSampleStartReflux) {
        showCompanionMessage("Refluxing... Wait for it to complete.", "default");
        setCameraFocusTarget(new THREE.Vector3(0, 0.5, 0)); // Condenser
      } else if (!prev.codSampleCompleteReflux && curr.codSampleCompleteReflux) {
        showCompanionMessage("Reflux complete! The sample has cooled. Now, fill the burette with FAS (0.1N).", "default");
        setCameraFocusTarget(new THREE.Vector3(0, 1.0, 0)); // Burette top
      } else if (!prev.codSampleFillBurette && curr.codSampleFillBurette) {
        showCompanionMessage("Burette filled. Add Ferroin indicator before titrating.", "default");
        setCameraFocusTarget(new THREE.Vector3(0.95, 0.4, -0.1)); // Ferroin
      } else if (!prev.codSampleAddFerroin && curr.codSampleAddFerroin) {
        showCompanionMessage("Start the titration. Stop immediately when the solution turns reddish-brown.", "default");
        setCameraFocusTarget(new THREE.Vector3(0, 0.1, 0)); // Flask
      } else if (!prev.codSampleTitrateToWineRed && curr.codSampleTitrateToWineRed) {
        showCompanionMessage("Endpoint reached! Record V2 for the sample in your logbook.", "default");
        setCameraFocusTarget(new THREE.Vector3(0, 0.5, 0)); // Burette middle
      }
    } else {
      // Blank
      if (!prev.codBlankPipette && curr.codBlankPipette) {
        showCompanionMessage("Distilled water added. Add K₂Cr₂O₇ to the blank.", "default");
        setCameraFocusTarget(new THREE.Vector3(0.6, 0.4, 0.4));
      } else if (!prev.codBlankK2Cr2O7 && curr.codBlankK2Cr2O7) {
        showCompanionMessage("Good. Now carefully add H₂SO₄.", "default");
        setCameraFocusTarget(new THREE.Vector3(0.8, 0.4, 0.2));
      } else if (!prev.codBlankH2SO4 && curr.codBlankH2SO4) {
        showCompanionMessage("Turn on the heating mantle for the blank reflux.", "default");
        setCameraFocusTarget(new THREE.Vector3(0, 0.1, 0));
      } else if (!prev.codBlankStartReflux && curr.codBlankStartReflux) {
        showCompanionMessage("Refluxing the blank... Please wait.", "default");
        setCameraFocusTarget(new THREE.Vector3(0, 0.5, 0));
      } else if (!prev.codBlankCompleteReflux && curr.codBlankCompleteReflux) {
        showCompanionMessage("Blank reflux complete! Fill the burette with FAS.", "default");
        setCameraFocusTarget(new THREE.Vector3(0, 1.0, 0));
      } else if (!prev.codBlankFillBurette && curr.codBlankFillBurette) {
        showCompanionMessage("Burette filled. Add Ferroin indicator to the blank.", "default");
        setCameraFocusTarget(new THREE.Vector3(0.95, 0.4, -0.1));
      } else if (!prev.codBlankAddFerroin && curr.codBlankAddFerroin) {
        showCompanionMessage("Start titrating the blank. Stop at the reddish-brown endpoint.", "default");
        setCameraFocusTarget(new THREE.Vector3(0, 0.1, 0));
      } else if (!prev.codBlankTitrateToWineRed && curr.codBlankTitrateToWineRed) {
        showCompanionMessage("Blank endpoint reached! Record V1 in your logbook.", "default");
        setCameraFocusTarget(new THREE.Vector3(0, 0.5, 0));
      }
    }

    prevChecklist.current = curr;
  }, [checklist, codActiveStation, showCompanionMessage, setCameraFocusTarget]);

  return null;
};

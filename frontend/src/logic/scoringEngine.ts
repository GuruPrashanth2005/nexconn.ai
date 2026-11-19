/* eslint-disable */
// Scoring logic for the EDTA titration simulation.
import { calculateHardness } from './chemistryEngine';

export interface EvaluationState {
  endpoint: number; // Theoretical endpoint (ml)
  finalVolume: number; // The actual volume stopped at (ml)
  hasSampleAdded: boolean; // Add 20ml sample
  selectedTitrant: string | null; // EDTA selected for burette
  selectedIndicator: string | null; // EBT selected
  isBuretteFilled: boolean; // Filled to 0.00
  usedDropwiseNearEndpoint: boolean; // Switched to drop-wise within 1.5 ml
  swirledNearEndpoint: boolean; // Swirled within critical titration range
  userInitialReading: string; // User input in logbook
  userFinalReading: string; // User input in logbook
  userHardnessInput: string; // User calculated hardness
  timeElapsedSeconds?: number; // Time taken in seconds
}

export interface ScoreBreakdown {
  accuracy: number;     // max 50
  procedure: number;    // max 30
  time: number;         // max 20
  proceduralDetails: Record<string, boolean>; // detailed true/false for UI
}

export interface ScoreReport {
  score: number; // Out of 100
  breakdown: ScoreBreakdown;
  status: 'success' | 'partial_success' | 'failed';
  feedback: string[];
  tips: string[];
  aiFeedback?: string;
}

export const evaluateTitration = (state: EvaluationState): ScoreReport => {
  const breakdown: ScoreBreakdown = {
    accuracy: 0,
    procedure: 0,
    time: 0,
    proceduralDetails: {},
  };

  const feedback: string[] = [];
  const tips: string[] = [];

  // --- PROCEDURE (30 points max) ---
  // Reagents (5 pts)
  const reagentsOk = state.hasSampleAdded && state.selectedTitrant === 'EDTA';
  breakdown.proceduralDetails['Correct Reagents (EDTA & Water)'] = reagentsOk;
  if (reagentsOk) breakdown.procedure += 5;
  else tips.push('Always add the water sample first and use EDTA for hardness titration.');

  // Indicator (5 pts)
  const indicatorOk = state.selectedIndicator === 'EBT';
  breakdown.proceduralDetails['EBT Indicator'] = indicatorOk;
  if (indicatorOk) breakdown.procedure += 5;
  else tips.push('Eriochrome Black T (EBT) is required as the indicator.');

  // Burette (5 pts)
  breakdown.proceduralDetails['Burette zeroed'] = state.isBuretteFilled;
  if (state.isBuretteFilled) breakdown.procedure += 5;
  else tips.push('Fill the burette to exactly 0.00 ml before starting.');

  // Flow control & Swirling (5 pts)
  const mechanicsOk = state.usedDropwiseNearEndpoint && state.swirledNearEndpoint;
  breakdown.proceduralDetails['Drop-wise & Swirling'] = mechanicsOk;
  if (mechanicsOk) breakdown.procedure += 5;
  else tips.push('Switch to drop-wise and swirl continuously near the endpoint.');

  // Logbook (10 pts)
  const initialValid = parseFloat(state.userInitialReading) === 0.0;
  const finalValid = Math.abs(parseFloat(state.userFinalReading) - state.finalVolume) <= 0.15;
  const correctHardness = calculateHardness(state.finalVolume);
  const userHardness = parseFloat(state.userHardnessInput);
  const calculationValid = Math.abs(userHardness - correctHardness) <= 5.0;
  
  const logbookOk = initialValid && finalValid && calculationValid;
  breakdown.proceduralDetails['Correct Logbook Calculations'] = logbookOk;
  if (logbookOk) breakdown.procedure += 10;
  else tips.push('Check your logbook calculations and burette readings carefully.');

  // --- ACCURACY (50 points max) ---
  const deviation = Math.abs(state.finalVolume - state.endpoint);
  if (deviation <= 0.1) {
    breakdown.accuracy = 50;
    feedback.push(`Excellent accuracy: Stopped within ${deviation.toFixed(2)} ml of the endpoint.`);
  } else if (deviation <= 0.25) {
    breakdown.accuracy = 25;
    feedback.push(`Moderate accuracy: Stopped ${deviation.toFixed(2)} ml away from the endpoint.`);
  } else {
    breakdown.accuracy = 0;
    feedback.push(`Poor accuracy: Missed endpoint by ${deviation.toFixed(2)} ml.`);
  }

  // --- TIME (20 points max) ---
  const elapsed = state.timeElapsedSeconds || 0;
  // Full 20 points if under 10 minutes (600s), -1 point per minute after
  let timeScore = 20;
  if (elapsed > 600) {
    const minutesOver = Math.floor((elapsed - 600) / 60);
    timeScore = Math.max(0, 20 - minutesOver);
  }
  breakdown.time = timeScore;

  // Calculate Total Score
  const score = breakdown.procedure + breakdown.accuracy + breakdown.time;

  let status: 'success' | 'partial_success' | 'failed' = 'failed';
  if (score >= 85 && deviation <= 0.15) {
    status = 'success';
  } else if (score >= 50 && deviation <= 0.4) {
    status = 'partial_success';
  } else {
    status = 'failed';
  }

  return {
    score,
    breakdown,
    status,
    feedback,
    tips,
  };
};


export interface EvaluationPHState {
  phCalibrate7: boolean;
  phCalibrate4: boolean;
  phCleanElectrode1: boolean;
  phCleanElectrode2: boolean;
  phCleanElectrode3: boolean;
  phMeasureSample: boolean;
  userPHResult: string;
  phTrueSampleValue: number;
  timeElapsedSeconds?: number;
}

export const evaluatePHDetermination = (state: EvaluationPHState): ScoreReport => {
  const breakdown: ScoreBreakdown = {
    accuracy: 0,
    procedure: 0,
    time: 0,
    proceduralDetails: {},
  };

  const feedback: string[] = [];
  const tips: string[] = [];

  // --- PROCEDURE (30 points max) ---
  // 1. Calibration (15 pts)
  const fullCalibration = state.phCalibrate7 && state.phCalibrate4;
  breakdown.proceduralDetails['Two-point Calibration (pH 7 & 4)'] = fullCalibration;
  if (fullCalibration) {
    breakdown.procedure += 15;
  } else if (state.phCalibrate7) {
    breakdown.procedure += 7;
    tips.push('A two-point calibration using pH 7 and pH 4 buffers is required for acidic samples.');
  } else {
    tips.push('Always calibrate the pH meter before taking measurements.');
  }

  // 2. Cleaning (10 pts)
  const cleanCount = (state.phCleanElectrode1 ? 1 : 0) + (state.phCleanElectrode2 ? 1 : 0) + (state.phCleanElectrode3 ? 1 : 0);
  const excellentCleaning = cleanCount === 3;
  breakdown.proceduralDetails['Electrode Washed Between Uses'] = excellentCleaning;
  if (excellentCleaning) {
    breakdown.procedure += 10;
  } else if (cleanCount > 0) {
    breakdown.procedure += Math.floor((cleanCount / 3) * 10);
    tips.push('Wash the electrode before submerging it into any new solution to prevent cross-contamination.');
  } else {
    tips.push('The electrode must be washed with distilled water between measurements.');
  }

  // 3. Logbook (5 pts)
  const logbookOk = state.phMeasureSample && !isNaN(parseFloat(state.userPHResult));
  breakdown.proceduralDetails['Recorded Final pH Measurement'] = logbookOk;
  if (logbookOk) {
    breakdown.procedure += 5;
  } else {
    tips.push('Always record your final measurement in the logbook.');
  }

  // --- ACCURACY (50 points max) ---
  if (state.phMeasureSample) {
    const userVal = parseFloat(state.userPHResult);
    if (!isNaN(userVal)) {
      const error = Math.abs(userVal - state.phTrueSampleValue);
      if (error <= 0.05) {
        breakdown.accuracy = 50;
        feedback.push('Accurate measurement: Logged the correct pH value of the sample.');
      } else if (error <= 0.2) {
        breakdown.accuracy = 25;
        feedback.push('Acceptable measurement: Logged pH value has slight deviation.');
        tips.push('Ensure the reading stabilizes completely before recording it.');
      } else {
        feedback.push('Inaccurate measurement: Logged pH value is significantly off.');
        tips.push('Make sure to calibrate properly and let the reading stabilize.');
      }
    }
  } else {
    feedback.push('Missing measurement: Did not measure the water sample.');
  }

  // --- TIME (20 points max) ---
  const elapsed = state.timeElapsedSeconds || 0;
  let timeScore = 20;
  if (elapsed > 600) {
    const minutesOver = Math.floor((elapsed - 600) / 60);
    timeScore = Math.max(0, 20 - minutesOver);
  }
  breakdown.time = timeScore;

  // Calculate Total Score
  const score = breakdown.procedure + breakdown.accuracy + breakdown.time;

  let status: 'success' | 'partial_success' | 'failed' = 'failed';
  if (score >= 90) status = 'success';
  else if (score >= 60) status = 'partial_success';

  return {
    score,
    breakdown,
    status,
    feedback,
    tips
  };
};

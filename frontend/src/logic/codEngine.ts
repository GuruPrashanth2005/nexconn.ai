import type { SolutionColor } from './chemistryEngine';
import type { ScoreReport, ScoreBreakdown } from './scoringEngine';

export interface CODEvaluationState {
  endpointSample: number;
  endpointBlank: number;
  finalVolumeSample: number | null;
  finalVolumeBlank: number | null;
  
  sampleHasWater: boolean;
  sampleHasK2Cr2O7: boolean;
  sampleHasH2SO4: boolean;
  sampleHasFerroin: boolean;
  sampleRefluxCompleted: boolean;
  sampleBuretteFilled: boolean;

  blankHasWater: boolean;
  blankHasK2Cr2O7: boolean;
  blankHasH2SO4: boolean;
  blankHasFerroin: boolean;
  blankRefluxCompleted: boolean;
  blankBuretteFilled: boolean;

  usedDropwiseNearEndpoint: boolean;
  swirledNearEndpoint: boolean;
  userInitialSample: string;
  userFinalSample: string;
  userInitialBlank: string;
  userFinalBlank: string;
  userCODResult: string;
  timeElapsedSeconds?: number;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
};

const interpolateColor = (color1: string, color2: string, factor: number) => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));
  
  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
};

export const generateCODEndpoints = () => {
  const rawV2 = 8.0 + Math.random() * 6.0;
  const endpointSample = Math.round(rawV2 * 100) / 100;
  const minV1 = Math.max(16.0, endpointSample + 4.0);
  const maxV1 = 22.0;
  const rawV1 = minV1 + Math.random() * (maxV1 - minV1);
  const endpointBlank = Math.round(rawV1 * 100) / 100;
  return { endpointSample, endpointBlank };
};

export const calculateCODColor = (
  volume: number,
  endpoint: number,
  hasSampleOrBlank: boolean,
  hasK2Cr2O7: boolean,
  hasH2SO4: boolean,
  hasFerroin: boolean,
  refluxCompleted: boolean,
  isSwirling: boolean,
  lastSwirlVolume: number
): SolutionColor => {
  if (!hasSampleOrBlank) return { hex: '#ffffff', opacity: 0.0, isStable: true };
  if (!hasK2Cr2O7) return { hex: '#e2e8f0', opacity: 0.2, isStable: true };
  if (!hasH2SO4) return { hex: '#e2e8f0', opacity: 0.2, isStable: true, message: 'Acidic medium required.' };
  if (!refluxCompleted) return { hex: '#f97316', opacity: 0.9, isStable: true, message: 'Dichromate is orange. Reflux required before titration.' };
  if (!hasFerroin) return { hex: '#f97316', opacity: 0.9, isStable: true, message: 'Add Ferroin indicator before titrating.' };

  const volumeSinceSwirl = Math.max(0, volume - lastSwirlVolume);
  const isStable = isSwirling || volumeSinceSwirl <= 0.15;

  if (!isStable && volume > 0.5) return { hex: '#991b1b', opacity: 0.8, isStable: false, message: 'Mixing required for accurate endpoint.' };

  const diff = volume - endpoint;
  if (diff < -1.0) return { hex: '#0ea5e9', opacity: 0.7, isStable: true };
  else if (diff >= -1.0 && diff < -0.2) {
    const ratio = (volume - (endpoint - 1.0)) / 0.8;
    return { hex: interpolateColor('#0ea5e9', '#10b981', ratio), opacity: 0.7, isStable: true, message: ratio > 0.7 ? 'Color change imminent. Slow down!' : undefined };
  } else if (diff >= -0.2 && diff < 0) {
    const ratio = (volume - (endpoint - 0.2)) / 0.2;
    return { hex: interpolateColor('#10b981', '#9f1239', ratio), opacity: 0.8, isStable: true, message: 'Flickering wine red. Use single-drop mode!' };
  } else if (diff >= 0 && diff <= 0.2) {
    return { hex: '#9f1239', opacity: 0.9, isStable: true, message: 'Endpoint reached (Wine Red)!' };
  } else {
    return { hex: '#7f1d1d', opacity: 0.95, isStable: true, message: diff > 0.3 ? 'Overshot endpoint! (Dark Red)' : 'Slightly overshot endpoint.' };
  }
};

export const calculateCODResult = (volBlank: number, volSample: number, normality = 0.1, sampleVol = 20) => {
  const diff = Math.max(0, volBlank - volSample);
  const cod = (diff * normality * 8000) / sampleVol;
  return Math.round(cod * 10) / 10;
};

export const evaluateCODTitration = (state: CODEvaluationState): ScoreReport => {
  const breakdown: ScoreBreakdown = {
    accuracy: 0,
    procedure: 0,
    time: 0,
    proceduralDetails: {},
  };

  const feedback: string[] = [];
  const tips: string[] = [];

  // --- PROCEDURE (30 points max) ---
  // 1. Reagents (10 pts)
  const sampleReagentsOk = state.sampleHasWater && state.sampleHasK2Cr2O7 && state.sampleHasH2SO4;
  const blankReagentsOk = state.blankHasWater && state.blankHasK2Cr2O7 && state.blankHasH2SO4;
  breakdown.proceduralDetails['Sample Reagents Added Correctly'] = sampleReagentsOk;
  breakdown.proceduralDetails['Blank Reagents Added Correctly'] = blankReagentsOk;
  if (sampleReagentsOk) breakdown.procedure += 5;
  else tips.push('Ensure Sample has Water, K₂Cr₂O₇, and H₂SO₄.');
  if (blankReagentsOk) breakdown.procedure += 5;
  else tips.push('Ensure Blank has Water, K₂Cr₂O₇, and H₂SO₄.');

  // 2. Reflux (10 pts)
  breakdown.proceduralDetails['Sample Refluxed'] = state.sampleRefluxCompleted;
  breakdown.proceduralDetails['Blank Refluxed'] = state.blankRefluxCompleted;
  if (state.sampleRefluxCompleted) breakdown.procedure += 5;
  if (state.blankRefluxCompleted) breakdown.procedure += 5;

  // 3. Titration Setup (5 pts)
  const setupOk = state.sampleBuretteFilled && state.blankBuretteFilled && state.sampleHasFerroin && state.blankHasFerroin;
  breakdown.proceduralDetails['Burette zeroed & Ferroin added'] = setupOk;
  if (setupOk) breakdown.procedure += 5;
  else tips.push('Ensure burette is filled and Ferroin indicator is added to both flasks.');

  // 4. Logbook & Calculation (5 pts)
  let logbookOk = false;
  if (state.userFinalSample && state.userFinalBlank) {
    const calc = calculateCODResult(parseFloat(state.userFinalBlank), parseFloat(state.userFinalSample));
    if (calc >= 0) logbookOk = true;
  }
  breakdown.proceduralDetails['Logbook Calculations Correct'] = logbookOk;
  if (logbookOk) breakdown.procedure += 5;

  // --- ACCURACY (50 points max) ---
  // 25 pts for sample, 25 for blank
  let devSample = 999;
  if (state.finalVolumeSample !== null) {
    devSample = Math.abs(state.finalVolumeSample - state.endpointSample);
    if (devSample <= 0.1) breakdown.accuracy += 25;
    else if (devSample <= 0.3) breakdown.accuracy += 12;
  }
  
  let devBlank = 999;
  if (state.finalVolumeBlank !== null) {
    devBlank = Math.abs(state.finalVolumeBlank - state.endpointBlank);
    if (devBlank <= 0.1) breakdown.accuracy += 25;
    else if (devBlank <= 0.3) breakdown.accuracy += 12;
  }

  if (devSample > 0.3 || devBlank > 0.3) {
    feedback.push(`Endpoint accuracy poor. Missed Sample by ${devSample > 990 ? 'N/A' : devSample.toFixed(2)}ml, missed Blank by ${devBlank > 990 ? 'N/A' : devBlank.toFixed(2)}ml.`);
  } else {
    feedback.push(`Excellent endpoint accuracy!`);
  }

  // --- TIME (20 points max) ---
  const elapsed = state.timeElapsedSeconds || 0;
  let timeScore = 20;
  if (elapsed > 600) {
    const minutesOver = Math.floor((elapsed - 600) / 60);
    timeScore = Math.max(0, 20 - minutesOver);
  }
  breakdown.time = timeScore;

  const score = breakdown.procedure + breakdown.accuracy + breakdown.time;
  
  return {
    score,
    feedback,
    breakdown,
    status: score >= 80 ? 'success' : score >= 50 ? 'partial_success' : 'failed',
    tips
  };
};

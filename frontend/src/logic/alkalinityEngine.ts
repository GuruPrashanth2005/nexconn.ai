import type { SolutionColor } from './chemistryEngine';
import type { ScoreReport, ScoreBreakdown } from './scoringEngine';

export interface AlkalinityEvaluationState {
  endpointA: number;
  endpointB: number;
  finalVolumeA: number | null; // Volume recorded at phenolphthalein endpoint
  finalVolumeB: number | null; // Volume recorded at methyl orange endpoint
  hasSampleAdded: boolean;
  selectedTitrant: string | null; // 'HCl' expected
  selectedIndicatorPhenol: boolean;
  selectedIndicatorMethyl: boolean;
  isBuretteFilled: boolean;
  usedDropwiseNearEndpoint: boolean;
  swirledNearEndpoint: boolean;
  userInitialReading: string;
  userFinalReadingA: string;
  userFinalReadingB: string;
  userPAInput: string;
  userTAInput: string;
  userOHInput: string;
  userCO3Input: string;
  userHCO3Input: string;
  timeElapsedSeconds?: number;
}

export const generateAlkalinityEndpoints = () => {
  // A: 4.0 ml to 8.0 ml
  const rawA = 4.0 + Math.random() * 4.0;
  const endpointA = Math.round(rawA * 100) / 100;

  // B: must be > A by at least 5 ml, max 18.0
  const minB = endpointA + 5.0;
  const maxB = 18.0;
  const rawB = minB + Math.random() * (maxB - minB);
  const endpointB = Math.round(rawB * 100) / 100;

  return { endpointA, endpointB };
};

export const calculateAlkalinityColor = (
  volume: number,
  endpointA: number,
  endpointB: number,
  hasSample: boolean,
  hasPhenolphthalein: boolean,
  hasMethylOrange: boolean,
  isSwirling: boolean,
  lastSwirlVolume: number
): SolutionColor => {
  if (!hasSample) return { hex: '#ffffff', opacity: 0.0, isStable: true };

  // Clear water
  if (!hasPhenolphthalein && !hasMethylOrange) {
    return { hex: '#e2e8f0', opacity: 0.4, isStable: true };
  }

  const volumeSinceSwirl = Math.max(0, volume - lastSwirlVolume);
  const isStable = isSwirling || volumeSinceSwirl <= 0.15;

  if (!isStable && volume > 0.5) {
    return {
      hex: hasMethylOrange ? '#B35D1E' : '#E0809C', // Patchy orange or patchy pink
      opacity: 0.8,
      isStable: false,
      message: 'Mixing required for accurate endpoint.',
    };
  }

  // Phase 1: Phenolphthalein only
  if (hasPhenolphthalein && !hasMethylOrange) {
    const diffA = volume - endpointA;

    if (diffA < -1.0) {
      return { hex: '#F472B6', opacity: 0.6, isStable: true }; // Pink
    } else if (diffA >= -1.0 && diffA < -0.2) {
      const ratio = (volume - (endpointA - 1.0)) / 0.8;
      const hex = interpolateColor('#F472B6', '#FBCFE8', ratio);
      return { hex, opacity: 0.6, isStable: true, message: ratio > 0.7 ? 'Color change imminent. Slow down!' : undefined };
    } else if (diffA >= -0.2 && diffA < 0) {
      const ratio = (volume - (endpointA - 0.2)) / 0.2;
      const hex = interpolateColor('#FBCFE8', '#FDF2F8', ratio); // Very pale pink
      return { hex, opacity: 0.6, isStable: true, message: 'Transitioning to colourless. Use single-drop mode!' };
    } else if (diffA >= 0 && diffA <= 0.2) {
      return { hex: '#e2e8f0', opacity: 0.4, isStable: true, message: 'Phenolphthalein endpoint reached (Colourless)!' };
    } else {
      return { hex: '#e2e8f0', opacity: 0.4, isStable: true, message: diffA > 0.3 ? 'Overshot first endpoint!' : 'Slightly overshot first endpoint.' };
    }
  }

  // Phase 2: Methyl Orange added
  if (hasMethylOrange) {
    const diffB = volume - endpointB;

    if (diffB < -1.0) {
      return { hex: '#FDE047', opacity: 0.75, isStable: true }; // Yellow
    } else if (diffB >= -1.0 && diffB < -0.2) {
      const ratio = (volume - (endpointB - 1.0)) / 0.8;
      const hex = interpolateColor('#FDE047', '#FBBF24', ratio);
      return { hex, opacity: 0.75, isStable: true, message: ratio > 0.7 ? 'Color change imminent. Slow down!' : undefined };
    } else if (diffB >= -0.2 && diffB < 0) {
      const ratio = (volume - (endpointB - 0.2)) / 0.2;
      const hex = interpolateColor('#FBBF24', '#F97316', ratio); // Orange transition
      return { hex, opacity: 0.75, isStable: true, message: 'Transitioning to orange. Use single-drop mode!' };
    } else if (diffB >= 0 && diffB <= 0.2) {
      return { hex: '#EA580C', opacity: 0.8, isStable: true, message: 'Total Alkalinity endpoint reached (Orange)!' };
    } else {
      return { hex: '#B91C1C', opacity: 0.85, isStable: true, message: diffB > 0.3 ? 'Overshot total endpoint!' : 'Slightly overshot total endpoint.' };
    }
  }

  return { hex: '#e2e8f0', opacity: 0.4, isStable: true };
};

export const calculateAlkalinityResults = (volA: number, volB: number, normality = 0.02, sample = 20) => {
  const PA = Math.round((volA * normality * 50000) / sample * 10) / 10;
  const TA = Math.round((volB * normality * 50000) / sample * 10) / 10;

  let OH = 0, CO3 = 0, HCO3 = 0;
  const tol = 0.01;

  if (PA <= tol) { // Case 1: PA = 0
    HCO3 = TA;
  } else if (Math.abs(PA - TA) <= tol) { // Case 5: PA = TA
    OH = TA;
  } else if (Math.abs(PA - TA / 2) <= tol) { // Case 3: PA = 1/2 TA
    CO3 = 2 * PA;
  } else if (PA < TA / 2) { // Case 2: PA < 1/2 TA
    CO3 = 2 * PA;
    HCO3 = TA - 2 * PA;
  } else if (PA > TA / 2) { // Case 4: PA > 1/2 TA
    OH = 2 * PA - TA;
    CO3 = 2 * (TA - PA);
  }

  return {
    PA: Math.round(PA * 10) / 10,
    TA: Math.round(TA * 10) / 10,
    OH: Math.round(OH * 10) / 10,
    CO3: Math.round(CO3 * 10) / 10,
    HCO3: Math.round(HCO3 * 10) / 10
  };
};

export const evaluateAlkalinityTitration = (state: AlkalinityEvaluationState): ScoreReport => {
  const breakdown: ScoreBreakdown = {
    accuracy: 0,
    procedure: 0,
    time: 0,
    proceduralDetails: {},
  };

  const feedback: string[] = [];
  const tips: string[] = [];
  let procScore = 0;

  // Reagents & Titrant
  const correctReagents = state.hasSampleAdded && state.selectedTitrant === 'HCL';
  breakdown.proceduralDetails['Correct Reagents (HCl & Water)'] = correctReagents;
  if (correctReagents) procScore += 6;
  else tips.push('Always add the water sample first and use HCl for alkalinity titration.');

  // Burette Prepared
  breakdown.proceduralDetails['Burette Zeroed'] = state.isBuretteFilled;
  if (state.isBuretteFilled) procScore += 6;
  else tips.push('Fill the burette to exactly 0.00 ml before starting.');

  // Indicators
  const correctIndicators = state.selectedIndicatorPhenol && state.selectedIndicatorMethyl;
  breakdown.proceduralDetails['Indicators Added (Phenol & Methyl)'] = correctIndicators;
  if (correctIndicators) procScore += 6;
  else tips.push('You must use Phenolphthalein first, then Methyl Orange for total alkalinity.');

  // Technique
  const goodTechnique = state.usedDropwiseNearEndpoint && state.swirledNearEndpoint;
  breakdown.proceduralDetails['Swirling & Drop-wise Used'] = goodTechnique;
  if (goodTechnique) procScore += 6;
  else tips.push('Ensure you swirl the flask and use drop-wise addition near the endpoint.');

  // Logbook
  const actualRes = calculateAlkalinityResults(state.finalVolumeA || 0, state.finalVolumeB || 0);
  const uPA = parseFloat(state.userPAInput);
  const uTA = parseFloat(state.userTAInput);
  const logbookCorrect = Math.abs(actualRes.PA - uPA) <= 5.0 && Math.abs(actualRes.TA - uTA) <= 5.0;
  breakdown.proceduralDetails['Correct Logbook Calculations'] = logbookCorrect;
  if (logbookCorrect) procScore += 6;
  else tips.push('Logbook calculations are incorrect based on your recorded volumes.');

  breakdown.procedure = procScore;

  // Accuracy (50 max)
  let devA = 999;
  let accScore = 0;
  if (state.finalVolumeA !== null) {
    devA = Math.abs(state.finalVolumeA - state.endpointA);
    if (devA <= 0.1) accScore += 25;
    else if (devA <= 0.3) accScore += 12;
  }
  
  let devB = 999;
  if (state.finalVolumeB !== null) {
    devB = Math.abs(state.finalVolumeB - state.endpointB);
    if (devB <= 0.1) accScore += 25;
    else if (devB <= 0.3) accScore += 12;
  }
  breakdown.accuracy = accScore;

  if (devA > 0.3 || devB > 0.3) {
    feedback.push(`Endpoint accuracy poor. Missed PA by ${devA.toFixed(2)}ml, TA by ${devB.toFixed(2)}ml.`);
  } else {
    feedback.push(`Good accuracy! PA dev: ${devA.toFixed(2)}ml, TA dev: ${devB.toFixed(2)}ml.`);
  }

  // Time (20 max)
  const elapsed = state.timeElapsedSeconds || 0;
  let timeScore = 20;
  if (elapsed > 600) {
    timeScore = Math.max(0, 20 - Math.floor((elapsed - 600) / 60));
  }
  breakdown.time = timeScore;

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

// Helper function to interpolate between two hex colors
function interpolateColor(color1: string, color2: string, factor: number): string {
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

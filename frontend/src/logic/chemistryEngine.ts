// Chemistry logic for the EDTA titration simulation.

export interface ChemistryState {
  endpoint: number; // Random theoretical endpoint (14.5 ml to 18.5 ml)
  volume: number; // Current EDTA volume added (ml)
  hasSample: boolean; // Water sample added to flask
  hasIndicator: boolean; // EBT indicator added to flask
  hasEDTAInBurette: boolean; // EDTA filled in burette
  isSwirling: boolean; // Is flask being swirled
  lastSwirlVolume: number; // Volume at which last swirl occurred
  isTitrating: boolean; // Stopcock open
}

export interface SolutionColor {
  hex: string;
  opacity: number;
  isStable: boolean;
  message?: string;
}

/**
 * Generates a random theoretical endpoint between 14.5 ml and 18.5 ml
 */
export const generateEndpoint = (): number => {
  // Generate random endpoint with 2 decimal places precision
  const raw = 14.5 + Math.random() * 4.0;
  return Math.round(raw * 100) / 100;
};

/**
 * Calculates the solution color based on titration progress
 */
export const calculateSolutionColor = (
  volume: number,
  endpoint: number,
  hasSample: boolean,
  hasIndicator: boolean,
  isSwirling: boolean,
  lastSwirlVolume: number
): SolutionColor => {
  if (!hasSample) {
    // Empty flask
    return { hex: '#ffffff', opacity: 0.0, isStable: true };
  }

  if (!hasIndicator) {
    // Clear water sample
    return { hex: '#e2e8f0', opacity: 0.4, isStable: true };
  }

  // EBT indicator is present
  // Determine if mixing is stable
  // If the user has added more than 0.2 ml of titrant since the last swirl, the solution becomes patchy/unstable
  const volumeSinceSwirl = Math.max(0, volume - lastSwirlVolume);
  const isStable = isSwirling || volumeSinceSwirl <= 0.15;

  // Color Definitions (using hex colors for visualization)
  const WINE_RED = '#8D021F';
  const PURPLE = '#7A2270';
  const BLUE = '#2B6CB0';
  const DEEP_BLUE = '#1A365D';
  const PATCHY_UNMIXED = '#9A3A4E'; // Blotchy red-purple

  // If not stable near/after titration started, trigger warning and patchy color
  if (!isStable && volume > 0.5) {
    const warningMsg = 'Mixing required for accurate endpoint.';
    // If they are past the endpoint and haven't mixed, the color remains wine-reddish or patchy
    return {
      hex: PATCHY_UNMIXED,
      opacity: 0.8,
      isStable: false,
      message: warningMsg,
    };
  }

  // Titration progression stages
  if (volume === 0) {
    return { hex: WINE_RED, opacity: 0.8, isStable: true };
  }

  const diff = volume - endpoint;

  if (diff < -1.0) {
    // Far before endpoint: Stable Wine Red
    return { hex: WINE_RED, opacity: 0.8, isStable: true };
  } else if (diff >= -1.0 && diff < -0.2) {
    // Near endpoint: Wine red, but starts to get sensitive
    // Flickers slightly or shows light purple hints
    const ratio = (volume - (endpoint - 1.0)) / 0.8; // 0 to 1
    // Interpolate wine-red to purple
    const hex = interpolateColor(WINE_RED, PURPLE, ratio);
    return {
      hex,
      opacity: 0.8,
      isStable: true,
      message: ratio > 0.7 ? 'Color change imminent. Slow down!' : undefined,
    };
  } else if (diff >= -0.2 && diff < 0) {
    // Transition zone: Purple
    const ratio = (volume - (endpoint - 0.2)) / 0.2; // 0 to 1
    const hex = interpolateColor(PURPLE, BLUE, ratio);
    return {
      hex,
      opacity: 0.8,
      isStable: true,
      message: 'Transitioning to purple/blue. Use single-drop mode!',
    };
  } else if (diff >= 0 && diff <= 0.1) {
    // At Endpoint: Clear Blue
    return { hex: BLUE, opacity: 0.85, isStable: true, message: 'Endpoint reached!' };
  } else {
    // Overshot: Deep Blue
    return {
      hex: DEEP_BLUE,
      opacity: 0.9,
      isStable: true,
      message: diff > 0.3 ? 'Overshot! Endpoint missed.' : 'Slightly overshot.',
    };
  }
};

/**
 * Calculates total water hardness in mg/L of CaCO3
 * Formula: Hardness = (Volume of EDTA used * 1000) / Water sample volume (20ml)
 */
export const calculateHardness = (edtaVolume: number, waterSampleVolume = 20): number => {
  if (waterSampleVolume <= 0) return 0;
  // Hardness = (EDTA volume * 1000) / 20 = EDTA volume * 50
  return Math.round(((edtaVolume * 1000) / waterSampleVolume) * 10) / 10;
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

// phEngine.ts
// Handles the mathematical simulation of the pH meter

/**
 * Simulates a digital meter reading fluctuating before settling.
 * In a real application, you'd call this in a `requestAnimationFrame` or `setInterval` loop.
 */
export const calculatePHReading = (
  trueValue: number,
  timeElapsed: number, // Time since electrode submerged in seconds
  calibrationOffset: number,
  isClean: boolean
): number => {
  // If not clean, add a contamination penalty (drags pH towards neutral or previous buffer)
  const contaminationPenalty = isClean ? 0 : (7.0 - trueValue) * 0.15;
  const targetValue = trueValue + calibrationOffset + contaminationPenalty;
  
  // Simulated stabilization curve:
  // Starts wild, exponentially decays towards targetValue over ~3 seconds
  if (timeElapsed > 3.5) {
    // Return stabilized value with tiny random noise (+/- 0.01)
    const noise = (Math.random() - 0.5) * 0.02;
    return Math.round((targetValue + noise) * 100) / 100;
  }
  
  // High frequency noise that decays
  const decay = Math.exp(-timeElapsed * 1.5);
  const wildNoise = Math.sin(timeElapsed * 20) * decay * 1.5;
  const reading = targetValue + wildNoise;
  
  return Math.round(reading * 100) / 100;
};

export const getBufferTrueValue = (type: 'BUFFER_4' | 'BUFFER_7' | 'BUFFER_10') => {
  switch (type) {
    case 'BUFFER_4': return 4.01;
    case 'BUFFER_7': return 7.00;
    case 'BUFFER_10': return 10.01;
    default: return 7.00;
  }
};

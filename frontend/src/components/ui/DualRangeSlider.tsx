import React, { useState, useRef, useCallback } from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export const DualRangeSlider: React.FC<DualRangeSliderProps> = ({ min, max, value, onChange }) => {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);
  const minValRef = useRef(value[0]);
  const maxValRef = useRef(value[1]);

  const getPercent = useCallback(
    (val: number) => {
      const range = max - min || 1;
      return Math.max(0, Math.min(100, Math.round(((val - min) / range) * 100)));
    },
    [min, max]
  );

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxVal);
    setMinVal(val);
    minValRef.current = val;
    onChange([val, maxVal]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minVal);
    setMaxVal(val);
    maxValRef.current = val;
    onChange([minVal, val]);
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', height: '24px' }}>
      <input
        type="range"
        min={min}
        max={max}
        step={(max - min) / 100}
        value={minVal}
        onChange={handleMinChange}
        className="dual-slider-thumb-input"
        style={{ zIndex: minVal > max - 100 ? 5 : 3 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={(max - min) / 100}
        value={maxVal}
        onChange={handleMaxChange}
        className="dual-slider-thumb-input"
        style={{ zIndex: 4 }}
      />
      
      <div style={{ position: 'relative', width: '100%', height: '12px', overflow: 'hidden', borderRadius: '6px' }}>
        <div style={{ 
          position: 'absolute', 
          background: 'linear-gradient(to right, rgb(0,0,255), rgb(255,255,0), rgb(255,0,0))', 
          width: '100%',
          height: '100%', 
          zIndex: 0 
        }} />
        
        {/* Dimmer blocks outside the range */}
        <div className="dual-slider-dim" style={{ left: 0, width: `${getPercent(minVal)}%` }} />
        <div className="dual-slider-dim" style={{ left: `${getPercent(maxVal)}%`, width: `${100 - getPercent(maxVal)}%` }} />
      </div>
    </div>
  );
};

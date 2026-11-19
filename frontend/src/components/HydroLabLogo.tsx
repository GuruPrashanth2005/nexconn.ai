import React from 'react';

interface HydroLabLogoProps {
  color?: string;
  size?: number | string;
  className?: string;
}

export const HydroLabLogo: React.FC<HydroLabLogoProps> = ({ 
  color = 'currentColor', 
  size = 64,
  className = ''
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 120 120" 
      fill={color} 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Column */}
      <circle cx="52" cy="36" r="11" />
      <circle cx="40" cy="60" r="11" />
      <circle cx="28" cy="84" r="11" />
      <circle cx="16" cy="108" r="11" />

      {/* Right Column */}
      <circle cx="96" cy="12" r="11" />
      <circle cx="84" cy="36" r="11" />
      <circle cx="72" cy="60" r="11" />
      <circle cx="60" cy="84" r="11" />

      {/* Pinched Metaball Bridge between (40,60) and (72,60) */}
      <path d="M 40 49 Q 56 56 72 49 L 72 71 Q 56 64 40 71 Z" />
    </svg>
  );
};

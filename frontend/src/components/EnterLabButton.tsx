import React from 'react';
import { motion } from 'framer-motion';

interface EnterLabButtonProps {
  onClick: () => void;
}

export const EnterLabButton: React.FC<EnterLabButtonProps> = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 24px',
        background: 'rgba(20, 24, 39, 0.8)',
        border: 'none',
        borderRadius: '30px',
        cursor: 'pointer',
        overflow: 'hidden',
        outline: 'none',
        boxShadow: '0 0 15px rgba(139, 92, 246, 0.2), inset 0 0 10px rgba(139, 92, 246, 0.2)',
        zIndex: 1
      }}
    >
      {/* 3D Rotating Glowing Orb Effect behind text */}
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          width: '150%',
          height: '150%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(139, 92, 246, 0.8) 25%, transparent 50%, rgba(14, 165, 233, 0.8) 75%, transparent 100%)',
          zIndex: -2,
          opacity: 0.8
        }}
      />
      
      {/* Inner Mask to hollow out the center so the gradient only shows on the border edge */}
      <div style={{
        position: 'absolute',
        inset: '2px',
        background: 'linear-gradient(145deg, #13111C 0%, #1c152e 100%)',
        borderRadius: '30px',
        zIndex: -1
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Small 3D pulsing indicator */}
        <motion.div 
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 1, 0.6],
            rotateX: [0, 180, 360],
            rotateY: [0, 180, 360]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '4px',
            background: 'linear-gradient(135deg, #fff, var(--accent-cyan))',
            boxShadow: '0 0 10px #fff, 0 0 20px var(--accent-cyan)'
          }}
        />
        <span style={{ 
          color: '#fff', 
          fontWeight: 700, 
          letterSpacing: '1px', 
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          textShadow: '0 0 8px rgba(255,255,255,0.4)'
        }}>
          Enter Lab
        </span>
      </div>
    </motion.button>
  );
};

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedSplashIconProps {
  mode: string | null;
}

const AnimatedSplashIcon: React.FC<AnimatedSplashIconProps> = ({ mode }) => {
  if (mode === 'ASSESSMENT') {
    return (
      <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
        {/* Expanding Energy Waves */}
        <motion.div
          style={{ position: 'absolute', inset: 0, border: '2px solid rgba(168, 85, 247, 0.3)', borderRadius: '50%' }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{ position: 'absolute', inset: 0, border: '2px solid rgba(168, 85, 247, 0.3)', borderRadius: '50%' }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.25 }}
        />
        
        {/* Rotating Tech Ring */}
        <motion.div
          style={{ position: 'absolute', inset: '15px', border: '2px dashed rgba(168, 85, 247, 0.8)', borderRadius: '50%' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Assessment Shield Icon */}
        <motion.svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ filter: 'drop-shadow(0px 0px 8px rgba(168,85,247,0.6))' }}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <motion.path 
            d="M12 8v4" 
            animate={{ opacity: [0.3, 1, 0.3] }} 
            transition={{ duration: 2, repeat: Infinity }} 
          />
          <motion.circle 
            cx="12" cy="16" r="1" 
            animate={{ opacity: [0.3, 1, 0.3] }} 
            transition={{ duration: 2, repeat: Infinity }} 
          />
        </motion.svg>
      </div>
    );
  }

  // PRACTICE MODE
  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
        {/* Expanding Soft Waves */}
        <motion.div
          style={{ position: 'absolute', inset: 0, border: '2px solid rgba(16, 185, 129, 0.3)', borderRadius: '50%' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Reverse Rotating Tech Ring */}
        <motion.div
          style={{ position: 'absolute', inset: '15px', border: '2px dashed rgba(16, 185, 129, 0.6)', borderRadius: '50%' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Practice Flask Icon */}
        <motion.svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ filter: 'drop-shadow(0px 0px 8px rgba(16,185,129,0.5))' }}
        >
          <path d="M9 3h6v4l5 12v2H4v-2l5-12V3z" />
          {/* Liquid Level line */}
          <motion.path 
            d="M7 14h10" 
            animate={{ y: [-2, 2, -2] }} 
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} 
          />
          {/* Bubbles */}
          <motion.circle 
            cx="10" cy="18" r="1.5" 
            animate={{ y: [0, -8], opacity: [1, 0] }} 
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} 
          />
          <motion.circle 
            cx="14" cy="17" r="2" 
            animate={{ y: [0, -10], opacity: [1, 0] }} 
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.4, ease: "easeOut" }} 
          />
        </motion.svg>
    </div>
  );
};

export default AnimatedSplashIcon;

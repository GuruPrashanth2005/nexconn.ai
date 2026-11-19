import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { manuals, type Manual } from '../../data/manuals';
import { ManualReader } from './ManualReader';

export const StudentManuals: React.FC = () => {
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);

  if (selectedManual) {
    return <ManualReader manual={selectedManual} onBack={() => setSelectedManual(null)} />;
  }

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.5px', color: '#fff', margin: '0 0 8px 0' }}>Laboratory Manuals</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Comprehensive guides and procedures for your virtual experiments.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {manuals.map((manual, idx) => (
          <motion.div
            key={manual.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => setSelectedManual(manual)}
            style={{ 
              background: 'linear-gradient(145deg, rgba(14, 165, 233, 0.05) 0%, rgba(14, 165, 233, 0.01) 100%)', 
              padding: '30px', 
              borderRadius: '24px', 
              border: '1px solid rgba(14, 165, 233, 0.15)', 
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden'
            }}
            whileHover={{ y: -8, borderColor: 'rgba(14, 165, 233, 0.4)', backgroundColor: 'rgba(14, 165, 233, 0.08)' }}
          >
            <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h3 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 600 }}>{manual.title}</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', flex: 1 }}>{manual.description}</p>
              
              <div style={{ marginTop: '20px', color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                Read Manual <span>&rarr;</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

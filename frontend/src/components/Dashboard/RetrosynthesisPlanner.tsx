 
import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  ChevronUp, 
  ChevronDown,
  ArrowRight,
  Hexagon,
  Loader2
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface ChemicalEntity {
  name: string;
  formula: string;
  textRep?: string;
}

interface ReactionStep {
  step: number;
  reactant: ChemicalEntity;
  product: ChemicalEntity;
  reagents: string;
  catalysts: string;
  temperature: string;
  reactionType: string;
  reference: string;
  mechanism: string;
  relevance: string;
}

interface SyntheticRoute {
  name: string;
  viability: number;
  stepsCount: number;
  startingMaterialsCount: number;
  finalStartingMaterials: ChemicalEntity[];
  pathway: ReactionStep[];
}

interface RetrosynthesisData {
  target: string;
  routes: SyntheticRoute[];
}

const ChemicalCard: React.FC<{ chemical: ChemicalEntity, isStartingMaterial?: boolean }> = ({ chemical, isStartingMaterial = false }) => {
  const imageSrc = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(chemical.name)}/PNG?record_type=2d&image_size=large`;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: isStartingMaterial ? '260px' : '300px',
      height: isStartingMaterial ? '240px' : '280px',
      position: 'relative'
    }}>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
        {chemical.textRep ? (
          <div style={{ fontSize: '3rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '8px' }}>
            {chemical.textRep === 'O=O' ? (
              <span style={{ color: '#ef4444' }}>{chemical.textRep}</span>
            ) : chemical.textRep === 'HO OH' ? (
              <span><span style={{ color: '#ef4444' }}>HO</span> <span style={{ color: '#ef4444' }}>OH</span></span>
            ) : (
              chemical.textRep
            )}
          </div>
        ) : (
          <img 
            src={imageSrc} 
            alt={chemical.name} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
              objectFit: 'contain',
              transform: 'scale(1.15)',
              filter: 'invert(1) hue-rotate(180deg) contrast(1.2)', 
              mixBlendMode: 'screen' 
            }} 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </div>

      <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', textAlign: 'center', zIndex: 2 }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
          {chemical.name}
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
          {chemical.formula}
        </div>
      </div>
    </div>
  );
};

export const RetrosynthesisPlanner: React.FC = () => {
  const [targetMolecule, setTargetMolecule] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [retroData, setRetroData] = useState<RetrosynthesisData | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});
  const [downloadingRoute, setDownloadingRoute] = useState<string | null>(null);

  const handleDownloadPDF = async (route: { name: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Auto-expand the route if it isn't already expanded
    if (!expandedRoutes[route.name]) {
      setExpandedRoutes(prev => ({ ...prev, [route.name]: true }));
      // Give it a short moment to render
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setDownloadingRoute(route.name);
    
    const element = document.getElementById(`route-export-${route.name.replace(/\s+/g, '-')}`);
    if (!element) {
      setDownloadingRoute(null);
      return;
    }
    
    const opt = {
      margin:       10,
      filename:     `${retroData?.target.replace(/\s+/g, '_') || 'Molecule'}_${route.name.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0b1324' },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingRoute(null);
    }
  };

  const handleAnalyze = async (molecule = targetMolecule) => {
    if (!molecule.trim()) {
      setError('Please enter a target molecule.');
      return;
    }
    setTargetMolecule(molecule);
    setIsAnalyzing(true);
    setError('');
    setRetroData(null);

    try {
      const res = await axios.post('/api/v1/ai/retrosynthesis', {
        targetMolecule: molecule,
        engine: 'groq'
      });

      if (res.data.status === 'success') {
        setRetroData(res.data.data);
        const defaultExpanded: Record<string, boolean> = {};
        res.data.data.routes.forEach((r: unknown) => {
          defaultExpanded[(r as { name: string }).name] = true;
        });
        setExpandedRoutes(defaultExpanded);
      } else {
        setError('Failed to generate retrosynthesis pathway.');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error communicating with Dr. HydroAI. Please check your AI server/API limits.');
      } else {
        setError('Error communicating with Dr. HydroAI. Please check your AI server/API limits.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleRoute = (routeName: string) => {
    setExpandedRoutes(prev => ({ ...prev, [routeName]: !prev[routeName] }));
  };

  const glassStyle = {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    position: 'relative' as const,
    overflow: 'hidden' as const
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out', width: '100%' }}>
      
      {/* Search Header Container */}
      <div style={glassStyle}>
        <div style={{
          position: 'absolute', top: '-100px', right: '-50px', width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
              AI
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', margin: 0 }}>Dr. HydroAI Retrosynthesis Planner</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 24px 0' }}>
            AI-Powered Synthesis Route Discovery
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Enter Target Molecule (e.g. hydrogen peroxide)"
                value={targetMolecule}
                onChange={(e) => setTargetMolecule(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <button 
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing || !targetMolecule.trim()}
              style={{
                width: '100%',
                padding: '16px',
                background: isAnalyzing || !targetMolecule.trim()
                  ? 'rgba(14, 165, 233, 0.3)' 
                  : 'linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(2, 132, 199, 0.9) 100%)',
                color: '#fff',
                border: isAnalyzing || !targetMolecule.trim() ? '1px solid rgba(14, 165, 233, 0.2)' : '1px solid rgba(14, 165, 233, 0.5)',
                borderRadius: '12px',
                fontSize: '1.05rem',
                fontFamily: 'inherit',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                cursor: isAnalyzing || !targetMolecule.trim() ? 'wait' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isAnalyzing || !targetMolecule.trim() ? 'none' : '0 8px 32px rgba(14, 165, 233, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              {isAnalyzing ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                    <Hexagon size={20} />
                  </motion.div>
                  PLANNING SYNTHESIS...
                </>
              ) : (
                'PLAN SYNTHESIS'
              )}
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Or try an example: 
            {['Aspirin', 'Ibuprofen', 'Vanillin', 'Melatonin'].map(ex => (
              <button 
                key={ex}
                onClick={() => handleAnalyze(ex)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div style={{ color: '#fca5a5', textAlign: 'center', marginBottom: '20px' }}>{error}</div>}

      {/* Results Section */}
      {retroData && (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: '#fff', fontSize: '1.8rem', marginBottom: '40px', fontWeight: 600 }}>
            Proposed Synthetic Routes for <span style={{ color: 'var(--accent-cyan)' }}>{retroData.target}</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {retroData.routes.map((route, rIndex) => (
              <div key={rIndex} style={{
                ...glassStyle,
                padding: 0,
                marginBottom: '16px'
              }}>
                {/* Route Header */}
                <div 
                  onClick={() => toggleRoute(route.name)}
                  style={{
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)',
                    borderBottom: expandedRoutes[route.name] ? '1px solid rgba(255,255,255,0.05)' : 'none'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: '0 0 8px 0' }}>{route.name}</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {route.stepsCount} Steps <span style={{ margin: '0 8px' }}>|</span> {route.startingMaterialsCount} Starting Materials
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Viability: {route.viability}%</span>
                      <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${route.viability}%`, 
                          height: '100%', 
                          background: route.viability > 80 ? '#10b981' : '#f59e0b',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)' }}>
                      {downloadingRoute === route.name ? (
                        <Loader2 size={20} style={{ animation: 'spin 2s linear infinite' }} />
                      ) : (
                        <Download 
                          size={20} 
                          style={{ cursor: 'pointer' }} 
                          onClick={(e) => handleDownloadPDF(route, e)} 
                        />
                      )}
                      {expandedRoutes[route.name] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Route Body */}
                <AnimatePresence>
                  {expandedRoutes[route.name] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div id={`route-export-${route.name.replace(/\s+/g, '-')}`} style={{ padding: '32px' }}>
                        
                        {/* Final Starting Materials Block */}
                        <div style={{ 
                          background: 'rgba(0,0,0,0.2)', 
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '12px', 
                          padding: '24px',
                          marginBottom: '60px'
                        }}>
                          <div style={{ textAlign: 'center', color: 'var(--accent-cyan)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '20px' }}>
                            Final Starting Materials:
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            {route.finalStartingMaterials.map((mat, i) => (
                              <ChemicalCard key={i} chemical={mat} isStartingMaterial={true} />
                            ))}
                          </div>
                        </div>

                        {/* Pathway Timeline */}
                        <div style={{ position: 'relative' }}>
                          {/* Vertical glowing timeline line */}
                          <div style={{
                            position: 'absolute',
                            left: '32px',
                            top: 0,
                            bottom: 0,
                            width: '2px',
                            background: 'linear-gradient(to bottom, transparent, var(--accent-cyan), transparent)',
                            boxShadow: '0 0 10px var(--accent-cyan)'
                          }} />
                          {/* Dashed background line */}
                          <div style={{
                            position: 'absolute',
                            left: '26px',
                            top: 0,
                            bottom: 0,
                            width: '1px',
                            borderLeft: '1px dashed rgba(255,255,255,0.2)'
                          }} />

                          {route.pathway.map((step, sIndex) => (
                            <div key={sIndex} style={{ position: 'relative', paddingLeft: '80px', marginBottom: '60px' }}>
                              
                              {/* Step Node */}
                              <div style={{
                                position: 'absolute',
                                left: '20px',
                                top: '50px', // Center aligned with the reactant card
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.5)',
                                border: '2px solid var(--accent-cyan)',
                                color: 'var(--accent-cyan)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                zIndex: 2
                              }}>
                                {step.step}
                              </div>

                              {/* 3-Column Layout: Reactant -> Conditions -> Product */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                {/* Reactant */}
                                <ChemicalCard chemical={step.reactant} />

                                {/* Arrow & Conditions */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '180px' }}>
                                  <div style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px', textAlign: 'center' }}>
                                    {step.reactionType}
                                  </div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>
                                    Ref: {step.reference}
                                  </div>
                                  
                                  <ArrowRight size={24} color="var(--accent-cyan)" style={{ marginBottom: '16px' }} />

                                  <div style={{ 
                                    background: 'rgba(0,0,0,0.2)', 
                                    borderRadius: '8px', 
                                    padding: '16px',
                                    width: '100%',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                  }}>
                                    <div style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>
                                      Reaction Conditions
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', fontSize: '0.85rem' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>Reagents:</span>
                                      <span style={{ color: '#fff' }}>{step.reagents}</span>
                                      
                                      <span style={{ color: 'var(--text-muted)' }}>Catalysts:</span>
                                      <span style={{ color: '#fff' }}>{step.catalysts}</span>
                                      
                                      <span style={{ color: 'var(--text-muted)' }}>Temperature:</span>
                                      <span style={{ color: '#fff' }}>{step.temperature}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Product */}
                                <ChemicalCard chemical={step.product} />
                              </div>

                              {/* Reaction Details Accordion */}
                              <div style={{ marginTop: '24px', maxWidth: '600px' }}>
                                <div 
                                  onClick={() => setExpandedDetails(expandedDetails === `${route.name}-${step.step}` ? null : `${route.name}-${step.step}`)}
                                  style={{
                                    border: '1px solid rgba(2, 132, 199, 0.4)',
                                    borderRadius: '8px',
                                    background: 'rgba(0,0,0,0.2)',
                                    overflow: 'hidden',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <div style={{ 
                                    padding: '12px 16px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                    borderBottom: expandedDetails === `${route.name}-${step.step}` ? '1px solid rgba(2, 132, 199, 0.2)' : 'none'
                                  }}>
                                    Reaction Details
                                    {expandedDetails === `${route.name}-${step.step}` ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </div>
                                  
                                  <AnimatePresence>
                                    {expandedDetails === `${route.name}-${step.step}` && (
                                      <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        style={{ overflow: 'hidden' }}
                                      >
                                        <div style={{ padding: '16px', fontSize: '0.9rem' }}>
                                          <div style={{ marginBottom: '12px' }}>
                                            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '4px' }}>Mechanism:</div>
                                            <div style={{ color: 'var(--accent-cyan)' }}>{step.mechanism}</div>
                                          </div>
                                          <div>
                                            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '4px' }}>Relevance:</div>
                                            <div style={{ color: 'var(--accent-cyan)' }}>{step.relevance}</div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                              
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

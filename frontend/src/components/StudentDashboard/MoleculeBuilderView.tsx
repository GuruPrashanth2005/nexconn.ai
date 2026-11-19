/* eslint-disable */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MoleculeBuilder } from '../3D/MoleculeBuilder';
import type { AtomNode, BondEdge, LooseAtom } from '../3D/MoleculeBuilder';
import { Check, FlaskConical, Play, Pause, RotateCcw, Loader2, Info, Thermometer, Search, Settings2, Activity, MessageSquare, Send, Layers, Cloud, Maximize2, Minimize2, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import elementsDataRaw from '../../data/elements_new.json';
import { SpectroscopyPanel } from './SpectroscopyPanel';
import { RetrosynthesisTree } from './RetrosynthesisTree';

// Get ALL 118 elements for the selector
const availableElements = elementsDataRaw.elements.map((e: any) => ({ 
  symbol: e.symbol, 
  name: e.name, 
  color: e["cpk-hex"] ? '#' + e["cpk-hex"] : '#a0a0a0', 
  radius: 0.6,
  atomicNumber: e.number
}));

type ReactionConditions = {
  temperature: number;
  pressure: number;
  solvent: string;
};

export const MoleculeBuilderView: React.FC = () => {
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [isReacting, setIsReacting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Resizer State
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const isResizingRef = useRef(false);
  const [replayMechanismKey, setReplayMechanismKey] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      
      const newWidth = e.clientX - 72; // Subtract Explorer sidebar width
      
      if (newWidth >= 300 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      setIsDragging(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Conditions State
  const [conditions, setConditions] = useState<ReactionConditions>({
    temperature: 25,
    pressure: 1,
    solvent: 'None'
  });
  const [showConditions, setShowConditions] = useState(true);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const unexpandedLastMessageRef = useRef<HTMLDivElement>(null);
  const unexpandedTypingIndicatorRef = useRef<HTMLDivElement>(null);
  const unexpandedInputRef = useRef<HTMLInputElement>(null);

  const expandedLastMessageRef = useRef<HTMLDivElement>(null);
  const expandedTypingIndicatorRef = useRef<HTMLDivElement>(null);
  const expandedInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isChatOpen && !isChatting) {
      setTimeout(() => {
        if (isChatExpanded) {
          expandedInputRef.current?.focus();
        } else {
          unexpandedInputRef.current?.focus();
        }
      }, 100);
    }
  }, [isChatOpen, isChatting, isChatExpanded]);

  useEffect(() => {
    setTimeout(() => {
      const activeTypingRef = isChatExpanded ? expandedTypingIndicatorRef : unexpandedTypingIndicatorRef;
      const activeLastMessageRef = isChatExpanded ? expandedLastMessageRef : unexpandedLastMessageRef;

      if (isChatting && activeTypingRef.current) {
        activeTypingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (activeLastMessageRef.current) {
        activeLastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [chatHistory, isChatting, isChatExpanded]);
  
  // 3D View State
  const [isRotationPaused, setIsRotationPaused] = useState(false);
  const [showInternalStructure, setShowInternalStructure] = useState(false);
  const [showElectronCloud, setShowElectronCloud] = useState(false);
  
  // Modes
  const [analysisMode, setAnalysisMode] = useState<'synthesis' | 'retrosynthesis' | 'spectroscopy'>('synthesis');
  const [targetMolecule, setTargetMolecule] = useState('');

  const [aiResult, setAiResult] = useState<{
    isValid: boolean;
    name: string;
    formula: string;
    explanation: string;
    thermodynamics?: {
      isExothermic: boolean;
      enthalpyDelta: string;
      activationEnergy: number;
    };
    reactantsNeeded?: string[];
    nfpa?: {
      health: number;
      fire: number;
      reactivity: number;
      special: string;
    };
    properties?: {
      boilingPoint: string;
      polarity: string;
      irPeaks: string;
      nmrShifts: string;
    };
    retrosynthesisTree?: {
      nodes: any[];
      edges: any[];
    };
    atoms: AtomNode[];
    bonds: BondEdge[];
  } | null>(null);

  // Filter elements
  const filteredElements = useMemo(() => {
    if (searchQuery.trim() === '') {
      const commonSymbols = ['H', 'C', 'N', 'O', 'Na', 'Mg', 'P', 'S', 'Cl', 'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Br', 'I'];
      return availableElements.filter(e => commonSymbols.includes(e.symbol));
    }
    return availableElements.filter(e => 
      e.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Map simple string symbols to full LooseAtom objects
  const looseAtoms: LooseAtom[] = selectedElements.map((symbol, i) => {
    const el = availableElements.find(e => e.symbol === symbol)!;
    return {
      id: `${symbol}-${i}`,
      symbol: el.symbol,
      color: el.color,
      radius: el.radius
    };
  });

  const handleAddElement = (symbol: string) => {
    if (selectedElements.length < 15 && !isReacting && !isAnalyzing) {
      setSelectedElements([...selectedElements, symbol]);
    }
  };

  const handleRemoveElement = (index: number) => {
    if (isReacting || isAnalyzing) return;
    const newElements = [...selectedElements];
    newElements.splice(index, 1);
    setSelectedElements(newElements);
  };

  const handleReact = async () => {
    if (analysisMode !== 'retrosynthesis' && selectedElements.length === 0) return;
    if (analysisMode === 'retrosynthesis' && !targetMolecule) return;
    
    setIsAnalyzing(true);
    setAiResult(null);

    const payloadElements = analysisMode === 'retrosynthesis' ? targetMolecule : selectedElements;

    try {
      const res = await fetch('/api/v1/ai/simulate-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elements: payloadElements, conditions, engine: 'groq', analysisMode })
      });
      const data = await res.json();
      
      if (data.status === 'success' && data.data) {
        // Map the atoms to include color and radius from elementsData
        const enrichedAtoms = (data.data.atoms || []).map((atom: any) => {
          const el = availableElements.find(e => e.symbol === atom.symbol);
          return {
            ...atom,
            position: atom.position ? [atom.position[0] * 2.5, atom.position[1] * 2.5, atom.position[2] * 2.5] : [0, 0, 0],
            color: el ? el.color : '#06b6d4', // fallback cyan
            radius: el ? el.radius : 1
          };
        });
        const enrichedData = { ...data.data, atoms: enrichedAtoms };
        setAiResult(enrichedData);
        if (data.data.isValid) {
          setIsReacting(true);
        }
      } else {
        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      console.error(error);
      setAiResult({
        isValid: false,
        name: "Error",
        formula: "",
        explanation: "AI Dr. Hydro is currently offline or overloaded. Please try again.",
        atoms: [],
        bonds: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setIsReacting(false);
    setAiResult(null);
    setSelectedElements([]);
    setChatHistory([]);
  };

  const [isPredictingSpectra, setIsPredictingSpectra] = useState(false);

  const handleSpectroscopy = async () => {
    if (!aiResult || !aiResult.name) return;
    setIsPredictingSpectra(true);

    try {
      const payloadElements = analysisMode === 'retrosynthesis' ? targetMolecule : selectedElements;
      const res = await fetch('/api/v1/ai/simulate-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elements: payloadElements, conditions, engine: 'groq', analysisMode: 'spectroscopy' })
      });
      const data = await res.json();
      
      if (data.status === 'success' && data.data && data.data.properties) {
        setAiResult(prev => {
          if (!prev) return prev;
          return { ...prev, properties: data.data.properties };
        });
      }
    } catch (error) {
      console.error('Spectroscopy error:', error);
    } finally {
      setIsPredictingSpectra(false);
    }
  };



  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);

    try {
      const res = await fetch('/api/v1/ai/beaker-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: chatHistory,
          context: {
            elements: analysisMode === 'synthesis' ? selectedElements : [targetMolecule],
            analysisMode: analysisMode,
            aiResult: aiResult
          }
        })
      });
      const data = await res.json();
      if (data.status === 'success' && data.data?.reply) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
      } else {
        throw new Error('Chat failed');
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Connection to Dr. Hydro interrupted.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      
      {/* Left Sidebar: Unified Controls & Analysis Stack */}
      <div className="sidebar-panel" style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth, height: '100%', borderRight: '1px solid var(--panel-border)', background: 'transparent', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '24px', zIndex: 10 }}>
        
        {/* Mode Selector */}
            <div className="toggle-switch" style={{ marginBottom: '16px' }}>
          {['synthesis', 'retrosynthesis'].map(mode => (
            <div
              key={mode}
              className={`toggle-option ${analysisMode === mode ? 'active' : ''}`}
              onClick={() => { setAnalysisMode(mode as any); handleReset(); }}
              style={{ textTransform: 'capitalize' }}
            >
              {mode}
            </div>
          ))}
        </div>

        {analysisMode === 'retrosynthesis' ? (
          <div className="glass-card" style={{ marginBottom: '16px' }}>
            <h3 className="glass-card-title">Target Molecule</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>Enter the name of the molecule you want to synthesize.</p>
            <input 
              type="text" 
              placeholder="e.g. Aspirin, Methane..." 
              value={targetMolecule}
              onChange={e => setTargetMolecule(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--panel-border)', padding: '10px', borderRadius: '8px', color: '#fff' }}
            />
          </div>
        ) : (
          <div className="glass-card" style={{ marginBottom: '16px' }}>
            {/* Reaction Flask */}
            <h3 className="glass-card-title">
              <span>Reaction Flask</span>
              <span>{selectedElements.length}/15</span>
            </h3>
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '16px', minHeight: '120px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignContent: 'flex-start' }}>
              {selectedElements.length === 0 ? (
                <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', marginTop: '10px' }}>
                  <FlaskConical size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.85rem' }}>Add elements to drop into beaker</div>
                </div>
              ) : (
                selectedElements.map((symbol, i) => {
                  const el = availableElements.find(e => e.symbol === symbol);
                  return (
                    <div key={i} onClick={() => handleRemoveElement(i)} style={{ background: `${el?.color}20`, border: `1px solid ${el?.color}80`, borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: '#fff', cursor: (isReacting || isAnalyzing) ? 'default' : 'pointer', position: 'relative', opacity: (isReacting || isAnalyzing) ? 0.5 : 1 }}>
                      {symbol}
                      {(!isReacting && !isAnalyzing) && <div style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>×</div>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {((analysisMode !== 'retrosynthesis' && selectedElements.length > 0) || (analysisMode === 'retrosynthesis' && targetMolecule)) && !isReacting && (
            <button className="btn btn-secondary" disabled={isAnalyzing} onClick={() => { setSelectedElements([]); setTargetMolecule(''); }} style={{ flex: 1 }}>
              Clear
            </button>
          )}

          {analysisMode === 'synthesis' && (
            <button className="btn btn-secondary" onClick={() => setShowConditions(!showConditions)}>
              <Settings2 size={16} /> Conditions
            </button>
          )}

          {!isReacting && ((analysisMode !== 'retrosynthesis' && selectedElements.length > 0) || (analysisMode === 'retrosynthesis' && targetMolecule)) && (
            <button className="btn btn-primary" disabled={isAnalyzing} onClick={handleReact} style={{ flex: 2 }}>
              {isAnalyzing ? <><Loader2 size={16} className="spin" /> Computing...</> : <><Play size={16} /> {analysisMode === 'synthesis' ? 'React! (AI)' : 'Analyze (AI)'}</>}
            </button>
          )}

          {isReacting && !aiResult?.properties && (
            <button className="btn btn-secondary" disabled={isPredictingSpectra} onClick={handleSpectroscopy} style={{ flex: 2, background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)', color: '#fff' }}>
              {isPredictingSpectra ? <><Loader2 size={16} className="spin" /> Predicting...</> : <><Activity size={16} /> Predict Spectra</>}
            </button>
          )}

          {isReacting && (
            <button className="btn btn-danger" onClick={handleReset} style={{ flex: 1 }}>
              <RotateCcw size={16} /> Reset
            </button>
          )}
        </div>

        {/* Environmental Conditions */}
        {analysisMode !== 'retrosynthesis' && (
          <div className="glass-card" style={{ marginBottom: '16px' }}>
            <h3 onClick={() => setShowConditions(!showConditions)} className="glass-card-title" style={{ cursor: 'pointer', marginBottom: showConditions ? '16px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Settings2 size={16} color="var(--accent-cyan)" /> Conditions</div>
            </h3>
            {showConditions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Temperature */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Thermometer size={14} /> Temperature
                    </span>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{conditions.temperature}°C</span>
                  </div>
                  <input 
                    type="range" min="-273" max="3000" value={conditions.temperature}
                    onChange={(e) => setConditions({ ...conditions, temperature: parseInt(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                  />
                </div>
                {/* Pressure */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pressure</span>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{conditions.pressure} atm</span>
                  </div>
                  <input 
                    type="range" min="1" max="100" value={conditions.pressure}
                    onChange={(e) => setConditions({ ...conditions, pressure: parseInt(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                  />
                </div>
                {/* Solvent */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Solvent</span>
                  </div>
                  <select 
                    value={conditions.solvent}
                    onChange={(e) => setConditions({ ...conditions, solvent: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--panel-border)', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="None">None (Gas/Vacuum)</option>
                    <option value="Water">Water (H2O)</option>
                    <option value="Ethanol">Ethanol</option>
                    <option value="Benzene">Benzene</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Elements Picker */}
        {analysisMode !== 'retrosynthesis' && (
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className="glass-card-title">
              <span>Elements Explorer</span>
              <span>{searchQuery ? 'Search' : 'Common'}</span>
            </h3>
            
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search 118 elements..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '8px 8px 8px 32px', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredElements.map(el => (
                <button 
                  key={el.symbol}
                  onClick={() => handleAddElement(el.symbol)}
                  disabled={selectedElements.length >= 15 || isReacting || isAnalyzing}
                  style={{ 
                    background: `${el.color}25`, 
                    border: `1px solid ${el.color}66`, 
                    borderRadius: '12px', 
                    padding: '8px 4px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (selectedElements.length >= 15 || isReacting || isAnalyzing) ? 'not-allowed' : 'pointer',
                    opacity: (selectedElements.length >= 15 || isReacting || isAnalyzing) ? 0.5 : 1,
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease-out',
                    position: 'relative',
                    minHeight: '70px'
                  }}
                  onMouseOver={(e) => { 
                    if (!(selectedElements.length >= 15 || isReacting || isAnalyzing)) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.background = `${el.color}40`;
                    }
                  }}
                  onMouseOut={(e) => { 
                    if (!(selectedElements.length >= 15 || isReacting || isAnalyzing)) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = `${el.color}25`;
                    }
                  }}
                >
                  <span style={{ position: 'absolute', top: '4px', left: '6px', fontSize: '0.6rem', fontWeight: 600, opacity: 0.9, color: el.color }}>{el.atomicNumber}</span>
                  <strong style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', textShadow: `0 0 10px ${el.color}b3`, marginTop: '6px' }}>{el.symbol}</strong>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{el.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis (Now stacked below controls) */}
        {aiResult && (
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {aiResult?.isValid && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <Check size={18} /> Valid Reaction
          </div>
        )}
        
        {aiResult && !aiResult.isValid && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            No Reaction
          </div>
        )}

        {/* AI Explanation & Thermodynamics/Spectroscopy Panel */}
        {aiResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ color: aiResult.isValid ? 'var(--accent-cyan)' : 'var(--danger)' }}>
                <Info size={24} />
              </div>
              <div>
                <h3 className="glass-card-title" style={{ marginBottom: '8px' }}>Dr. Hydro's Analysis</h3>
                  <div className="markdown-chat" style={{ marginTop: '8px', color: 'var(--text-main)', lineHeight: '1.6', fontSize: '1rem' }}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]} 
                      rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
                    >
                      {aiResult.explanation.replace(/\\n/g, '\n').replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$').replace(/\\\(/g, '$').replace(/\\\)/g, '$').replace(/\\circC/g, '^\\circ C').replace(/\\circ C/g, '^\\circ C')}
                    </ReactMarkdown>
                  </div>
              </div>
            </div>

            {/* Retrosynthesis Reactants */}
            {aiResult.reactantsNeeded && (
              <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--accent-purple)' }}>
                  <Search size={24} />
                </div>
                <div>
                  <h3 className="glass-card-title" style={{ marginBottom: '8px' }}>Required Precursors</h3>
                  <ul style={{ margin: 0, color: 'var(--text-main)', paddingLeft: '20px', fontSize: '0.9rem' }}>
                    {aiResult.reactantsNeeded.map((r, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}



            {/* Spectroscopy Properties */}
            {aiResult.properties && (
              <SpectroscopyPanel properties={aiResult.properties} />
            )}



            {/* Retrosynthesis Tree (React Flow) */}
            {aiResult.retrosynthesisTree && (
              <RetrosynthesisTree data={aiResult.retrosynthesisTree} />
            )}

            {/* Thermodynamics Graph */}
            {aiResult.thermodynamics && (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ color: aiResult.thermodynamics.isExothermic ? 'var(--danger)' : 'var(--accent-blue)' }}>
                    <Activity size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 className="glass-card-title" style={{ marginBottom: '8px' }}>Reaction Coordinate</h3>
                    <div style={{ display: 'flex', gap: '24px', marginTop: '12px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Reaction Type</div>
                        <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem' }}>{aiResult.thermodynamics.isExothermic ? 'Exothermic' : 'Endothermic'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Enthalpy (ΔH)</div>
                        <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem' }}>{aiResult.thermodynamics.enthalpyDelta}</div>
                      </div>
                    </div>

                    {/* Energy Graph */}
                    {aiResult.thermodynamics.activationEnergy !== undefined && (
                      <div style={{ width: '100%', height: '180px', background: 'var(--bg-primary)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '16px 16px 16px 0' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { stage: 'Reactants', energy: 0 },
                            { stage: 'Transition', energy: Number(aiResult.thermodynamics.activationEnergy) || 50 },
                            { stage: 'Products', energy: parseFloat(String(aiResult.thermodynamics.enthalpyDelta).replace(/[^\d.-]/g, '')) || (aiResult.thermodynamics.isExothermic ? -100 : 100) }
                          ]} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                            <XAxis dataKey="stage" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', backdropFilter: 'blur(12px)' }}
                              itemStyle={{ color: 'var(--accent-cyan)' }}
                            />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                            <Line 
                              type="monotone" 
                              dataKey="energy" 
                              stroke={aiResult.thermodynamics.isExothermic ? 'var(--danger)' : 'var(--accent-blue)'} 
                              strokeWidth={3} 
                              dot={{ fill: 'var(--bg-primary)', strokeWidth: 2, r: 4, stroke: aiResult.thermodynamics.isExothermic ? 'var(--danger)' : 'var(--accent-blue)' }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          isResizingRef.current = true;
          setIsDragging(true);
        }}
        style={{
          width: '16px',
          background: isDragging ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
          cursor: 'col-resize',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease',
        }}
        onMouseOver={(e) => !isDragging && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseOut={(e) => !isDragging && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
      >
        <div style={{ width: '4px', height: '24px', borderRadius: '2px', background: isDragging ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.3)', transition: 'background 0.2s ease' }} />
      </div>

      {/* Transparent overlay while dragging to capture all mouse events smoothly over 3D canvas */}
      {isDragging && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, cursor: 'col-resize' }} 
        />
      )}

      {/* Right Area: 3D Workspace */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative', background: 'radial-gradient(circle at center, #1b253b 0%, #0a0f1d 100%)' }}>
        <MoleculeBuilder 
          looseAtoms={looseAtoms} 
          isReacting={isReacting}
          compoundAtoms={aiResult?.atoms}
          compoundBonds={aiResult?.bonds}
          isRotationPaused={isRotationPaused}
          showInternalStructure={showInternalStructure}
          showElectronCloud={showElectronCloud}
          replayMechanismKey={replayMechanismKey}
        />
        
        {/* Reaction Header Overlay */}
        <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, textAlign: 'center', pointerEvents: 'none', background: 'rgba(10, 15, 29, 0.5)', padding: '12px 32px', borderRadius: '32px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <h2 style={{ margin: '0 0 4px 0', color: aiResult?.isValid ? 'var(--accent-cyan)' : 'var(--text-main)', fontSize: '1.4rem', fontWeight: 700 }}>
            {aiResult?.isValid ? aiResult.name : 'Reaction Beaker'}
          </h2>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
            {aiResult?.isValid ? (
              <>
                <span>Formula:</span>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {aiResult.formula.replace(/\$\$/g, '$')}
                </ReactMarkdown>
              </>
            ) : 'Add elements, configure conditions, and hit React!'}
          </div>
        </div>

        {/* Action Buttons Overlay */}
        {aiResult && (
          <div className="action-buttons-overlay" style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: 'rgba(10, 15, 29, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', backdropFilter: 'blur(16px)', zIndex: 1001, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', width: 'max-content', maxWidth: '90%', overflowX: 'auto', scrollbarWidth: 'none' }}>


            {isReacting && aiResult?.isValid && (
              <button 
                onClick={() => setIsRotationPaused(!isRotationPaused)}
                style={{ background: isRotationPaused ? 'rgba(6, 182, 212, 0.15)' : 'transparent', border: 'none', color: isRotationPaused ? 'var(--accent-cyan)' : 'var(--text-muted)', padding: '0 12px', height: '36px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {isRotationPaused ? <Play size={18} /> : <Pause size={18} />}
                {isRotationPaused ? 'Resume Rotation' : 'Pause Rotation'}
              </button>
            )}

            {isReacting && aiResult?.isValid && (
              <button 
                onClick={() => setReplayMechanismKey(prev => prev + 1)}
                title="Replay Mechanism Animation"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0 12px', height: '36px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <RotateCcw size={18} />
                Replay
              </button>
            )}
            
            {aiResult?.isValid && (
              <button 
                onClick={() => setShowInternalStructure(!showInternalStructure)}
                title="Toggle X-Ray View"
                style={{ background: showInternalStructure ? 'rgba(6, 182, 212, 0.15)' : 'transparent', border: 'none', color: showInternalStructure ? 'var(--accent-cyan)' : 'var(--text-muted)', padding: '0 12px', height: '36px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <Layers size={18} />
                X-Ray View
              </button>
            )}

            {aiResult?.isValid && (
              <button 
                onClick={() => setShowElectronCloud(!showElectronCloud)}
                title="Toggle Electron Cloud Viewer"
                style={{ background: showElectronCloud ? 'rgba(168, 85, 247, 0.15)' : 'transparent', border: 'none', color: showElectronCloud ? 'var(--accent-purple)' : 'var(--text-muted)', padding: '0 12px', height: '36px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <Cloud size={18} />
                Electron Cloud
              </button>
            )}

            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              title="Toggle AI Chat"
              style={{ background: isChatOpen ? 'rgba(6, 182, 212, 0.15)' : 'transparent', border: 'none', color: isChatOpen ? 'var(--accent-cyan)' : 'var(--text-muted)', padding: '0 12px', height: '36px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <MessageSquare size={18} />
              Dr. Hydro AI
            </button>
          </div>
        )}

        {/* Big Chat Modal Overlay Backdrop */}
        <div 
          onClick={() => setIsChatOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            opacity: isChatOpen && isChatExpanded ? 1 : 0,
            visibility: isChatOpen && isChatExpanded ? 'visible' : 'hidden',
            pointerEvents: isChatOpen && isChatExpanded ? 'auto' : 'none',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* Unexpanded Chat Modal (Fits perfectly in 3D Space Right Area) */}
        <div style={{
             position: 'absolute',
             bottom: '100px',
             left: '24px',
             right: '24px',
             height: '400px',
             maxHeight: 'calc(100% - 124px)',
             zIndex: 1001,
             background: 'rgba(10, 15, 29, 0.85)',
             backdropFilter: 'blur(24px)',
             border: '1px solid rgba(255,255,255,0.05)',
             borderRadius: '24px',
             display: 'flex',
             flexDirection: 'column',
             overflow: 'hidden',
             boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
             opacity: isChatOpen && !isChatExpanded ? 1 : 0,
             visibility: isChatOpen ? 'visible' : 'hidden',
             pointerEvents: isChatOpen && !isChatExpanded ? 'auto' : 'none',
             transform: isChatOpen && !isChatExpanded ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
             transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {(() => {
            const ui = (
              <>
               {/* Header */}
               <div style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                color: '#fff',
                padding: '24px 32px',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem' }}>
                   <MessageSquare size={28} color="var(--accent-cyan)" />
                   Ask Dr. Hydro
                 </div>
                 <div style={{ display: 'flex', gap: '12px' }}>
                   <button 
                    onClick={() => setIsChatExpanded(!isChatExpanded)} 
                    title={isChatExpanded ? "Restore" : "Expand"}
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '50%', 
                      width: '40px', height: '40px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', color: '#fff', 
                      transition: 'all 0.2s' 
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                   >
                     {isChatExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                   </button>
                   <button 
                    onClick={() => {
                      setIsChatOpen(false);
                      setIsChatExpanded(false);
                    }}
                    title="Close"
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '50%', 
                      width: '40px', height: '40px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', color: '#fff', 
                      transition: 'all 0.2s' 
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                   >
                     <X size={18} />
                   </button>
                 </div>
               </div>
               
               {/* Messages Area */}
               <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', background: 'transparent' }}>
                {chatHistory.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px', fontSize: '1rem' }}>
                    Ask Dr. Hydro about the current reaction in your beaker! For example: "Why didn't this react?" or "What if I increased the temperature to 500C?"
                  </div>
                )}
                {chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    ref={idx === chatHistory.length - 1 ? unexpandedLastMessageRef : null}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      padding: '16px 20px',
                      borderRadius: msg.role === 'user' ? '20px 20px 8px 20px' : '20px 20px 20px 8px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'none',
                      maxWidth: '85%',
                      fontSize: '1rem',
                      lineHeight: '1.6'
                    }}
                  >
                    <div className="markdown-chat">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]} 
                        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
                      >
                        {msg.content.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$').replace(/\\\(/g, '$').replace(/\\\)/g, '$').replace(/\\circC/g, '^\\circ C').replace(/\\circ C/g, '^\\circ C')}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div ref={unexpandedTypingIndicatorRef} style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '12px' }}>
                    Dr. Hydro is analyzing...
                  </div>
                )}
               </div>
  
               {/* Input Area */}
               <div style={{ padding: '24px 32px 24px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', background: 'transparent' }}>
                 <form onSubmit={handleChatSubmit} style={{ 
                   display: 'flex', 
                   gap: '16px', 
                   flex: 1,
                 }}>
                   <input 
                    ref={unexpandedInputRef}
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your question..."
                    disabled={isChatting}
                    autoFocus
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                      borderRadius: '30px',
                      color: '#fff',
                      padding: '0 24px',
                      height: '56px',
                      outline: 'none',
                      fontSize: '1.1rem',
                      fontFamily: 'inherit'
                    }}
                   />
                   <button 
                    type="submit"
                    disabled={isChatting || !chatMessage.trim()}
                    style={{ 
                      width: '56px', 
                      height: '56px', 
                      borderRadius: '16px', 
                      background: 'var(--accent-cyan)',
                      color: '#000',
                      border: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer',
                      opacity: isChatting || !chatMessage.trim() ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      animation: isChatting ? 'pulse 1.5s infinite' : 'none'
                    }}
                   >
                     {isChatting ? <Loader2 size={24} className="spin" /> : <Send size={24} />}
                   </button>
                 </form>
               </div>
              </>
            );
            return ui;
          })()}
        </div>

        {/* Expanded Chat Modal (Full Screen) */}
        <div style={{
             position: 'fixed',
             top: '5vh',
             bottom: '5vh',
             left: '10vw',
             right: '10vw',
             zIndex: 1002,
             background: 'rgba(10, 15, 29, 0.85)',
             backdropFilter: 'blur(24px)',
             border: '1px solid rgba(255,255,255,0.05)',
             borderRadius: '24px',
             display: 'flex',
             flexDirection: 'column',
             overflow: 'hidden',
             boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
             opacity: isChatOpen && isChatExpanded ? 1 : 0,
             visibility: isChatOpen && isChatExpanded ? 'visible' : 'hidden',
             pointerEvents: isChatOpen && isChatExpanded ? 'auto' : 'none',
             transform: isChatOpen && isChatExpanded ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
             transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {(() => {
            const ui = (
              <>
               {/* Header */}
               <div style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                color: '#fff',
                padding: '24px 32px',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem' }}>
                   <MessageSquare size={28} color="var(--accent-cyan)" />
                   Ask Dr. Hydro
                 </div>
                 <div style={{ display: 'flex', gap: '12px' }}>
                   <button 
                    onClick={() => setIsChatExpanded(!isChatExpanded)} 
                    title={isChatExpanded ? "Restore" : "Expand"}
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '50%', 
                      width: '40px', height: '40px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', color: '#fff', 
                      transition: 'all 0.2s' 
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                   >
                     {isChatExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                   </button>
                   <button 
                    onClick={() => {
                      setIsChatOpen(false);
                      setIsChatExpanded(false);
                    }}
                    title="Close"
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '50%', 
                      width: '40px', height: '40px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', color: '#fff', 
                      transition: 'all 0.2s' 
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                   >
                     <X size={18} />
                   </button>
                 </div>
               </div>
               
               {/* Messages Area */}
               <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', background: 'transparent' }}>
                {chatHistory.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px', fontSize: '1rem' }}>
                    Ask Dr. Hydro about the current reaction in your beaker! For example: "Why didn't this react?" or "What if I increased the temperature to 500C?"
                  </div>
                )}
                {chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    ref={idx === chatHistory.length - 1 ? expandedLastMessageRef : null}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      padding: '16px 20px',
                      borderRadius: msg.role === 'user' ? '20px 20px 8px 20px' : '20px 20px 20px 8px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'none',
                      maxWidth: '85%',
                      fontSize: '1rem',
                      lineHeight: '1.6'
                    }}
                  >
                    <div className="markdown-chat">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.content.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$').replace(/\\\(/g, '$').replace(/\\\)/g, '$')}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div ref={expandedTypingIndicatorRef} style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '12px' }}>
                    Dr. Hydro is analyzing...
                  </div>
                )}
               </div>
  
               {/* Input Area */}
               <div style={{ padding: '24px 32px 24px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', background: 'transparent' }}>
                 <form onSubmit={handleChatSubmit} style={{ 
                   display: 'flex', 
                   gap: '16px', 
                   flex: 1,
                 }}>
                   <input 
                    ref={expandedInputRef}
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your question..."
                    disabled={isChatting}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                      borderRadius: '30px',
                      color: '#fff',
                      padding: '0 24px',
                      height: '56px',
                      outline: 'none',
                      fontSize: '1.1rem',
                      fontFamily: 'inherit'
                    }}
                   />
                   <button 
                    type="submit"
                    disabled={isChatting || !chatMessage.trim()}
                    style={{ 
                      width: '56px', 
                      height: '56px', 
                      borderRadius: '16px', 
                      background: 'var(--accent-cyan)',
                      color: '#000',
                      border: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer',
                      opacity: isChatting || !chatMessage.trim() ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      animation: isChatting ? 'pulse 1.5s infinite' : 'none'
                    }}
                   >
                     {isChatting ? <Loader2 size={24} className="spin" /> : <Send size={24} />}
                   </button>
                 </form>
               </div>
              </>
            );
            return ui;
          })()}
        </div>

      </div>
    </div>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Search, Send, MessageSquare, ChevronLeft, ChevronRight, ChevronDown, Maximize2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Atom3DModel } from '../3D/Atom3DModel';
import { logActivity } from '../../services/analyticsService';

import { CrystalLatticeModel } from '../3D/CrystalLatticeModel';
import { DualRangeSlider } from '../ui/DualRangeSlider';
import elementsDataRaw from '../../data/elements_new.json';
const elementsData = elementsDataRaw.elements.map((e: any) => ({ ...e, atomicNumber: e.number }));

const PROPERTIES = [
  { label: 'Melting Point', key: 'melt', unit: '°C', convert: (k: number) => k - 273.15 },
  { label: 'Density', key: 'density', unit: 'g/cm³', convert: (v: number) => v },
  { label: 'Boiling Point', key: 'boil', unit: '°C', convert: (k: number) => k - 273.15 },
  { label: 'Electronegativity', key: 'electronegativity', unit: '', convert: (v: number) => v },
  { label: '1st Ionization', key: 'ionization', unit: 'kJ/mol', convert: (v: number) => v },
  { label: 'Electron Affinity', key: 'electron_affinity', unit: 'kJ/mol', convert: (v: number) => v },
  { label: 'Specific Heat', key: 'specific_heat', unit: 'J/(g·°C)', convert: (v: number) => v }
];

const CLASSIFICATIONS = [
  { label: 'Category', key: 'category' },
  { label: 'Block', key: 'block' },
  { label: 'State', key: 'phase' }
];


const IsotopeControlCard = ({ elementData, neutronOverride, setNeutronOverride }: { elementData: any, neutronOverride: number | undefined, setNeutronOverride: (n: number | undefined) => void }) => {
  const protons = elementData.atomicNumber || elementData.number;
  const standardNeutrons = Math.round((elementData.mass || elementData.atomic_mass || 0)) - protons;
  const currentNeutrons = neutronOverride !== undefined ? neutronOverride : standardNeutrons;
  const massNumber = protons + currentNeutrons;

  const isStable = Math.abs(currentNeutrons - standardNeutrons) <= 2;

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} />
        Isotope Viewer
      </h3>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>
            <sup style={{ fontSize: '1.5rem', marginLeft: '-4px' }}>{massNumber}</sup>{elementData.symbol}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
            {elementData.name}-{massNumber}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Stability</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: isStable ? '#4ade80' : '#ef4444' }}>
            {isStable ? 'Stable' : 'Radioactive'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Protons (Z)</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ef4444' }}>{protons}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Neutrons (N)</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8' }}>{currentNeutrons}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max={Math.max(protons * 3, standardNeutrons + 10)} 
            value={currentNeutrons} 
            onChange={(e) => setNeutronOverride(parseInt(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#06b6d4' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
            <button onClick={() => setNeutronOverride(undefined)} style={{ background: 'transparent', border: 'none', color: '#06b6d4', cursor: 'pointer', padding: 0 }}>Reset to Standard ({standardNeutrons})</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function StudentExplorer() {
  const { elementId } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const selectedItem: any = useMemo(() => {
    if (!elementId) return null;
    return (elementsData as any[]).find(
      e => e.symbol.toLowerCase() === elementId.toLowerCase() || 
           e.name.toLowerCase() === elementId.toLowerCase() ||
           e.atomicNumber.toString() === elementId
    ) || null;
  }, [elementId]);
  
  const [loadingContext, setLoadingContext] = useState(false);
  const [aiInfo, setAiInfo] = useState<any>(null);
  
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatting, setChatting] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'structure' | 'crystal' | 'isotopes' | 'ai'>('structure');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [neutronOverride, setNeutronOverride] = useState<number | undefined>(undefined);

  // New State for Advanced Filter
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterType, setFilterType] = useState<'property' | 'classification'>('classification');
  const [filterKey, setFilterKey] = useState<string>('category');
  // For selecting a specific classification value to highlight
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [propertyRange, setPropertyRange] = useState<[number, number] | null>(null);

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const typingIndicatorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setTimeout(() => setNeutronOverride(undefined), 0);
    if (elementId && selectedItem) {
      logActivity('ELEMENT_SEARCH', { element: selectedItem.name, symbol: selectedItem.symbol });
    }
  }, [elementId, selectedItem]);

  useEffect(() => {
    if (rightPanelTab === 'ai' && !chatting) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [rightPanelTab, chatting]);

  useEffect(() => {
    if (rightPanelTab === 'ai') {
      setTimeout(() => {
        if (chatting && typingIndicatorRef.current) {
          typingIndicatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (lastMessageRef.current) {
          lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  }, [chatHistory, chatting, rightPanelTab]);


  const fetchAIInfo = async (name: string) => {
    setLoadingContext(true);
    try {
      const response = await axios.post('/api/v1/ai/compound-info', { query: name });
      setAiInfo(response.data.data);
    } catch (err) {
      console.error("Failed to fetch AI info", err);
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      setTimeout(() => {
        setCurrentCardIndex(0);
        setRightPanelTab('structure');
        setAiInfo(null);
        setChatHistory([]);
        fetchAIInfo(selectedItem.name);
      }, 0);
    } else {
      setTimeout(() => {
        setAiInfo(null);
        setChatHistory([]);
      }, 0);
    }
  }, [selectedItem]);

  const handleSelectElement = (el: any) => {
    if (el) {
      navigate(`/student-dashboard/explorer/periodic/${el.symbol.toLowerCase()}`);
    } else {
      navigate(`/student-dashboard/explorer/periodic`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const found = elementsData.find(el => el.name.toLowerCase() === searchQuery.toLowerCase() || el.symbol.toLowerCase() === searchQuery.toLowerCase());
    if (found) {
      handleSelectElement(found);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedItem) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatting(true);

    try {
      const response = await axios.post('/api/v1/ai/compound-chat', {
        query: selectedItem.name,
        message: userMsg,
        history: chatHistory
      });
      setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.data.reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Connection to Dr. Hydro failed.' }]);
    } finally {
      setChatting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    if (!category) return '255, 255, 255';
    if (category.includes('alkali metal')) return '239, 68, 68'; 
    if (category.includes('alkaline earth')) return '249, 115, 22'; 
    if (category.includes('transition metal')) return '234, 179, 8'; 
    if (category.includes('post-transition')) return '34, 197, 94'; 
    if (category.includes('metalloid')) return '20, 184, 166'; 
    if (category.includes('reactive nonmetal') || category === 'diatomic nonmetal' || category === 'polyatomic nonmetal') return '56, 189, 248'; 
    if (category.includes('noble gas')) return '168, 85, 247'; 
    if (category.includes('lanthanide')) return '236, 72, 153'; 
    if (category.includes('actinide')) return '244, 63, 94'; 
    return '255, 255, 255'; 
  };

  const getBlockColor = (block: string) => {
    if (block === 's') return '239, 68, 68';
    if (block === 'p') return '56, 189, 248';
    if (block === 'd') return '234, 179, 8';
    if (block === 'f') return '34, 197, 94';
    return '255, 255, 255';
  };

  const getPhaseColor = (phase: string) => {
    if (phase === 'Solid') return '34, 197, 94';
    if (phase === 'Liquid') return '56, 189, 248';
    if (phase === 'Gas') return '239, 68, 68';
    return '255, 255, 255';
  };

  const getHeatmapColor = (value: number, min: number, max: number) => {
    if (value == null || isNaN(value)) return '100, 100, 100'; 
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
    
    if (ratio < 0.5) {
      const normalized = ratio * 2; 
      const r = Math.floor(normalized * 255);
      const g = Math.floor(normalized * 255);
      const b = Math.floor((1 - normalized) * 255);
      return `${r}, ${g}, ${b}`;
    } else {
      const normalized = (ratio - 0.5) * 2; 
      const r = 255;
      const g = Math.floor((1 - normalized) * 255);
      const b = 0;
      return `${r}, ${g}, ${b}`;
    }
  };

  const activePropertyStats = useMemo(() => {
    if (filterType !== 'property') return null;
    const prop = PROPERTIES.find(p => p.key === filterKey);
    if (!prop) return null;

    let min = Infinity;
    let max = -Infinity;
    
    elementsData.forEach(el => {
      const rawVal = (el as any)[filterKey];
      if (rawVal != null && typeof rawVal === 'number') {
        const val = prop.convert(rawVal);
        if (val < min) min = val;
        if (val > max) max = val;
      }
    });
    
    if (min === Infinity) return null;
    return { min, max };
  }, [filterType, filterKey]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-main)', borderRadius: '0', display: 'flex', flexDirection: 'column' }}>
      
      {!selectedItem && (
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 4px 0', color: '#fff' }}>Periodic Explorer</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Interactive 2D Grid Engine</p>
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search Element" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '10px 16px 10px 40px',
                  borderRadius: '8px',
                  color: '#fff',
                  width: '300px'
                }}
              />
            </div>
            <button type="submit" style={{ background: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '8px', padding: '0 16px', fontWeight: 600, cursor: 'pointer' }}>
              Search
            </button>
          </form>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {!selectedItem ? (
          <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 50, marginLeft: '10px' }}>
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button 
                  onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    padding: '8px 16px', borderRadius: '8px', color: '#fff', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {filterType === 'classification' ? CLASSIFICATIONS.find(c => c.key === filterKey)?.label : PROPERTIES.find(p => p.key === filterKey)?.label}
                  <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: filterMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                </button>

                {filterMenuOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: '8px',
                    background: 'rgba(30,30,30,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '16px', display: 'flex', gap: '24px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)',
                    width: '380px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '1px' }}>PROPERTY</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {PROPERTIES.map(prop => (
                          <div 
                            key={prop.key}
                            onClick={() => { setFilterType('property'); setFilterKey(prop.key); setActiveHighlight(null); setPropertyRange(null); setFilterMenuOpen(false); }}
                            style={{
                              padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                              background: filterType === 'property' && filterKey === prop.key ? 'var(--accent-cyan)' : 'transparent',
                              color: filterType === 'property' && filterKey === prop.key ? '#000' : '#fff',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              fontWeight: filterType === 'property' && filterKey === prop.key ? 600 : 400
                            }}
                          >
                            <span>{prop.label}</span>
                            <span style={{ fontSize: '0.75rem', opacity: filterType === 'property' && filterKey === prop.key ? 0.9 : 0.5 }}>{prop.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '1px' }}>CLASSIFICATION</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {CLASSIFICATIONS.map(cls => (
                          <div 
                            key={cls.key}
                            onClick={() => { setFilterType('classification'); setFilterKey(cls.key); setActiveHighlight(null); setPropertyRange(null); setFilterMenuOpen(false); }}
                            style={{
                              padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                              background: filterType === 'classification' && filterKey === cls.key ? 'var(--accent-cyan)' : 'transparent',
                              color: filterType === 'classification' && filterKey === cls.key ? '#000' : '#fff',
                              fontWeight: filterType === 'classification' && filterKey === cls.key ? 600 : 400
                            }}
                          >
                            {cls.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {activeHighlight && (
                <button 
                  onClick={() => setActiveHighlight(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)',
                    padding: '8px 16px', borderRadius: '8px', color: '#ef4444', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Reset Filter
                </button>
              )}
            </div>

            <div style={{
              display: 'grid',
              margin: '0 auto',
              gridTemplateColumns: 'repeat(18, minmax(45px, 1fr))',
              gridTemplateRows: 'repeat(10, minmax(65px, 1fr))',
              gap: '6px',
              width: '100%',
              maxWidth: '100%',
              padding: '10px'
            }}>
              
              <div style={{
                gridColumn: '3 / 13',
                gridRow: '1 / 4',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '20px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                margin: '10px 20px'
              }}>
                {filterType === 'classification' && filterKey === 'category' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                    {['alkali metal', 'alkaline earth', 'transition metal', 'post-transition', 'metalloid', 'reactive nonmetal', 'noble gas', 'lanthanide', 'actinide'].map(cat => {
                      const isActive = activeHighlight === cat;
                      return (
                        <div 
                          key={cat} 
                          onClick={() => setActiveHighlight(isActive ? null : cat)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
                            background: isActive ? `rgba(${getCategoryColor(cat)}, 0.2)` : 'rgba(255,255,255,0.02)',
                            borderRadius: '20px', border: `1px solid ${isActive ? `rgba(${getCategoryColor(cat)}, 0.8)` : 'rgba(255,255,255,0.1)'}`,
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: `rgb(${getCategoryColor(cat)})` }} />
                          <span style={{ color: isActive ? '#fff' : 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                            {cat === 'reactive nonmetal' ? 'Other Nonmetal' : cat}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filterType === 'classification' && filterKey === 'block' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                    {['s', 'p', 'd', 'f'].map(block => {
                      const isActive = activeHighlight === block;
                      return (
                        <div 
                          key={block} 
                          onClick={() => setActiveHighlight(isActive ? null : block)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px',
                            background: isActive ? `rgba(${getBlockColor(block)}, 0.2)` : 'rgba(255,255,255,0.02)',
                            borderRadius: '20px', border: `1px solid ${isActive ? `rgba(${getBlockColor(block)}, 0.8)` : 'rgba(255,255,255,0.1)'}`,
                            cursor: 'pointer'
                          }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: `rgb(${getBlockColor(block)})` }} />
                          <span style={{ color: isActive ? '#fff' : 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 600 }}>{block}-Block</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filterType === 'classification' && filterKey === 'phase' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                    {['Solid', 'Liquid', 'Gas'].map(phase => {
                      const isActive = activeHighlight === phase;
                      return (
                        <div 
                          key={phase} 
                          onClick={() => setActiveHighlight(isActive ? null : phase)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px',
                            background: isActive ? `rgba(${getPhaseColor(phase)}, 0.2)` : 'rgba(255,255,255,0.02)',
                            borderRadius: '20px', border: `1px solid ${isActive ? `rgba(${getPhaseColor(phase)}, 0.8)` : 'rgba(255,255,255,0.1)'}`,
                            cursor: 'pointer'
                          }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: `rgb(${getPhaseColor(phase)})` }} />
                          <span style={{ color: isActive ? '#fff' : 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{phase}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filterType === 'property' && activePropertyStats && (
                  <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                      <span>{activePropertyStats.min.toFixed(2)} {PROPERTIES.find(p=>p.key===filterKey)?.unit}</span>
                      <span>{activePropertyStats.max.toFixed(2)} {PROPERTIES.find(p=>p.key===filterKey)?.unit}</span>
                    </div>
                    <DualRangeSlider 
                      key={filterKey}
                      min={activePropertyStats.min} 
                      max={activePropertyStats.max} 
                      value={propertyRange || [activePropertyStats.min, activePropertyStats.max]}
                      onChange={(val: [number, number]) => setPropertyRange(val)}
                    />
                  </div>
                )}
              </div>

              {elementsData.map(el => {
                let isFaded = false;
                let rgb = '255, 255, 255';
                let displayValue = null;

                if (filterType === 'classification') {
                  if (filterKey === 'category') {
                    rgb = getCategoryColor(el.category);
                    if (activeHighlight) {
                      if (activeHighlight === 'reactive nonmetal') {
                        isFaded = !(el.category.includes('reactive nonmetal') || el.category === 'diatomic nonmetal' || el.category === 'polyatomic nonmetal');
                      } else {
                        isFaded = !el.category.includes(activeHighlight);
                      }
                    }
                  } else if (filterKey === 'block') {
                    rgb = getBlockColor(el.block);
                    if (activeHighlight && el.block !== activeHighlight) isFaded = true;
                  } else if (filterKey === 'phase') {
                    rgb = getPhaseColor(el.phase);
                    if (activeHighlight && el.phase !== activeHighlight) isFaded = true;
                  }
                } else if (filterType === 'property' && activePropertyStats) {
                  const prop = PROPERTIES.find(p => p.key === filterKey);
                  const rawVal = (el as any)[filterKey];
                  if (rawVal != null && typeof rawVal === 'number' && prop) {
                    const val = prop.convert(rawVal);
                    if (propertyRange) {
                      if (val < propertyRange[0] || val > propertyRange[1]) {
                        isFaded = true;
                      }
                    }
                    
                    if (Math.abs(val) < 10) {
                      displayValue = val.toFixed(2);
                    } else {
                      displayValue = val.toFixed(1);
                    }
                    rgb = getHeatmapColor(val, activePropertyStats.min, activePropertyStats.max);
                  } else {
                    rgb = '100, 100, 100'; // Missing data
                  }
                }
                
                return (
                  <div 
                    key={el.symbol} 
                    onClick={() => handleSelectElement(el)}
                    style={{
                      gridColumn: el.xpos,
                      gridRow: el.ypos,
                      background: `rgba(${rgb}, 0.15)`,
                      borderRadius: '12px',
                      border: `1px solid rgba(${rgb}, 0.4)`,
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-out',
                      padding: '4px',
                      position: 'relative',
                      boxShadow: `0 4px 12px rgba(0,0,0,0.2)`,
                      color: '#fff', 
                      opacity: isFaded ? 0.15 : 1,
                      filter: isFaded ? 'grayscale(100%)' : 'none',
                      minWidth: 0,
                      minHeight: 0,
                      overflow: 'hidden'
                    }}
                    onMouseOver={(e) => { 
                      e.currentTarget.style.transform = 'scale(1.1)'; 
                      e.currentTarget.style.zIndex = '10'; 
                      e.currentTarget.style.background = `rgba(${rgb}, 0.3)`;
                      e.currentTarget.style.border = `1px solid rgba(${rgb}, 1)`;
                      e.currentTarget.style.boxShadow = `0 10px 30px rgba(${rgb}, 0.4)`;
                    }}
                    onMouseOut={(e) => { 
                      e.currentTarget.style.transform = 'scale(1)'; 
                      e.currentTarget.style.zIndex = '1'; 
                      e.currentTarget.style.background = `rgba(${rgb}, 0.15)`;
                      e.currentTarget.style.border = `1px solid rgba(${rgb}, 0.4)`;
                      e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.2)`;
                    }}
                  >
                    <span style={{ position: 'absolute', top: '2px', left: '4px', fontSize: '0.6rem', fontWeight: 600, opacity: 0.8, color: `rgb(${rgb})` }}>{el.atomicNumber}</span>
                    <strong style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.1, margin: '10px 0 0 0', textShadow: `0 0 10px rgba(${rgb}, 0.8)` }}>{el.symbol}</strong>
                    {filterType === 'property' && displayValue != null ? (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 1, marginTop: '2px' }}>{displayValue}</span>
                    ) : (
                      <span style={{ fontSize: '0.55rem', fontWeight: 500, opacity: 0.7, textTransform: 'capitalize', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', marginTop: '2px' }}>{el.name.toLowerCase()}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', gap: '20px', padding: '20px', background: 'var(--bg-main)', overflow: 'hidden' }}>
            <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '10px', position: 'relative', minHeight: 0 }}>
              <div style={{ 
                position: 'relative',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0
              }}>
                {/* Removed navigation buttons from here */}
                <div style={{
                  width: '90px', height: '90px',
                  background: `rgba(${getCategoryColor(selectedItem.category)}, 0.1)`, border: `2px solid rgba(${getCategoryColor(selectedItem.category)}, 0.4)`,
                  borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 30px rgba(${getCategoryColor(selectedItem.category)}, 0.2)`
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: `rgba(${getCategoryColor(selectedItem.category)}, 0.8)` }}>{selectedItem.atomicNumber}</span>
                  <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{selectedItem.symbol}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 4px 0', color: '#fff' }}>{selectedItem.name}</h2>
                      <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {selectedItem.category}
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsExpanded(true)} 
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      title="Expand View"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {rightPanelTab === 'isotopes' ? (
                  <IsotopeControlCard elementData={selectedItem} neutronOverride={neutronOverride} setNeutronOverride={setNeutronOverride} />
                ) : (
                  <>
                    <button 
                      onClick={() => setCurrentCardIndex(currentCardIndex === 0 ? 5 : currentCardIndex - 1)} 
                      style={{ 
                        position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', 
                        background: 'rgba(255, 255, 255, 0.85)', border: '1px solid rgba(255,255,255,0.9)', 
                        borderLeft: 'none', borderRadius: '0 12px 12px 0', padding: '16px 4px', 
                        color: '#333', cursor: 'pointer', 
                        opacity: 0.4, 
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '2px 0 8px rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.padding = '20px 8px';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.opacity = '0.4';
                        e.currentTarget.style.padding = '16px 4px';
                      }}
                    >
                      <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                    
                    <button 
                      onClick={() => setCurrentCardIndex(currentCardIndex === 5 ? 0 : currentCardIndex + 1)} 
                      style={{ 
                        position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', 
                        background: 'rgba(255, 255, 255, 0.85)', border: '1px solid rgba(255,255,255,0.9)', 
                        borderRight: 'none', borderRadius: '12px 0 0 12px', padding: '16px 4px', 
                        color: '#333', cursor: 'pointer', 
                        opacity: 0.4, 
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '-2px 0 8px rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.padding = '20px 8px';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.opacity = '0.4';
                        e.currentTarget.style.padding = '16px 4px';
                      }}
                    >
                      <ChevronRight size={20} strokeWidth={3} />
                    </button>
                    
                  <div style={{
                    display: 'flex', height: '100%', width: '600%', 
                    transform: `translateX(-${currentCardIndex * (100/6)}%)`,
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                  
                  {/* CARD 1: OVERVIEW & VISUALS */}
                  <div style={{ width: `${100/6}%`, height: '100%', padding: '0 4px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Overview & Visuals</h3>
                    {selectedItem.image?.url && (
                      <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        <img src={selectedItem.image.url} alt={selectedItem.image.title || selectedItem.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                        {selectedItem.image.title && (
                          <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(0,0,0,0.5)' }}>
                            {selectedItem.image.title}
                          </div>
                        )}
                      </div>
                    )}
                    {selectedItem.summary && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.9rem', color: '#e0e0e0', lineHeight: 1.6 }}>{selectedItem.summary}</div>
                      </div>
                    )}
                  </div>

                  {/* CARD 2: GENERAL PROPERTIES */}
                  <div style={{ width: `${100/6}%`, height: '100%', padding: '0 4px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>General Properties</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Type</div>
                        <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{selectedItem.category || '-'}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Group / Period</div>
                        <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>{selectedItem.group || '-'} / {selectedItem.period || '-'}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Phase @ STP</div>
                        <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>{selectedItem.phase || '-'}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Block</div>
                        <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600, textTransform: 'uppercase' }}>{selectedItem.block || '-'}</div>
                      </div>
                    </div>
                    
                    <div style={{ background: 'rgba(0,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Common Ions</div>
                      <div style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                        {loadingContext ? <Loader2 className="animate-spin inline" size={16} /> : (aiInfo?.commonIons || 'N/A')}
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: ATOMIC DETAILS */}
                  <div style={{ width: `${100/6}%`, height: '100%', padding: '0 4px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Atomic Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Avg. Mass</div>
                        <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>{selectedItem.mass || selectedItem.atomic_mass || '-'} <span style={{fontSize:'0.75rem', opacity:0.5}}>u</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Valence e⁻</div>
                        <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>{selectedItem.shells ? selectedItem.shells[selectedItem.shells.length - 1] : '-'}</div>
                      </div>
                    </div>
                    
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Configuration</div>
                      <div style={{ fontSize: '1rem', color: 'var(--accent-cyan)', fontWeight: 600, fontFamily: 'monospace' }}>
                        {selectedItem.electron_configuration_semantic || selectedItem.electron_configuration || '-'}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>{selectedItem.number}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Protons</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>{Math.round((selectedItem.mass || selectedItem.atomic_mass || 0) - selectedItem.number)}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Neutrons</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>{selectedItem.number}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Electrons</div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Key Isotopes</div>
                      {loadingContext ? (
                        <div style={{ textAlign: 'center', padding: '10px' }}><Loader2 className="animate-spin inline" size={16} /></div>
                      ) : aiInfo?.keyIsotopes && Array.isArray(aiInfo.keyIsotopes) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {aiInfo.keyIsotopes.map((iso: any, i: number) => (
                            <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ color: '#fff', fontWeight: 600 }}>{iso.isotope}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                <div>{iso.neutrons} n⁰</div>
                                <div style={{ color: 'var(--accent-cyan)' }}>{iso.stability}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.9rem', color: '#fff' }}>N/A</div>
                      )}
                    </div>
                  </div>

                  {/* CARD 4: THERMODYNAMICS & PHYSICAL PROPERTIES */}
                  <div style={{ width: `${100/6}%`, height: '100%', padding: '0 4px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Thermodynamics & Physical</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Melting Point</div>
                        <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{selectedItem.melt ? (selectedItem.melt - 273.15).toFixed(1) : 'N/A'} <span style={{fontSize:'0.65rem', opacity:0.5}}>°C</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Boiling Point</div>
                        <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{selectedItem.boil ? (selectedItem.boil - 273.15).toFixed(1) : 'N/A'} <span style={{fontSize:'0.65rem', opacity:0.5}}>°C</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Density</div>
                        <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{selectedItem.density || 'N/A'} <span style={{fontSize:'0.65rem', opacity:0.5}}>g/cm³</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Specific Heat</div>
                        <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{selectedItem.molar_heat && (selectedItem.mass || selectedItem.atomic_mass) ? (selectedItem.molar_heat / (selectedItem.mass || selectedItem.atomic_mass)).toFixed(3) : 'N/A'} <span style={{fontSize:'0.65rem', opacity:0.5}}>J/g°C</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Atomic Radius</div>
                        <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{loadingContext ? <Loader2 className="animate-spin inline" size={12} /> : (aiInfo?.atomicRadius || 'N/A')}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Phase @ STP</div>
                        <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{selectedItem.phase || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: CHEMICAL REACTIVITY */}
                  <div style={{ width: `${100/6}%`, height: '100%', padding: '0 4px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Chemical Reactivity</h3>
                    
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Oxidation States</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {loadingContext ? <Loader2 className="animate-spin inline" size={14} /> : 
                          (aiInfo?.oxidationStates || 'N/A').split(',').map((state: string, i: number) => (
                            <span key={i} style={{ background: 'rgba(0,255,255,0.1)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                              {state.trim()}
                            </span>
                          ))
                        }
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Electronegativity (Pauling)</div>
                        <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>{selectedItem.electronegativity_pauling || 'N/A'}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Electron Affinity</div>
                        <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>{selectedItem.electron_affinity !== undefined && selectedItem.electron_affinity !== null ? selectedItem.electron_affinity : 'N/A'} <span style={{fontSize:'0.75rem', opacity:0.5}}>kJ/mol</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>1st Ionization Energy</div>
                        <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>{selectedItem.ionization_energies?.[0] || 'N/A'} <span style={{fontSize:'0.75rem', opacity:0.5}}>kJ/mol</span></div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: HISTORY & SPECTRA */}
                  <div style={{ width: `${100/6}%`, height: '100%', padding: '0 4px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>History & Spectra</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Discovery Year</div>
                        <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>{loadingContext ? <Loader2 className="animate-spin inline" size={14} /> : (aiInfo?.discoveryYear || 'N/A')}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Discovered By</div>
                        <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedItem.discovered_by || 'Unknown'}</div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Appearance</div>
                      <div style={{ fontSize: '0.9rem', color: '#fff', textTransform: 'capitalize' }}>{selectedItem.appearance || 'Unknown'}</div>
                    </div>

                    {selectedItem.spectral_img && (
                      <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Emission Spectrum</div>
                        <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
                          <img src={selectedItem.spectral_img} alt={`${selectedItem.name} emission spectrum`} style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block', borderRadius: '4px' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                </>
                )}

                {rightPanelTab === 'structure' && (
                  <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '6px', zIndex: 10 }}>
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <div key={idx} style={{ 
                        width: currentCardIndex === idx ? '24px' : '8px', height: '8px', borderRadius: '4px', 
                        background: currentCardIndex === idx ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s ease'
                      }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: 1, position: 'relative', background: '#0a0a0a', border: '1px solid var(--panel-border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
                <button onClick={() => handleSelectElement(null)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                {/* 3D Structure View */}
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                  opacity: (rightPanelTab === 'structure' || rightPanelTab === 'isotopes') ? 1 : 0, 
                  visibility: (rightPanelTab === 'structure' || rightPanelTab === 'isotopes') ? 'visible' : 'hidden', 
                  pointerEvents: (rightPanelTab === 'structure' || rightPanelTab === 'isotopes') ? 'auto' : 'none', 
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)', 
                  transform: (rightPanelTab === 'structure' || rightPanelTab === 'isotopes') ? 'scale(1)' : 'scale(0.95)' 
                }}>
                  <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
                    Interactive 3D Bohr Model. Scroll to zoom, drag to rotate.
                  </div>
                  <Atom3DModel atomicNumber={selectedItem.atomicNumber} symbol={selectedItem.symbol} neutronOverride={neutronOverride} selectedShell={null} />
                </div>

                {/* Crystal View */}
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                  opacity: rightPanelTab === 'crystal' ? 1 : 0, 
                  visibility: rightPanelTab === 'crystal' ? 'visible' : 'hidden', 
                  pointerEvents: rightPanelTab === 'crystal' ? 'auto' : 'none', 
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)', 
                  transform: rightPanelTab === 'crystal' ? 'scale(1)' : 'scale(0.95)' 
                }}>
                  {selectedItem && <CrystalLatticeModel elementData={selectedItem} />}
                </div>

                {/* AI Chat View */}
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                  display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', 
                  opacity: rightPanelTab === 'ai' ? 1 : 0, 
                  visibility: rightPanelTab === 'ai' ? 'visible' : 'hidden', 
                  pointerEvents: rightPanelTab === 'ai' ? 'auto' : 'none', 
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
                  transform: rightPanelTab === 'ai' ? 'translateY(0)' : 'translateY(20px)' 
                }}>
                  <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontWeight: 700, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <MessageSquare size={24} color="var(--accent-cyan)" /> Ask Dr. Hydro
                  </div>
                  <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {chatHistory.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem', textAlign: 'center', marginTop: '60px' }}>
                        What would you like to know about {selectedItem.name}?
                      </div>
                    ) : (
                      chatHistory.map((msg, i) => (
                        <div key={i} ref={i === chatHistory.length - 1 ? lastMessageRef : null} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                          <div style={{ 
                            background: msg.role === 'user' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                            color: msg.role === 'user' ? '#000' : '#fff', padding: '16px 20px', borderRadius: '16px',
                            borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                            borderBottomLeftRadius: msg.role === 'user' ? '16px' : '4px',
                            fontSize: '1rem', lineHeight: '1.6', border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                          }}>
                            <div className="markdown-chat">
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}>
                                {msg.content.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$').replace(/\\\(/g, '$').replace(/\\\)/g, '$')}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {chatting && (
                      <div ref={typingIndicatorRef} style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Loader2 size={16} className="animate-spin" /> Dr. Hydro is typing...
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleSendMessage} style={{ padding: '20px 20px 80px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
                    <input 
                      ref={inputRef} type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type your question..." disabled={chatting}
                      style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '16px 20px', borderRadius: '12px', fontSize: '1rem' }}
                    />
                    <button type="submit" disabled={chatting} style={{ background: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '12px', width: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: chatting ? 0.5 : 1 }}>
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </div>

              <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '30px', padding: '6px', backdropFilter: 'blur(10px)' }}>
                <button onClick={() => { setRightPanelTab('structure'); setCurrentCardIndex(0); }} style={{ background: rightPanelTab === 'structure' ? 'rgba(255,255,255,0.15)' : 'transparent', color: rightPanelTab === 'structure' ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '8px 16px', borderRadius: '24px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  Structure
                </button>
                <button onClick={() => { setRightPanelTab('isotopes'); setCurrentCardIndex(0); }} style={{ background: rightPanelTab === 'isotopes' ? 'rgba(255,255,255,0.15)' : 'transparent', color: rightPanelTab === 'isotopes' ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '8px 16px', borderRadius: '24px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  Isotopes
                </button>
                <button onClick={() => { setRightPanelTab('crystal'); setCurrentCardIndex(0); }} style={{ background: rightPanelTab === 'crystal' ? 'rgba(255,255,255,0.15)' : 'transparent', color: rightPanelTab === 'crystal' ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '8px 16px', borderRadius: '24px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  Crystal
                </button>
                <button onClick={() => { setRightPanelTab('ai'); setCurrentCardIndex(0); }} style={{ background: rightPanelTab === 'ai' ? 'rgba(34, 211, 238, 0.2)' : 'transparent', color: rightPanelTab === 'ai' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.5)', border: 'none', padding: '8px 16px', borderRadius: '24px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <MessageSquare size={16} /> Dr. Hydro AI
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
      {/* Expanded Modal View */}
      {selectedItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px',
          opacity: isExpanded ? 1 : 0,
          visibility: isExpanded ? 'visible' : 'hidden',
          pointerEvents: isExpanded ? 'auto' : 'none',
          transition: 'all 0.3s ease-in-out'
        }}>
          <div style={{
            width: '100%', maxWidth: '1000px', height: '80vh',
            background: 'var(--bg-panel)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden',
            transform: isExpanded ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
            opacity: isExpanded ? 1 : 0,
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ 
              padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{
                  width: '60px', height: '60px',
                  background: `rgba(${getCategoryColor(selectedItem.category)}, 0.1)`, border: `2px solid rgba(${getCategoryColor(selectedItem.category)}, 0.4)`,
                  borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: `rgba(${getCategoryColor(selectedItem.category)}, 0.8)` }}>{selectedItem.atomicNumber}</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{selectedItem.symbol}</span>
                </div>
                <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 4px 0', color: '#fff' }}>{selectedItem.name}</h2>
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {selectedItem.category} | Block {selectedItem.block}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,50,50,0.2)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <button 
                onClick={() => setCurrentCardIndex(currentCardIndex === 0 ? 5 : currentCardIndex - 1)} 
                style={{ 
                  position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', 
                  background: 'rgba(255, 255, 255, 0.85)', border: '1px solid rgba(255,255,255,0.9)', 
                  borderLeft: 'none', borderRadius: '0 16px 16px 0', padding: '24px 8px', 
                  color: '#333', cursor: 'pointer', 
                  opacity: 0.4, 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '2px 0 12px rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.padding = '32px 12px';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.opacity = '0.4';
                  e.currentTarget.style.padding = '24px 8px';
                }}
              >
                <ChevronLeft size={32} strokeWidth={3} />
              </button>
              
              <button 
                onClick={() => setCurrentCardIndex(currentCardIndex === 5 ? 0 : currentCardIndex + 1)} 
                style={{ 
                  position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', 
                  background: 'rgba(255, 255, 255, 0.85)', border: '1px solid rgba(255,255,255,0.9)', 
                  borderRight: 'none', borderRadius: '16px 0 0 16px', padding: '24px 8px', 
                  color: '#333', cursor: 'pointer', 
                  opacity: 0.4, 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '-2px 0 12px rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.padding = '32px 12px';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.opacity = '0.4';
                  e.currentTarget.style.padding = '24px 8px';
                }}
              >
                <ChevronRight size={32} strokeWidth={3} />
              </button>
              
              <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
                {[0, 1, 2, 3, 4, 5].map(idx => (
                  <div key={idx} style={{ 
                    width: currentCardIndex === idx ? '32px' : '10px', height: '10px', borderRadius: '5px', 
                    background: currentCardIndex === idx ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s ease'
                  }} />
                ))}
              </div>

              <div style={{
                display: 'flex', height: '100%', width: '600%',
                transform: `translateX(-${currentCardIndex * (100/6)}%)`,
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {/* CARD 1: OVERVIEW & VISUALS */}
                <div style={{ width: `${100/6}%`, height: '100%', padding: '40px 96px', overflowY: 'auto' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100%' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>Overview & Visuals</h3>
                    {selectedItem.image?.url && (
                      <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        <img src={selectedItem.image.url} alt={selectedItem.image.title || selectedItem.name} style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
                        {selectedItem.image.title && (
                          <div style={{ padding: '12px 16px', fontSize: '1rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(0,0,0,0.5)' }}>
                            {selectedItem.image.title}
                          </div>
                        )}
                      </div>
                    )}
                    {selectedItem.summary && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '1.1rem', color: '#e0e0e0', lineHeight: 1.6 }}>{selectedItem.summary}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 2: GENERAL PROPERTIES */}
                <div style={{ width: `${100/6}%`, height: '100%', padding: '40px 96px', overflowY: 'auto' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100%' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>General Properties</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Type</div>
                        <div style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{selectedItem.category || '-'}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Phase @ STP</div>
                        <div style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 600 }}>{selectedItem.phase || '-'}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Group / Period</div>
                        <div style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 600 }}>{selectedItem.group || '-'} / {selectedItem.period || '-'}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Block</div>
                        <div style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 600, textTransform: 'uppercase' }}>{selectedItem.block || '-'}</div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,255,255,0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(0,255,255,0.1)', marginTop: 'auto' }}>
                      <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Common Ions</div>
                      <div style={{ fontSize: '1.8rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                        {loadingContext ? <Loader2 className="animate-spin inline" size={20} /> : (aiInfo?.commonIons || 'N/A')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: ATOMIC DETAILS */}
                <div style={{ width: `${100/6}%`, height: '100%', padding: '40px 96px', overflowY: 'auto' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100%' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>Atomic Structure</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Avg. Mass</div>
                        <div style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 600 }}>{selectedItem.mass || selectedItem.atomic_mass || '-'} <span style={{fontSize:'1rem', opacity:0.5}}>u</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Configuration</div>
                        <div style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)', fontWeight: 600, fontFamily: 'monospace' }}>
                          {selectedItem.electron_configuration_semantic || selectedItem.electron_configuration || '-'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 700 }}>{selectedItem.number}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Protons</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 700 }}>{Math.round((selectedItem.mass || selectedItem.atomic_mass || 0) - selectedItem.number)}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Neutrons</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 700 }}>{selectedItem.number}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Electrons</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Key Isotopes</div>
                      {loadingContext ? <Loader2 className="animate-spin inline" size={20} /> : aiInfo?.keyIsotopes && Array.isArray(aiInfo.keyIsotopes) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {aiInfo.keyIsotopes.map((iso: any, i: number) => (
                            <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>{iso.isotope}</div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                <div>{iso.neutrons} n⁰</div>
                                <div style={{ color: 'var(--accent-cyan)' }}>{iso.stability}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <div style={{ color: '#fff', fontSize: '1.1rem' }}>N/A</div>}
                    </div>
                  </div>
                </div>

                {/* Card 4: THERMODYNAMICS & PHYSICAL */}
                <div style={{ width: `${100/6}%`, height: '100%', padding: '40px 96px', overflowY: 'auto' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100%' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>Thermodynamics & Physical Properties</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Melting Point</div>
                        <div style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>{selectedItem.melt ? (selectedItem.melt - 273.15).toFixed(1) : 'N/A'} <span style={{fontSize:'0.9rem', opacity:0.5}}>°C</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Boiling Point</div>
                        <div style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>{selectedItem.boil ? (selectedItem.boil - 273.15).toFixed(1) : 'N/A'} <span style={{fontSize:'0.9rem', opacity:0.5}}>°C</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Density</div>
                        <div style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>{selectedItem.density || 'N/A'} <span style={{fontSize:'0.9rem', opacity:0.5}}>g/cm³</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Atomic Radius</div>
                        <div style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>{loadingContext ? <Loader2 className="animate-spin inline" size={16} /> : (aiInfo?.atomicRadius || 'N/A')}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Specific Heat</div>
                        <div style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>{selectedItem.molar_heat && (selectedItem.mass || selectedItem.atomic_mass) ? (selectedItem.molar_heat / (selectedItem.mass || selectedItem.atomic_mass)).toFixed(3) : 'N/A'} <span style={{fontSize:'0.9rem', opacity:0.5}}>J/g°C</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Phase @ STP</div>
                        <div style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>{selectedItem.phase || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 5: CHEMICAL REACTIVITY */}
                <div style={{ width: `${100/6}%`, height: '100%', padding: '40px 96px', overflowY: 'auto' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100%' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>Chemical Reactivity</h3>
                    
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px' }}>
                      <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Oxidation States</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {loadingContext ? <Loader2 className="animate-spin inline" size={18} /> : 
                          (aiInfo?.oxidationStates || 'N/A').split(',').map((state: string, i: number) => (
                            <span key={i} style={{ background: 'rgba(0,255,255,0.1)', color: 'var(--accent-cyan)', padding: '6px 12px', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 600 }}>
                              {state.trim()}
                            </span>
                          ))
                        }
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Electronegativity (Pauling)</div>
                        <div style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>{selectedItem.electronegativity_pauling || 'N/A'}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Electron Affinity</div>
                        <div style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>{selectedItem.electron_affinity !== undefined && selectedItem.electron_affinity !== null ? selectedItem.electron_affinity : 'N/A'} <span style={{fontSize:'0.9rem', opacity:0.5}}>kJ/mol</span></div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>1st Ionization Energy</div>
                        <div style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>{selectedItem.ionization_energies?.[0] || 'N/A'} <span style={{fontSize:'0.9rem', opacity:0.5}}>kJ/mol</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 6: HISTORY & SPECTRA */}
                <div style={{ width: `${100/6}%`, height: '100%', padding: '40px 96px', overflowY: 'auto' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100%' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>History & Spectra</h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', flex: 1, marginRight: '12px' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Discovered By</div>
                        <div style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>{selectedItem.discovered_by || 'Unknown'}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', flex: 1, marginLeft: '12px' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Discovery Year</div>
                        <div style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 600 }}>{loadingContext ? <Loader2 className="animate-spin inline" size={20} /> : (aiInfo?.discoveryYear || 'N/A')}</div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Appearance</div>
                      <div style={{ fontSize: '1.1rem', color: '#fff', textTransform: 'capitalize' }}>{selectedItem.appearance || 'Unknown'}</div>
                    </div>

                    {selectedItem.spectral_img && (
                      <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Emission Spectrum</div>
                        <div style={{ borderRadius: '12px', overflow: 'hidden' }}>
                          <img src={selectedItem.spectral_img} alt={`${selectedItem.name} emission spectrum`} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', borderRadius: '8px' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

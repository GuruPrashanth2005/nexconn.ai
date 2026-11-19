/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { BookOpen } from 'lucide-react';
import { useDrHydroStore } from '../../store/useDrHydroStore';

export const CurriculumGenerator: React.FC = () => {
  const { 
    topic, setTopic, 
    curriculumLevel, setCurriculumLevel, 
    documentType, setDocumentType, 
    engine, setEngine, 
    labData, setLabData 
  } = useDrHydroStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const resultRef = useRef<HTMLDivElement>(null);

  const levels = [
    'High School (9-10)',
    'Senior Secondary (11-12 / IB / A-Level)',
    'Undergraduate (College)',
    'Graduate'
  ];

  const documentTypes = [
    'Worksheet (Fillable)',
    'Full Lab Report Guide',
    'Experiment Plan (Teacher)'
  ];

  const handleGenerate = async () => {
    if (!topic) {
      setError('Please enter an experiment topic.');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    setLabData(null);

    try {
      const res = await axios.post('/api/v1/ai/generate-lab', {
        topic,
        curriculumLevel,
        documentType,
        engine
      });
      
      if (res.data.status === 'success') {
        setLabData(res.data.data);
      } else {
        setError('Failed to generate lab manual.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error communicating with Dr. HydroAI. Please check your AI server/API limits.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!resultRef.current || !labData) return;
    
    const element = resultRef.current;
    
    const opt = {
      margin:       [15, 15, 15, 15] as [number, number, number, number],
      filename:     `HydroLab_Manual_${topic.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
  };

  // Helper to render KaTeX math expressions embedded in text
  // Naive parser assuming $math$ or $$math$$
  const renderTextWithMath = (text: string) => {
    if (!text) return null;
    
    // Split by $$ first
    const blockParts = text.split('$$');
    return blockParts.map((bPart, bIndex) => {
      if (bIndex % 2 === 1) {
        return <BlockMath key={`b-${bIndex}`} math={bPart} />;
      }
      
      // Split remaining text by $
      const inlineParts = bPart.split('$');
      return (
        <span key={`b-${bIndex}`}>
          {inlineParts.map((iPart, iIndex) => {
            if (iIndex % 2 === 1) {
              return <InlineMath key={`i-${bIndex}-${iIndex}`} math={iPart} />;
            }
            return <span key={`i-${bIndex}-${iIndex}`}>{iPart}</span>;
          })}
        </span>
      );
    });
  };

  const bentoBoxStyle = {
    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '16px',
    padding: '32px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
              AI
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.5px', color: '#fff', margin: 0 }}>Dr. HydroAI</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Curriculum-Adaptive Lab Generator</p>
        </div>
      </div>

      <div style={{ ...bentoBoxStyle, marginBottom: '32px', maxWidth: '800px', margin: '0 auto 32px auto' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: '24px', textAlign: 'center' }}>What experiment are we running?</h2>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Experiment Topic</label>
            <input 
              type="text" 
              placeholder="e.g. Saponification of Fats"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-cyan)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 500 }}>Curriculum Level</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {levels.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setCurriculumLevel(level)}
                  style={{
                    padding: '10px 16px',
                    background: curriculumLevel === level ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${curriculumLevel === level ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    color: curriculumLevel === level ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    fontSize: '0.9rem',
                    fontWeight: curriculumLevel === level ? 600 : 400,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '32px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 500 }}>Document Type</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {documentTypes.map(doc => (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => setDocumentType(doc)}
                    style={{
                      padding: '12px 16px',
                      background: documentType === doc ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${documentType === doc ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      color: documentType === doc ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      fontSize: '0.9rem',
                      fontWeight: documentType === doc ? 600 : 400,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    {doc}
                    {documentType === doc && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 500 }}>AI Engine</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEngine('groq')}
                  style={{
                    padding: '12px 16px',
                    background: engine === 'groq' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${engine === 'groq' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    color: engine === 'groq' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    fontSize: '0.9rem',
                    fontWeight: engine === 'groq' ? 600 : 400,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  Groq Cloud API (Fast ⚡)
                  {engine === 'groq' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </button>
                <button
                  type="button"
                  onClick={() => setEngine('ollama')}
                  style={{
                    padding: '12px 16px',
                    background: engine === 'ollama' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${engine === 'ollama' ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    color: engine === 'ollama' ? '#10b981' : 'var(--text-muted)',
                    fontSize: '0.9rem',
                    fontWeight: engine === 'ollama' ? 600 : 400,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  Local Ollama (Offline)
                  {engine === 'ollama' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </button>
              </div>
            </div>
          </div>

          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px', padding: '12px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px' }}>{error}</div>}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '16px',
              background: isGenerating 
                ? 'rgba(14, 165, 233, 0.3)' 
                : 'linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(2, 132, 199, 0.9) 100%)',
              color: '#fff',
              border: isGenerating ? '1px solid rgba(14, 165, 233, 0.2)' : '1px solid rgba(14, 165, 233, 0.5)',
              borderRadius: '12px',
              fontSize: '1.05rem',
              fontFamily: 'inherit',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              cursor: isGenerating ? 'wait' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: isGenerating ? 'none' : '0 8px 32px rgba(14, 165, 233, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
            onMouseOver={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(14, 165, 233, 0.5)';
              }
            }}
            onMouseOut={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(14, 165, 233, 0.3)';
              }
            }}
          >
            {isGenerating ? (
              <>
                <motion.div animate={{ rotateY: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
                  <BookOpen size={20} />
                </motion.div>
                GENERATING CURRICULUM...
              </>
            ) : (
              'GENERATE LAB MANUAL'
            )}
          </button>
        </div>
      </div>

      {/* Loading Animation */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '20px' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              style={{ width: '64px', height: '64px', borderRadius: '50%', border: '4px solid rgba(14, 165, 233, 0.1)', borderTopColor: 'var(--accent-cyan)', borderRightColor: 'var(--accent-cyan)' }}
            />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ color: 'var(--accent-cyan)', fontWeight: 500, fontSize: '1.2rem', letterSpacing: '0.5px' }}
            >
              Synthesizing deep chemical knowledge...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Result */}
      <AnimatePresence>
        {labData && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '100px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button 
                onClick={handleDownloadPDF}
                style={{
                  padding: '8px 20px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; e.currentTarget.style.color = '#10b981'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download PDF
              </button>
            </div>

            {/* Content to be converted to PDF */}
            <div ref={resultRef} style={{ background: '#fff', color: '#000', padding: '40px 50px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              
              {/* Header */}
              <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '30px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', color: '#111827' }}>{topic}</h1>
                <div style={{ color: '#6b7280', fontSize: '0.9rem', display: 'flex', gap: '16px' }}>
                  <span><strong>Level:</strong> {curriculumLevel}</span>
                  <span><strong>Generated by:</strong> Dr. HydroAI</span>
                </div>
              </div>

              {/* Safety Precautions - Prominent Alert Box */}
              {labData.safetyPrecautions && labData.safetyPrecautions.length > 0 && (
                <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '20px', borderRadius: '0 8px 8px 0', marginBottom: '32px' }}>
                  <h3 style={{ color: '#991b1b', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Safety Precautions
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d', fontSize: '0.95rem' }}>
                    {labData.safetyPrecautions.map((safety: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{renderTextWithMath(safety)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Theory */}
              {labData.theory && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: '#111827', margin: '0 0 12px 0', fontSize: '1.3rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>{labData.theory.title || 'Theory'}</h3>
                  <p style={{ color: '#374151', lineHeight: '1.6', margin: 0, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                    {renderTextWithMath(labData.theory.content)}
                  </p>
                </div>
              )}

              {/* Procedure */}
              {labData.procedure && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: '#111827', margin: '0 0 16px 0', fontSize: '1.3rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>{labData.procedure.title || 'Procedure'}</h3>
                  <ol style={{ paddingLeft: '20px', margin: 0, color: '#374151', fontSize: '0.95rem' }}>
                    {labData.procedure.steps?.map((stepData: any, idx: number) => (
                      <li key={idx} style={{ marginBottom: '16px', lineHeight: '1.5' }}>
                        <div>{renderTextWithMath(stepData.step)}</div>
                        {stepData.note && (
                          <div style={{ background: '#f3f4f6', padding: '8px 12px', borderRadius: '4px', marginTop: '8px', fontSize: '0.85rem', color: '#4b5563', borderLeft: '3px solid #6b7280' }}>
                            <strong>Note:</strong> {renderTextWithMath(stepData.note)}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Observation Table */}
              {labData.observationTable && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: '#111827', margin: '0 0 16px 0', fontSize: '1.3rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>{labData.observationTable.title || 'Observation Table'}</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                          {labData.observationTable.columns?.map((col: string, idx: number) => (
                            <th key={idx} style={{ border: '1px solid #d1d5db', padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#111827' }}>{renderTextWithMath(col)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Generate 3 empty rows for students to fill */}
                        {[1, 2, 3].map(rowIdx => (
                          <tr key={rowIdx}>
                            {labData.observationTable.columns?.map((_: any, colIdx: number) => (
                              <td key={colIdx} style={{ border: '1px solid #d1d5db', padding: '16px 12px', height: '24px' }}></td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Calculations */}
              {labData.calculations && labData.calculations.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: '#111827', margin: '0 0 12px 0', fontSize: '1.3rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>Calculations</h3>
                  <ul style={{ paddingLeft: '20px', margin: 0, color: '#374151', fontSize: '0.95rem' }}>
                    {labData.calculations.map((calc: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{renderTextWithMath(calc)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Discussion Questions */}
              {labData.discussionQuestions && labData.discussionQuestions.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: '#111827', margin: '0 0 16px 0', fontSize: '1.3rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>Post-Lab Discussion</h3>
                  <div style={{ color: '#374151', fontSize: '0.95rem' }}>
                    {labData.discussionQuestions.map((q: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: '24px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>{idx + 1}. {renderTextWithMath(q.question)}</div>
                        <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #10b981', fontSize: '0.9rem', color: '#065f46' }}>
                          <strong>Answer Key:</strong> {renderTextWithMath(q.answerKey)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CurriculumGenerator;

import React, { useMemo } from 'react';
import { Activity, Thermometer, Zap, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface IPeak {
  wavenumber?: number;
  transmittance?: number;
  ppm?: number;
  intensity?: number;
  assignment?: string;
}

interface SpectroscopyProps {
  properties: {
    boilingPoint?: string;
    polarity?: string;
    irPeaks?: string;
    nmrShifts?: string;
    irGraph?: IPeak[];
    nmrGraph?: IPeak[];
  };
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, unit }: { active?: boolean; payload?: { color: string; value: number; payload: { assignment?: string } }[]; label?: string; unit?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-panel)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{label} {unit}</p>
        <p style={{ margin: 0, color: payload[0].color, fontSize: '0.85rem' }}>
          Value: {payload[0].value.toFixed(1)}
        </p>
        {payload[0].payload.assignment && (
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
            {payload[0].payload.assignment}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const SpectroscopyPanel: React.FC<SpectroscopyProps> = ({ properties }) => {
  const getGlassBoxStyle = (colorRgb: string) => ({
    background: `linear-gradient(145deg, rgba(${colorRgb}, 0.05) 0%, rgba(${colorRgb}, 0.01) 100%)`,
    border: `1px solid rgba(${colorRgb}, 0.15)`,
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  });

  const getGlowStyle = (colorRgb: string) => ({
    position: 'absolute' as const,
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    background: `radial-gradient(circle, rgba(${colorRgb}, 0.15) 0%, transparent 70%)`,
    pointerEvents: 'none' as const,
    zIndex: 0
  });

  const contentStyle = {
    position: 'relative' as const,
    zIndex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    width: '100%'
  };

  // Generate continuous IR data from sparse peaks
  const irChartData = useMemo(() => {
    if (!properties?.irGraph || properties.irGraph.length === 0) return null;
    const data = [];
    for (let w = 4000; w >= 400; w -= 10) {
      let t = 100; // baseline transmittance
      let assignment = "";
      properties.irGraph.forEach(p => {
        if (p.wavenumber && p.transmittance) {
          const diff = Math.abs(w - p.wavenumber);
          // Width of the peak (broadness)
          const width = p.assignment?.toLowerCase().includes('broad') ? 5000 : 1500;
          const depth = 100 - p.transmittance;
          const effect = depth * Math.exp(-(diff * diff) / width);
          t -= effect;
          if (effect > depth * 0.5) assignment = p.assignment || "";
        }
      });
      data.push({ wavenumber: w, transmittance: Math.max(0, t), assignment });
    }
    return data;
  }, [properties.irGraph]);

  // Generate continuous NMR data from sparse peaks
  const nmrChartData = useMemo(() => {
    if (!properties?.nmrGraph || properties.nmrGraph.length === 0) return null;
    const data = [];
    for (let ppm = 12; ppm >= 0; ppm -= 0.05) {
      let intensity = 0; // baseline intensity
      let assignment = "";
      properties.nmrGraph.forEach(p => {
        if (p.ppm !== undefined && p.intensity) {
          const diff = Math.abs(ppm - p.ppm);
          const effect = p.intensity * Math.exp(-(diff * diff) / 0.002);
          intensity += effect;
          if (effect > p.intensity * 0.5) assignment = p.assignment || "";
        }
      });
      data.push({ ppm: Number(ppm.toFixed(2)), intensity: Math.max(0, intensity), assignment });
    }
    return data;
  }, [properties.nmrGraph]);

  if (!properties) return null;

  return (
    <div className="glass-card" style={{ marginTop: '16px' }}>
      <h3 className="glass-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}>
        <Activity size={18} color="var(--accent-purple)" />
        Predicted Spectroscopy & Physical Properties
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        
        {/* Physical Properties Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {properties.boilingPoint && (
            <div style={getGlassBoxStyle('251, 146, 60')}>
              <div style={getGlowStyle('251, 146, 60')} />
              <div style={contentStyle}>
                <div style={{ color: 'var(--accent-orange)' }}><Thermometer size={18} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Boiling Point</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>{properties.boilingPoint}</div>
                </div>
              </div>
            </div>
          )}
          
          {properties.polarity && (
            <div style={getGlassBoxStyle('34, 211, 238')}>
              <div style={getGlowStyle('34, 211, 238')} />
              <div style={contentStyle}>
                <div style={{ color: 'var(--accent-cyan)' }}><Zap size={18} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Polarity</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>{properties.polarity}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Spectroscopy Analysis */}
        {(properties.irPeaks || properties.irGraph) && (
          <div style={getGlassBoxStyle('244, 114, 182')}>
            <div style={getGlowStyle('244, 114, 182')} />
            <div style={{...contentStyle, flexDirection: 'column'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: 'var(--accent-pink)' }}><Activity size={18} /></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>IR Spectroscopy (FTIR)</div>
              </div>
              
              {irChartData ? (
                <div style={{ width: '100%', height: '200px', marginTop: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={irChartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="wavenumber" 
                        type="number" 
                        domain={[400, 4000]} 
                        reversed={true} 
                        stroke="rgba(255,255,255,0.3)" 
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                        label={{ value: 'Wavenumber (cm⁻¹)', position: 'insideBottom', offset: -10, fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        stroke="rgba(255,255,255,0.3)" 
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                        label={{ value: '% Transmittance', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      />
                      <RechartsTooltip content={<CustomTooltip unit="cm⁻¹" />} />
                      <Line 
                        type="monotone" 
                        dataKey="transmittance" 
                        stroke="var(--accent-pink)" 
                        strokeWidth={2} 
                        dot={false} 
                        isAnimationActive={true}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                properties.irPeaks && (
                  <div className="markdown-chat" style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '8px', lineHeight: 1.6 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}>
                      {properties.irPeaks.replace(/\\n/g, '\n').replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$').replace(/\\\(/g, '$').replace(/\\\)/g, '$')}
                    </ReactMarkdown>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {(properties.nmrShifts || properties.nmrGraph) && (
          <div style={getGlassBoxStyle('52, 211, 153')}>
            <div style={getGlowStyle('52, 211, 153')} />
            <div style={{...contentStyle, flexDirection: 'column'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: 'var(--accent-emerald)' }}><Layers size={18} /></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>1H NMR Shifts</div>
              </div>
              
              {nmrChartData ? (
                <div style={{ width: '100%', height: '200px', marginTop: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={nmrChartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                      <XAxis 
                        dataKey="ppm" 
                        type="number" 
                        domain={[0, 12]} 
                        reversed={true} 
                        stroke="rgba(255,255,255,0.3)" 
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                        label={{ value: 'Chemical Shift (ppm)', position: 'insideBottom', offset: -10, fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.3)" 
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                        label={{ value: 'Intensity', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      />
                      <RechartsTooltip content={<CustomTooltip unit="ppm" />} />
                      <Line 
                        type="monotone" 
                        dataKey="intensity" 
                        stroke="var(--accent-emerald)" 
                        strokeWidth={2} 
                        dot={false} 
                        isAnimationActive={true}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                properties.nmrShifts && (
                  <div className="markdown-chat" style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '8px', lineHeight: 1.6 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}>
                      {properties.nmrShifts.replace(/\\n/g, '\n').replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$').replace(/\\\(/g, '$').replace(/\\\)/g, '$')}
                    </ReactMarkdown>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

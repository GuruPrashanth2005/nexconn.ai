/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';

interface TrendsData {
  technicalSummary: {
    overview: string;
    methodologies: string[];
    limitations: string[];
  };
  quantitativeTrends: {
    yieldTrends: { year: string; averageYield: number }[];
    reagentPopularity: { name: string; usagePercentage: number }[];
    solventLandscape: { name: string; value: number }[];
  };
  citations: {
    title: string;
    authors: string;
    journal: string;
    year: number;
    doi: string;
    grounded: boolean;
  }[];
}

const COLORS = ['#38bdf8', '#f43f5e', '#a78bfa', '#34d399', '#fbbf24'];

export const Trends: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrendsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent, overrideTopic?: string) => {
    if (e) e.preventDefault();
    const searchTopic = overrideTopic || topic;
    if (!searchTopic.trim()) return;

    if (overrideTopic) {
      setTopic(overrideTopic);
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/v1/ai/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: searchTopic, engine: 'groq' })
      });

      if (!response.ok) throw new Error('Failed to fetch trend data');
      
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        setData(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during trend mining.');
    } finally {
      setLoading(false);
    }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Search Header */}
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', margin: 0 }}>Dr. HydroAI Trends</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 24px 0' }}>
            Natural language literature search, automated technical summaries, and quantitative trend visualization (last 3-5 years).
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Enter a topic (e.g., C-H activation, Water hardness titration)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                fontFamily: 'inherit',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              style={{
                width: '100%',
                padding: '16px',
                background: loading || !topic.trim()
                  ? 'rgba(14, 165, 233, 0.3)' 
                  : 'linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(2, 132, 199, 0.9) 100%)',
                color: '#fff',
                border: loading || !topic.trim() ? '1px solid rgba(14, 165, 233, 0.2)' : '1px solid rgba(14, 165, 233, 0.5)',
                borderRadius: '12px',
                fontSize: '1.05rem',
                fontFamily: 'inherit',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                cursor: loading || !topic.trim() ? 'wait' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: loading || !topic.trim() ? 'none' : '0 8px 32px rgba(14, 165, 233, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              {loading ? (
                <>
                  <div style={{ animation: 'spin 1.5s linear infinite', display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                  MINING LITERATURE...
                </>
              ) : (
                'ANALYZE TRENDS'
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Or try an example: 
            {['C-H activation', 'Photocatalysis', 'Flow Chemistry', 'CRISPR off-target'].map(ex => (
              <button 
                type="button"
                key={ex}
                onClick={() => handleSearch(undefined, ex)}
                disabled={loading}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  cursor: loading ? 'wait' : 'pointer',
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

          {error && <p style={{ color: '#f43f5e', fontSize: '0.9rem', marginTop: '12px' }}>{error}</p>}
        </div>
      </div>

      {loading && (
        <div style={{ ...glassStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div style={{ 
            width: '40px', height: '40px', 
            border: '3px solid rgba(255,255,255,0.1)', 
            borderTopColor: 'var(--accent-cyan)', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite' 
          }} />
          <p style={{ color: 'var(--text-muted)', marginTop: '16px', fontWeight: 500 }}>Extracting unstructured text data & synthesizing trends...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Automated Technical Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
            <div style={{ ...glassStyle, gridColumn: 'span 8' }}>
              <div style={{
                position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px',
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
                pointerEvents: 'none', zIndex: 0
              }}></div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>Automated Technical Summary</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '20px' }}>
                {data.technicalSummary.overview}
              </p>
              
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px' }}>Trending Methodologies</h4>
                  <ul style={{ color: 'var(--text-muted)', fontSize: '0.9rem', paddingLeft: '20px', margin: 0, lineHeight: 1.6 }}>
                    {data.technicalSummary.methodologies.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px' }}>Current Limitations</h4>
                  <ul style={{ color: '#f43f5e', opacity: 0.8, fontSize: '0.9rem', paddingLeft: '20px', margin: 0, lineHeight: 1.6 }}>
                    {data.technicalSummary.limitations.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* Solvents Landscape */}
            <div style={{ ...glassStyle, gridColumn: 'span 4', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 16px 0' }}>Solvent Landscape</h3>
              <div style={{ flex: 1, minHeight: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.quantitativeTrends.solventLandscape}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.quantitativeTrends.solventLandscape.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {data.quantitativeTrends.solventLandscape.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }}></div>
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
            
            {/* Yield Trends */}
            <div style={{ ...glassStyle, gridColumn: 'span 7' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 16px 0' }}>Average Yield Trends (Last 5 Years)</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.quantitativeTrends.yieldTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} unit="%" />
                    <RechartsTooltip 
                      contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--accent-cyan)' }}
                    />
                    <Line type="monotone" dataKey="averageYield" stroke="var(--accent-cyan)" strokeWidth={3} dot={{ fill: 'var(--accent-cyan)', r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Reagent Popularity */}
            <div style={{ ...glassStyle, gridColumn: 'span 5' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 16px 0' }}>Trending Reagents</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.quantitativeTrends.reagentPopularity} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <RechartsTooltip 
                      contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#a78bfa' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="usagePercentage" fill="#a78bfa" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Citations & Source Verification */}
          <div style={glassStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Grounded Source Verification</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.citations.map((cit, idx) => (
                <div key={idx} style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  padding: '16px', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 500 }}>{cit.title}</h4>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 8px 0', fontSize: '0.85rem' }}>
                      {cit.authors} • <span style={{ color: '#94a3b8' }}>{cit.journal}</span> ({cit.year})
                    </p>
                    <a href={`https://doi.org/${cit.doi}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      DOI: {cit.doi}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  </div>
                  {cit.grounded && (
                    <div style={{ 
                      background: 'rgba(52, 211, 153, 0.1)', 
                      color: '#34d399', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Verified Grounded
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Trends;

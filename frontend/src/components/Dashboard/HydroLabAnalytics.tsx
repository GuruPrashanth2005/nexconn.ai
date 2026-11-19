import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';

interface HydroLabAnalyticsProps {
  aiMetrics?: {
    totalRequests: number;
    totalTokens: number;
    totalSpend: number;
    moduleUsage: { name: string; count: number; [key: string]: unknown }[];
    apiUsage: { date: string; count: number; [key: string]: unknown }[];
    tokenOverTime: { date: string; input: number; output: number; [key: string]: unknown }[];
    tokenOverTimeHourly: { date: string; input: number; output: number; [key: string]: unknown }[];
    spendByProvider: { name: string; value: number; [key: string]: unknown }[];
    activeModels: string[];
    topQueries: { query: string; count: number; [key: string]: unknown }[];
  };
}

export const HydroLabAnalytics: React.FC<HydroLabAnalyticsProps> = ({ aiMetrics }) => {
  const [apiTimeRange, setApiTimeRange] = useState<'7 Days' | '30 Days' | 'All Time'>('7 Days');
  const [tokenView, setTokenView] = useState<'Daily' | 'Hourly'>('Daily');
  const [showAllModules, setShowAllModules] = useState(false);
  const [showAllProviders, setShowAllProviders] = useState(false);

  // If no data, use some fallback or zeros
  const metrics = aiMetrics || {
    totalRequests: 0,
    totalTokens: 0,
    moduleUsage: [],
    apiUsage: [],
    tokenOverTime: [],
    tokenOverTimeHourly: [],
    totalSpend: 0,
    spendByProvider: []
  };

  const totalTokensFormatted = metrics.totalTokens.toLocaleString();
  const totalCostFormatted = `$${metrics.totalSpend.toFixed(2)}`;
  const totalRequestsFormatted = metrics.totalRequests.toLocaleString();
  const totalModulesUsed = metrics.moduleUsage.length;

  const bentoBoxStyle = {
    background: 'var(--panel-bg)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--panel-border)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
  };

  const kpiCardStyle = {
    ...bentoBoxStyle,
    padding: '20px',
    position: 'relative' as const,
    overflow: 'hidden' as const
  };

  // Filter Data based on state
  const displayModules = showAllModules ? metrics.moduleUsage : (metrics.moduleUsage || []).slice(0, 5);
  const displayProviders = showAllProviders ? metrics.spendByProvider : (metrics.spendByProvider || []).slice(0, 5);
  
  let filteredApiUsage = metrics.apiUsage || [];
  if (apiTimeRange === '7 Days') filteredApiUsage = filteredApiUsage.slice(-7);
  else if (apiTimeRange === '30 Days') filteredApiUsage = filteredApiUsage.slice(-30);

  const tokenChartData = tokenView === 'Hourly' ? (metrics.tokenOverTimeHourly || []) : (metrics.tokenOverTime || []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* 1. Top KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
        
        <div style={kpiCardStyle}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Total AI Tokens</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{totalTokensFormatted}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>Across all modules</div>
          {/* Sparkline mock */}
          <div style={{ position: 'absolute', bottom: 10, right: 10, width: '60px', height: '30px' }}>
            <svg viewBox="0 0 100 50" preserveAspectRatio="none"><path d="M0,40 Q25,10 50,30 T100,10" fill="none" stroke="var(--accent-emerald)" strokeWidth="4" /></svg>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Total API Requests</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{totalRequestsFormatted}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>Real-time usage</div>
          <div style={{ position: 'absolute', bottom: 10, right: 10, width: '60px', height: '30px' }}>
            <svg viewBox="0 0 100 50" preserveAspectRatio="none"><path d="M0,40 Q25,40 50,20 T100,10" fill="none" stroke="var(--accent-emerald)" strokeWidth="4" /></svg>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Avg Processing</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>0.4s</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>Very fast</div>
          <div style={{ position: 'absolute', bottom: 10, right: 10, width: '60px', height: '30px' }}>
            <svg viewBox="0 0 100 50" preserveAspectRatio="none"><path d="M0,10 Q25,30 50,40 T100,20" fill="none" stroke="#f43f5e" strokeWidth="4" /></svg>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Total Spend (Est.)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{totalCostFormatted}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>Based on Cloud usage</div>
          <div style={{ position: 'absolute', bottom: 10, right: 10, width: '60px', height: '30px' }}>
             <svg viewBox="0 0 100 50" preserveAspectRatio="none"><path d="M0,40 Q25,30 50,40 T100,10" fill="none" stroke="var(--accent-emerald)" strokeWidth="4" /></svg>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Modules Active</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{totalModulesUsed}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>With AI capabilities</div>
          <div style={{ position: 'absolute', bottom: 10, right: 10, width: '60px', height: '30px' }}>
             <svg viewBox="0 0 100 50" preserveAspectRatio="none"><path d="M0,40 Q25,10 50,20 T100,10" fill="none" stroke="var(--accent-emerald)" strokeWidth="4" /></svg>
          </div>
        </div>

      </div>

      {/* 2. Middle Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Module Usage Table */}
        <div style={bentoBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 500 }}>Module usage</h3>
            <span 
              style={{ color: 'var(--accent-purple)', fontSize: '0.9rem', cursor: 'pointer' }}
              onClick={() => setShowAllModules(!showAllModules)}
            >
              {showAllModules ? 'View less <' : 'View all >'}
            </span>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Module</th>
                <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Request Count</th>
                <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Usage %</th>
              </tr>
            </thead>
            <tbody>
              {displayModules.map((m: { name: string, count: number }, i: number) => {
                const totalModReqs = (metrics.moduleUsage as { name: string; count: number }[]).reduce((acc, curr) => acc + curr.count, 0);
                const usagePct = totalModReqs > 0 ? Math.round((m.count / totalModReqs) * 100) : 0;
                return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '20px', background: 'var(--panel-border)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🔬</div>
                    {m.name}
                  </td>
                  <td style={{ padding: '16px 0', color: '#fff' }}>{m.count}</td>
                  <td style={{ padding: '16px 0', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${usagePct}%`, height: '100%', background: 'var(--accent-purple)', borderRadius: '3px' }} />
                      </div>
                      <span style={{ minWidth: '35px' }}>{usagePct}%</span>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* API Usage Metrics */}
        <div style={bentoBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 500 }}>API Usage Metrics</h3>
            <span 
              style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer' }}
              onClick={() => {
                if (apiTimeRange === '7 Days') setApiTimeRange('30 Days');
                else if (apiTimeRange === '30 Days') setApiTimeRange('All Time');
                else setApiTimeRange('7 Days');
              }}
            >
              {apiTimeRange} v
            </span>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredApiUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="linear" dataKey="count" stroke="var(--accent-purple, #c084fc)" strokeWidth={2} dot={{ fill: 'var(--accent-purple)', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. Bottom Row - 4 Columns basically */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        <div style={bentoBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 500 }}>Total token over time</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span 
                style={{ color: tokenView === 'Daily' ? 'var(--accent-purple)' : 'var(--text-muted)', fontSize: '0.85rem', padding: '4px 8px', background: tokenView === 'Daily' ? 'rgba(192, 132, 252, 0.1)' : 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setTokenView('Daily')}
              >
                Daily
              </span>
              <span 
                style={{ color: tokenView === 'Hourly' ? 'var(--accent-purple)' : 'var(--text-muted)', fontSize: '0.85rem', padding: '4px 8px', background: tokenView === 'Hourly' ? 'rgba(192, 132, 252, 0.1)' : 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setTokenView('Hourly')}
              >
                Hourly
              </span>
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', color: '#fff', margin: '0 0 16px 0' }}>{totalTokensFormatted}</h2>
          
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tokenChartData}>
                <defs>
                  <linearGradient id="colorPrompt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="input" name="Input Tokens" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#colorPrompt)" />
                <Area type="monotone" dataKey="output" name="Output Tokens" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCompletion)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>



        {/* Spent By Provider */}
        <div style={bentoBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 500 }}>Spent by provider</h3>
            <span 
              style={{ color: 'var(--accent-purple)', fontSize: '0.9rem', cursor: 'pointer' }}
              onClick={() => setShowAllProviders(!showAllProviders)}
            >
              {showAllProviders ? 'View less <' : 'View all >'}
            </span>
          </div>
          
          <div style={{ display: 'flex', height: '300px', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.spendByProvider}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={5}
                  >
                    {metrics.spendByProvider.map((entry: { name: string, value: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.name.includes('Groq') ? '#f43f5e' : entry.name.includes('Ollama') ? '#c084fc' : '#f59e0b'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 500 }}>Total</div>
                <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 600 }}>{totalCostFormatted}</div>
              </div>
            </div>

            <div style={{ flex: 1.5 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Provider</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {displayProviders.map((p: { name: string, value: number }, i: number) => {
                    const color = p.name.includes('Groq') ? '#f43f5e' : p.name.includes('Ollama') ? '#c084fc' : '#f59e0b';
                    return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: color }} />
                        {p.name}
                      </td>
                      <td style={{ padding: '12px 0', color: '#fff' }}>${p.value.toFixed(2)}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

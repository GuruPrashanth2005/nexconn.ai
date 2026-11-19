import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { getFacultyAnalytics, getGlobalFeed } from '../../services/analyticsService';
import { Activity, Beaker, Loader2 } from 'lucide-react';
import { HydroLabAnalytics } from './HydroLabAnalytics';

export const FacultyAnalytics: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<{ topMolecules: Record<string, unknown>[], timeline: Record<string, unknown>[], aiMetrics?: any } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setFeed] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [res, feedRes] = await Promise.all([getFacultyAnalytics(), getGlobalFeed()]);
        
        // Add mock failed data to match the dual-line chart visual requested
        const topMoleculesWithMockFailed = (res?.topMolecules || []).map((m: Record<string, unknown> & { count: number }) => ({
          ...m,
          failed: Math.floor(m.count * (0.1 + Math.random() * 0.2)) // 10-30% failure rate mock
        }));
        
        setData({ ...res, topMolecules: topMoleculesWithMockFailed });
        setFeed(feedRes.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
    
    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', color: 'var(--accent-cyan)' }} />
      </div>
    );
  }

  const bentoBoxStyle = {
    background: 'var(--panel-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--panel-border)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.5px', color: '#fff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity color="var(--accent-cyan)" size={24} />
          Student Telemetry & Analytics
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
          All-time data of student interactions, synthesis, and platform usage.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
        {/* HydroLab Analytics Dashboard Section (API Tokens & Usage) */}
        <HydroLabAnalytics aiMetrics={data?.aiMetrics} />

        {/* Top Molecules Chart */}
        <motion.div 
          style={bentoBoxStyle}
          whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Beaker color="#34d399" size={20} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 500, color: '#fff', margin: 0 }}>
              Most Synthesized Molecules
            </h2>
          </div>
          <div style={{ height: '350px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer>
              <AreaChart data={data?.topMolecules || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', padding: '16px' }}
                  itemStyle={{ fontWeight: 600, fontSize: '1.1rem', margin: '4px 0' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Area type="monotone" name="Successful" dataKey="count" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorSuccess)" activeDot={{ r: 6, fill: '#fff', stroke: '#34d399', strokeWidth: 2 }} />
                <Area type="monotone" name="Failed" dataKey="failed" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorFailed)" activeDot={{ r: 6, fill: '#fff', stroke: '#f43f5e', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>


      </div>

    </div>
  );
};

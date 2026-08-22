import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { dataAPI, forecastAPI } from '../services/api';
import { motion } from 'framer-motion';
import {
  Sun, Wind, Activity, Zap, Battery, TrendingUp,
  BarChart2, Bot, AlertTriangle, Upload, Play, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

// ─── Helpers ────────────────────────────────────────────────────────────────

function clientDecision(record) {
  if (!record) return { action: 'N/A', surplus: 0 };
  const total = (record.solarGeneration || 0) + (record.windGeneration || 0);
  const surplus = total - (record.energyDemand || 0);
  const soc = record.batterySOC || 50;
  if (surplus > 0) {
    if (soc < 90) return { action: 'STORE', surplus };
    return { action: 'EXPORT', surplus };
  }
  if (soc > 20) return { action: 'USE', surplus };
  return { action: 'GRID', surplus };
}

const actionColors = { STORE: '#00d4ff', EXPORT: '#f59e0b', USE: '#00ff88', GRID: '#ef4444' };

// ─── Sub-components ─────────────────────────────────────────────────────────

const KPI = ({ title, value, unit, icon: Icon, color, loading, sub }) => {
  const colors = {
    cyan: 'text-energy-cyan border-energy-cyan/20 bg-energy-cyan/5',
    green: 'text-energy-green border-energy-green/20 bg-energy-green/5',
    amber: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    red: 'text-red-400 border-red-400/20 bg-red-400/5',
    purple: 'text-purple-400 border-purple-400/20 bg-purple-400/5',
  };
  const cls = colors[color] || colors.cyan;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className={`glass p-4 border ${cls.split(' ').slice(1).join(' ')}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg ${cls.split(' ').slice(2).join(' ')}`}>
          <Icon size={14} className={cls.split(' ')[0]} />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-20 bg-white/10 rounded animate-pulse" />
      ) : (
        <div className={`text-2xl font-bold ${cls.split(' ')[0]}`}>
          {typeof value === 'number' ? value.toFixed(1) : value}
          <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
        </div>
      )}
      {sub && !loading && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass p-3 text-xs border border-white/10">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {Number(p.value).toFixed(1)} kW</p>
      ))}
    </div>
  );
};

// ─── Empty / Onboarding State ────────────────────────────────────────────────

const OnboardingState = ({ onDemoLaunch, loading }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg">
      {/* Animated icon */}
      <div className="relative w-24 h-24 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full bg-energy-cyan/10 animate-ping" />
        <div className="relative w-24 h-24 rounded-full bg-energy-cyan/10 border border-energy-cyan/30 flex items-center justify-center">
          <Zap size={40} className="text-energy-cyan" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-white mb-3">Welcome to ENER SAGE AI</h2>
      <p className="text-slate-400 mb-8 leading-relaxed">
        No project found. Launch the <strong className="text-energy-cyan">Live Demo</strong> to instantly load
        30 days of synthetic Solar + Wind Microgrid data and see the full platform in action.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={onDemoLaunch}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-energy-cyan to-energy-green text-bg-space font-bold text-base glow-cyan hover:opacity-90 transition-all disabled:opacity-60"
        >
          {loading
            ? <><div className="w-4 h-4 border-2 border-bg-space/30 border-t-bg-space rounded-full animate-spin" />Loading Demo...</>
            : <><Play size={18} />⚡ Launch Live Demo</>}
        </motion.button>

        <motion.a
          whileHover={{ scale: 1.03 }}
          href="/upload"
          className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-white font-semibold hover:border-white/30 hover:bg-white/5 transition-all"
        >
          <Upload size={16} />Upload Your Data
        </motion.a>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-2 justify-center mt-10">
        {['RF + XGBoost Ensemble', 'Confidence Intervals', 'XAI Explanations', 'Decision Engine', 'Groq AI Copilot', 'What-If Simulator'].map(f => (
          <span key={f} className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-slate-400">{f}</span>
        ))}
      </div>
    </motion.div>
  </div>
);

// ─── Main Dashboard ──────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentProject, setCurrentProject, fetchProjects } = useProject();
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (silent = false) => {
    if (!currentProject) { setLoading(false); return; }
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [statsRes, recordsRes] = await Promise.all([
        dataAPI.getStats(currentProject),
        dataAPI.getRecords(currentProject, { limit: 48 }),
      ]);
      setStats(statsRes.data);
      const recs = recordsRes.data?.records || recordsRes.data || [];
      setRecords(recs.slice().reverse()); // chronological order for chart

      // Try to get latest forecast (non-blocking)
      try {
        const fcRes = await forecastAPI.getLatest(currentProject);
        setForecast(fcRes.data);
      } catch (_) { /* no forecast yet — that's fine */ }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [currentProject]);

  const handleLaunchDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await axios.post('/api/data/demo');
      const projectId = res.data.projectId;
      await fetchProjects();
      setCurrentProject(projectId);
      localStorage.setItem('renew_current_project', projectId);
    } catch (err) {
      console.error(err);
    } finally {
      setDemoLoading(false);
    }
  };

  // ── No project: show onboarding ──────────────────────────────────────────
  if (!currentProject) {
    return <OnboardingState onDemoLaunch={handleLaunchDemo} loading={demoLoading} />;
  }

  // ── Derive KPI values from latest record ─────────────────────────────────
  const latest = stats?.latest || records[records.length - 1] || null;
  const { action, surplus } = clientDecision(latest);
  const solarGen  = latest?.solarGeneration  || 0;
  const windGen   = latest?.windGeneration   || 0;
  const demand    = latest?.energyDemand     || 0;
  const battSOC   = latest?.batterySOC       || 0;
  const totalGen  = solarGen + windGen;
  const gridDep   = totalGen > 0 ? Math.max(0, ((demand - totalGen) / demand * 100)) : 0;
  const confidence = forecast?.confidenceScore != null
    ? (forecast.confidenceScore * 100).toFixed(1)
    : null;

  // Chart data: last 48h records
  const chartData = records.slice(-48).map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    Solar: Number((r.solarGeneration || 0).toFixed(1)),
    Wind:  Number((r.windGeneration  || 0).toFixed(1)),
    Demand: Number((r.energyDemand   || 0).toFixed(1)),
  }));

  // Action color
  const actionColor = actionColors[action] || '#00d4ff';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">System Overview</h1>
          <p className="text-slate-400 text-sm">
            {stats?.totalRecords ? `${stats.totalRecords.toLocaleString()} records · ` : ''}
            {latest ? `Last update: ${new Date(latest.timestamp).toLocaleString()}` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Active decision pill */}
          {action !== 'N/A' && (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5"
              style={{ color: actionColor, borderColor: `${actionColor}40`, background: `${actionColor}10` }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: actionColor }} />
              Decision: {action}
            </span>
          )}
          <button onClick={() => fetchDashboardData(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs transition-colors">
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />Refresh
          </button>
          <button onClick={() => navigate('/forecast')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-energy-cyan/10 border border-energy-cyan/30 text-energy-cyan text-xs hover:bg-energy-cyan/20 transition-colors">
            <TrendingUp size={12} />Forecast
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <KPI title="Solar Gen"     value={solarGen}      unit="kW"  icon={Sun}        color="cyan"   loading={loading} sub="Current" />
        <KPI title="Wind Gen"      value={windGen}       unit="kW"  icon={Wind}       color="green"  loading={loading} sub="Current" />
        <KPI title="Total Gen"     value={totalGen}      unit="kW"  icon={Zap}        color="cyan"   loading={loading} sub="Solar + Wind" />
        <KPI title="Demand"        value={demand}        unit="kW"  icon={Activity}   color="amber"  loading={loading} sub="Load" />
        <KPI title="Surplus"       value={Math.abs(surplus)} unit="kW" icon={TrendingUp} color={surplus >= 0 ? 'green' : 'red'} loading={loading} sub={surplus >= 0 ? 'Surplus' : 'Deficit'} />
        <KPI title="Battery SOC"   value={battSOC}       unit="%"   icon={Battery}    color={battSOC > 50 ? 'green' : battSOC > 20 ? 'amber' : 'red'} loading={loading} sub="State of charge" />
        <KPI title="Confidence"    value={confidence ?? '—'} unit={confidence ? '%' : ''} icon={BarChart2} color="purple" loading={loading} sub={forecast ? 'ML forecast' : 'No forecast'} />
      </div>

      {/* Main chart + Battery + Decision */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Generation chart */}
        <div className="lg:col-span-2 glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Generation vs. Demand (Last 48h)</h2>
            {records.length === 0 && !loading && (
              <span className="text-slate-500 text-xs">No records yet</span>
            )}
          </div>
          {loading ? (
            <div className="h-64 animate-pulse bg-white/5 rounded-lg" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              No data available. Train a forecast or upload data first.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="solar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wind" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="demand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} interval={7} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="Solar"  stroke="#00d4ff" fill="url(#solar)"  strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Wind"   stroke="#00ff88" fill="url(#wind)"   strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Demand" stroke="#f59e0b" fill="url(#demand)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right column: Battery + Decision + Quick Actions */}
        <div className="space-y-4">
          {/* Battery SOC gauge */}
          <div className="glass p-5">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-4">Battery State of Charge</h3>
            {loading ? <div className="h-20 animate-pulse bg-white/5 rounded" /> : (
              <>
                <div className="flex items-end gap-3 mb-3">
                  <span className={`text-4xl font-black ${battSOC > 50 ? 'text-energy-green' : battSOC > 20 ? 'text-amber-400' : 'text-red-400'}`}>
                    {battSOC.toFixed(0)}%
                  </span>
                  <span className="text-slate-500 text-sm mb-1">{latest?.batteryCapacity || 500} kWh total</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${battSOC}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: battSOC > 50 ? '#00ff88' : battSOC > 20 ? '#f59e0b' : '#ef4444' }}
                  />
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  {battSOC > 80 ? 'Battery healthy — consider exporting surplus' :
                   battSOC > 40 ? 'Battery adequate' :
                   battSOC > 20 ? 'Battery running low — reduce discharge' :
                   '⚠ Critical — import from grid recommended'}
                </p>
              </>
            )}
          </div>

          {/* Current Decision */}
          <div className="glass p-5" style={{ borderColor: `${actionColor}30` }}>
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Current Decision</h3>
            {loading ? <div className="h-12 animate-pulse bg-white/5 rounded" /> : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${actionColor}20`, border: `1px solid ${actionColor}40` }}>
                  <Zap style={{ color: actionColor }} size={22} />
                </div>
                <div>
                  <p className="text-white font-bold text-xl" style={{ color: actionColor }}>{action}</p>
                  <p className="text-slate-500 text-xs">
                    {action === 'STORE' && 'Charging battery with surplus'}
                    {action === 'EXPORT' && 'Selling excess to grid'}
                    {action === 'USE'   && 'Using renewable directly'}
                    {action === 'GRID'  && 'Importing from grid'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass p-4">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate('/forecast')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-white/5 hover:bg-energy-cyan/10 hover:border-energy-cyan/30 border border-white/5 text-slate-400 hover:text-energy-cyan transition-all text-xs">
                <TrendingUp size={16} />Forecast
              </button>
              <button onClick={() => navigate('/energy-flow')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-white/5 hover:bg-energy-green/10 hover:border-energy-green/30 border border-white/5 text-slate-400 hover:text-energy-green transition-all text-xs">
                <Zap size={16} />Flow
              </button>
              <button onClick={() => navigate('/simulator')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-white/5 hover:bg-amber-400/10 hover:border-amber-400/30 border border-white/5 text-slate-400 hover:text-amber-400 transition-all text-xs">
                <BarChart2 size={16} />Simulate
              </button>
              <button onClick={() => navigate('/copilot')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-white/5 hover:bg-purple-400/10 hover:border-purple-400/30 border border-white/5 text-slate-400 hover:text-purple-400 transition-all text-xs">
                <Bot size={16} />Copilot
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset summary */}
      {stats && (
        <div className="glass p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <BarChart2 size={14} className="text-energy-cyan" />Dataset Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-bold text-energy-cyan">{(stats.totalRecords || 0).toLocaleString()}</p><p className="text-slate-400 text-xs">Total Records</p></div>
            <div><p className="text-2xl font-bold text-energy-green">{(stats.totals?.totalGeneration || 0).toLocaleString()}</p><p className="text-slate-400 text-xs">Total Gen (kWh)</p></div>
            <div><p className="text-2xl font-bold text-amber-400">{(stats.averages?.batterySOC || 0).toFixed(1)}%</p><p className="text-slate-400 text-xs">Avg Battery SOC</p></div>
            <div><p className="text-2xl font-bold text-slate-300">{stats.dateRange?.start ? new Date(stats.dateRange.start).toLocaleDateString() : '—'}</p><p className="text-slate-400 text-xs">Data Start</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

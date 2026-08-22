import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { simulateAPI } from '../services/api';
import { Sliders, Play, TrendingUp, TrendingDown, Zap, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const SliderInput = ({ label, value, onChange, min, max, step = 1, unit, description }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <span className="text-energy-cyan font-mono text-sm font-bold">
        {value > 0 ? '+' : ''}{value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-2 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, #00d4ff ${((value - min) / (max - min)) * 100}%, #1e293b ${((value - min) / (max - min)) * 100}%)`
      }}
    />
    <div className="flex justify-between text-xs text-slate-600">
      <span>{min}{unit}</span>
      {description && <span className="text-slate-500">{description}</span>}
      <span>{max}{unit}</span>
    </div>
  </div>
);

const ComparisonCard = ({ title, baseline, simulated, unit, higherIsBetter = true }) => {
  const diff = simulated - baseline;
  const pct = baseline !== 0 ? ((diff / Math.abs(baseline)) * 100).toFixed(1) : 0;
  const isGood = higherIsBetter ? diff >= 0 : diff <= 0;
  return (
    <div className="glass p-4">
      <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider">{title}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-slate-500 text-xs mb-0.5">Baseline</p>
          <p className="text-white font-bold text-lg">{typeof baseline === 'number' ? baseline.toFixed(1) : baseline} <span className="text-xs text-slate-500">{unit}</span></p>
        </div>
        <div className="text-center px-2">
          <span className={`text-sm font-bold ${isGood ? 'text-energy-green' : 'text-red-400'}`}>
            {diff >= 0 ? '▲' : '▼'} {Math.abs(pct)}%
          </span>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-xs mb-0.5">Simulated</p>
          <p className={`font-bold text-lg ${isGood ? 'text-energy-green' : 'text-red-400'}`}>
            {typeof simulated === 'number' ? simulated.toFixed(1) : simulated} <span className="text-xs text-slate-500">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass p-3 text-xs">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value?.toFixed(1)}</p>
      ))}
    </div>
  );
};

const SimulatorPage = () => {
  const { currentProject } = useProject();
  const [params, setParams] = useState({ solarDelta: 0, windDelta: 0, cloudDelta: 0, demandDelta: 0, batteryCapacity: 500, gridPrice: 0.1 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key, val) => setParams(p => ({ ...p, [key]: val }));

  const handleRun = async () => {
    if (!currentProject) return;
    setLoading(true);
    setError('');
    try {
      const res = await simulateAPI.simulate(currentProject, params);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Simulation failed. Make sure the project has data.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = result ? [
    { name: 'Solar Gen', Baseline: result.baseline.solarGen, Simulated: result.simulated.solarGen },
    { name: 'Wind Gen', Baseline: result.baseline.windGen, Simulated: result.simulated.windGen },
    { name: 'Total Gen', Baseline: result.baseline.totalGeneration, Simulated: result.simulated.totalGeneration },
    { name: 'Demand', Baseline: result.baseline.demand, Simulated: result.simulated.demand },
  ] : [];

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <Sliders size={40} className="mx-auto mb-3 opacity-30" />
          <p>Select a project to use the What-If Simulator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Sliders className="text-energy-cyan" size={24} />
          What-If Simulator
        </h1>
        <p className="text-slate-400 text-sm">Adjust parameters to simulate different energy scenarios before they happen</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel: Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass p-6 space-y-6">
            <h2 className="text-white font-semibold flex items-center gap-2"><Sliders size={16} className="text-energy-cyan" />Simulation Parameters</h2>
            <SliderInput label="Solar Generation Δ" value={params.solarDelta} onChange={v => update('solarDelta', v)} min={-100} max={100} unit="%" description="vs baseline" />
            <SliderInput label="Wind Generation Δ" value={params.windDelta} onChange={v => update('windDelta', v)} min={-100} max={100} unit="%" description="vs baseline" />
            <SliderInput label="Cloud Coverage Δ" value={params.cloudDelta} onChange={v => update('cloudDelta', v)} min={-80} max={80} unit="%" description="affects solar" />
            <SliderInput label="Energy Demand Δ" value={params.demandDelta} onChange={v => update('demandDelta', v)} min={-50} max={100} unit="%" description="vs baseline" />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex justify-between">
                Battery Capacity <span className="text-energy-cyan font-mono">{params.batteryCapacity} kWh</span>
              </label>
              <input type="number" value={params.batteryCapacity} onChange={e => update('batteryCapacity', Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-energy-cyan/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex justify-between">
                Grid Price <span className="text-energy-cyan font-mono">${params.gridPrice}/kWh</span>
              </label>
              <input type="number" step="0.01" value={params.gridPrice} onChange={e => update('gridPrice', Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-energy-cyan/50" />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRun}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-energy-cyan to-energy-green text-bg-space font-bold text-sm glow-cyan hover:opacity-90 transition-all disabled:opacity-60"
            >
              {loading ? <><div className="w-4 h-4 border-2 border-bg-space/30 border-t-bg-space rounded-full animate-spin" />Simulating...</> : <><Play size={16} />Run Simulation</>}
            </motion.button>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20 text-red-400 text-sm">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
          </div>

          {/* Quick presets */}
          <div className="glass p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Quick Presets</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Cloudy Day', solar: -60, cloud: 70, wind: 0, demand: 0 },
                { label: 'Peak Demand', solar: 0, cloud: 0, wind: 0, demand: 50 },
                { label: 'Windy Night', solar: -100, cloud: 30, wind: 80, demand: -20 },
                { label: 'Ideal Solar', solar: 30, cloud: -50, wind: 0, demand: 0 },
              ].map(preset => (
                <button key={preset.label}
                  onClick={() => setParams(p => ({ ...p, solarDelta: preset.solar, cloudDelta: preset.cloud, windDelta: preset.wind, demandDelta: preset.demand }))}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:border-energy-cyan/30 hover:text-energy-cyan transition-colors text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-3 space-y-4">
          {!result ? (
            <div className="glass p-12 flex flex-col items-center justify-center h-full text-center min-h-[400px]">
              <Sliders size={48} className="text-slate-600 mb-4" />
              <p className="text-white font-medium mb-2">Adjust parameters and run simulation</p>
              <p className="text-slate-400 text-sm max-w-xs">The simulator will apply your adjustments to the latest energy record and run it through the Decision Engine.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Comparison cards */}
              <div className="grid grid-cols-2 gap-3">
                <ComparisonCard title="Total Generation" baseline={result.baseline.totalGeneration} simulated={result.simulated.totalGeneration} unit="kW" higherIsBetter={true} />
                <ComparisonCard title="Surplus / Deficit" baseline={result.baseline.surplus} simulated={result.simulated.surplus} unit="kW" higherIsBetter={true} />
                <ComparisonCard title="Energy Demand" baseline={result.baseline.demand} simulated={result.simulated.demand} unit="kW" higherIsBetter={false} />
                <div className="glass p-4">
                  <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Recommended Action</p>
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <p className="text-slate-500 text-xs">Baseline</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${
                        result.baseline.action === 'STORE' ? 'bg-energy-cyan/20 text-energy-cyan' :
                        result.baseline.action === 'EXPORT' ? 'bg-amber-400/20 text-amber-400' :
                        result.baseline.action === 'USE' ? 'bg-energy-green/20 text-energy-green' :
                        'bg-red-400/20 text-red-400'
                      }`}>{result.baseline.action}</span>
                    </div>
                    <span className="text-slate-600 text-lg">→</span>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">Simulated</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${
                        result.simulated.action === 'STORE' ? 'bg-energy-cyan/20 text-energy-cyan' :
                        result.simulated.action === 'EXPORT' ? 'bg-amber-400/20 text-amber-400' :
                        result.simulated.action === 'USE' ? 'bg-energy-green/20 text-energy-green' :
                        'bg-red-400/20 text-red-400'
                      }`}>{result.simulated.action}</span>
                    </div>
                  </div>
                  {result.simulated.action !== result.baseline.action && (
                    <p className="text-amber-400 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={10} />Action changed!</p>
                  )}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="glass p-4">
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-energy-cyan" />Baseline vs. Simulated Comparison</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    <Bar dataKey="Baseline" fill="rgba(148,163,184,0.4)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Simulated" fill="rgba(0,212,255,0.7)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reason text */}
              {result.simulated.reason && (
                <div className="glass p-4 border border-energy-cyan/20">
                  <p className="text-energy-cyan text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Zap size={10} />Decision Reasoning</p>
                  <p className="text-slate-300 text-sm">{result.simulated.reason}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulatorPage;

import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { dataAPI } from '../services/api';
import EnergyFlowDiagram from '../components/EnergyFlowDiagram';
import { Zap, Clock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';


const actionConfig = {
  STORE:  { color: 'text-energy-cyan',  bg: 'bg-energy-cyan/10',  border: 'border-energy-cyan/30',  label: 'Storing Surplus',    emoji: '🔋' },
  EXPORT: { color: 'text-amber-400',    bg: 'bg-amber-400/10',    border: 'border-amber-400/30',    label: 'Exporting to Grid',  emoji: '📤' },
  USE:    { color: 'text-energy-green', bg: 'bg-energy-green/10', border: 'border-energy-green/30', label: 'Direct Consumption', emoji: '🏠' },
  GRID:   { color: 'text-red-400',      bg: 'bg-red-400/10',      border: 'border-red-400/30',      label: 'Grid Import',        emoji: '🔌' },
};

// Client-side decision engine mirror (same logic as backend)
function clientDecision(record) {
  if (!record) return { action: 'USE', reason: 'No data', surplus: 0, deficit: 0, totalGeneration: 0 };
  const solar = record.solarGeneration || 0;
  const wind = record.windGeneration || 0;
  const demand = record.energyDemand || 0;
  const soc = record.batterySOC || 50;
  const gridPrice = record.gridPrice || 0.1;
  const total = solar + wind;
  const surplus = total - demand;
  const socPct = soc / 100;

  let action, reason;
  if (surplus > 0) {
    if (socPct < 0.9 && surplus > 0.1 * total) {
      action = 'STORE'; reason = `Storing ${surplus.toFixed(1)}kW surplus. Battery at ${soc.toFixed(0)}%.`;
    } else if (socPct >= 0.9) {
      action = 'EXPORT'; reason = `Battery full. Exporting ${surplus.toFixed(1)}kW to grid at $${gridPrice.toFixed(3)}/kWh.`;
    } else {
      action = 'USE'; reason = `Using ${total.toFixed(1)}kW directly for consumption.`;
    }
  } else {
    const deficit = Math.abs(surplus);
    if (socPct > 0.2) {
      action = 'USE'; reason = `${deficit.toFixed(1)}kW deficit. Drawing from battery (${soc.toFixed(0)}% SOC).`;
    } else {
      action = 'GRID'; reason = `Battery low (${soc.toFixed(0)}%). Importing ${deficit.toFixed(1)}kW from grid.`;
    }
  }
  return { action, reason, surplus, deficit: surplus < 0 ? Math.abs(surplus) : 0, totalGeneration: total };
}

const EnergyFlowPage = () => {
  const { currentProject } = useProject();
  const [latestRecord, setLatestRecord] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async (silent = false) => {
    if (!currentProject) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      // Get last 8 records for decision history
      const res = await dataAPI.getRecords(currentProject, { limit: 8 });
      const records = res.data?.records || res.data || [];
      if (records.length > 0) {
        setLatestRecord(records[0]);
        setRecentRecords(records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentProject]);

  useEffect(() => {
    if (!autoRefresh || !currentProject) return;
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [currentProject, autoRefresh]);

  const decision = clientDecision(latestRecord);
  const cfg = actionConfig[decision.action] || actionConfig.USE;

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center"><Zap size={40} className="mx-auto mb-3 opacity-30" /><p>Select a project to view energy flow.</p></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Zap className="text-energy-cyan" size={24} />Energy Flow Topology
          </h1>
          <p className="text-slate-400 text-sm">Real-time power distribution visualization</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer">
            <div className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${autoRefresh ? 'bg-energy-cyan' : 'bg-slate-600'}`}
              onClick={() => setAutoRefresh(p => !p)}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            Auto-refresh
          </label>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main diagram */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="glass p-8 h-[440px] animate-pulse flex items-center justify-center">
              <div className="text-slate-600">Loading energy flow...</div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EnergyFlowDiagram
                solarGen={latestRecord?.solarGeneration || 0}
                windGen={latestRecord?.windGeneration || 0}
                decision={decision.action}
                surplus={decision.surplus}
                deficit={decision.deficit}
                batterySOC={latestRecord?.batterySOC || 50}
                demand={latestRecord?.energyDemand || 0}
              />
            </motion.div>
          )}

          {/* Decision explanation */}
          <div className={`glass p-5 flex items-start gap-4 ${cfg.border} border-l-4 ${cfg.bg}`}>
            <span className="text-3xl">{cfg.emoji}</span>
            <div>
              <h3 className={`text-lg font-bold mb-1 ${cfg.color}`}>
                {cfg.label} — {decision.action}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">{decision.reason}</p>
              {latestRecord && (
                <div className="flex gap-4 mt-3">
                  <span className="text-slate-500 text-xs">Solar: <span className="text-energy-cyan font-medium">{(latestRecord.solarGeneration || 0).toFixed(1)}kW</span></span>
                  <span className="text-slate-500 text-xs">Wind: <span className="text-energy-green font-medium">{(latestRecord.windGeneration || 0).toFixed(1)}kW</span></span>
                  <span className="text-slate-500 text-xs">Demand: <span className="text-white font-medium">{(latestRecord.energyDemand || 0).toFixed(1)}kW</span></span>
                  <span className="text-slate-500 text-xs">SOC: <span className="text-amber-400 font-medium">{(latestRecord.batterySOC || 0).toFixed(0)}%</span></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Decision history */}
        <div className="glass p-5 flex flex-col">
          <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2 text-sm">
            <Clock size={14} className="text-energy-cyan" />Decision History
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3">
            {recentRecords.length === 0 ? (
              <p className="text-slate-500 text-xs text-center mt-4">No records yet</p>
            ) : recentRecords.map((record, i) => {
              const d = clientDecision(record);
              const c = actionConfig[d.action] || actionConfig.USE;
              const ts = new Date(record.timestamp);
              return (
                <motion.div
                  key={record._id || i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pl-4 border-l border-slate-700 pb-3 last:pb-0"
                >
                  <div className={`absolute w-2 h-2 rounded-full -left-[4.5px] top-1.5 ${d.action === 'STORE' ? 'bg-energy-cyan' : d.action === 'EXPORT' ? 'bg-amber-400' : d.action === 'USE' ? 'bg-energy-green' : 'bg-red-400'}`} />
                  <div className="text-xs text-slate-500 mb-1">
                    {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {ts.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                  <div className={`text-sm font-bold ${c.color} mb-0.5`}>{d.action}</div>
                  <div className="text-xs text-slate-400 leading-tight">{d.reason.slice(0, 60)}{d.reason.length > 60 ? '...' : ''}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyFlowPage;

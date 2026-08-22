import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { alertsAPI, forecastAPI } from '../services/api';
import { Bell, AlertTriangle, XCircle, TrendingUp, CheckCircle, Clock, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const typeConfig = {
  critical: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', label: 'Critical' },
  warning:  { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', label: 'Warning' },
  opportunity: { icon: TrendingUp, color: 'text-energy-green', bg: 'bg-energy-green/10', border: 'border-energy-green/30', label: 'Opportunity' },
};

const AlertCard = ({ alert, onResolve }) => {
  const cfg = typeConfig[alert.type] || typeConfig.warning;
  const Icon = cfg.icon;
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className={`glass p-4 flex items-start gap-4 ${cfg.border} border-l-2 hover:border-l-4 transition-all`}
    >
      <div className={`p-2 rounded-lg ${cfg.bg} flex-shrink-0`}>
        <Icon className={cfg.color} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
          <span className="text-slate-600 text-xs flex items-center gap-1"><Clock size={10} />{timeAgo(alert.timestamp)}</span>
        </div>
        <p className="text-white text-sm font-medium mb-1">{alert.message}</p>
        {alert.detail && <p className="text-slate-400 text-xs leading-relaxed">{alert.detail}</p>}
      </div>
      <button
        onClick={() => onResolve(alert._id)}
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
        title="Mark as resolved"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

const AlertsPage = () => {
  const { currentProject } = useProject();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [generating, setGenerating] = useState(false);

  const fetchAlerts = async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      const res = await alertsAPI.getAlerts(currentProject);
      setAlerts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [currentProject]);

  const handleResolve = async (alertId) => {
    try {
      await alertsAPI.resolveAlert(alertId);
      setAlerts(prev => prev.filter(a => a._id !== alertId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateForecast = async () => {
    if (!currentProject) return;
    setGenerating(true);
    try {
      await forecastAPI.generate(currentProject);
      await fetchAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.type === filter);
  const counts = {
    all: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    opportunity: alerts.filter(a => a.type === 'opportunity').length,
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p>Please select or create a project to view alerts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Bell className="text-energy-cyan" size={24} />
            Alerts & Notifications
          </h1>
          <p className="text-slate-400 text-sm">Auto-generated from forecast analysis and decision engine</p>
        </div>
        <button
          onClick={handleGenerateForecast}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-energy-cyan/10 border border-energy-cyan/30 text-energy-cyan text-sm hover:bg-energy-cyan/20 transition-colors disabled:opacity-50"
        >
          {generating ? <div className="w-4 h-4 border-2 border-energy-cyan/30 border-t-energy-cyan rounded-full animate-spin" /> : <TrendingUp size={14} />}
          {generating ? 'Generating...' : 'Refresh Forecast & Alerts'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { key: 'all', label: 'Total Alerts', color: 'text-white', bg: 'bg-white/5', border: 'border-white/10' },
          { key: 'critical', label: 'Critical', color: 'text-red-400', bg: 'bg-red-400/5', border: 'border-red-400/20' },
          { key: 'warning', label: 'Warnings', color: 'text-amber-400', bg: 'bg-amber-400/5', border: 'border-amber-400/20' },
          { key: 'opportunity', label: 'Opportunities', color: 'text-energy-green', bg: 'bg-energy-green/5', border: 'border-energy-green/20' },
        ].map(({ key, label, color, bg, border }) => (
          <div key={key} className={`glass p-4 ${bg} border ${border} text-center cursor-pointer hover:opacity-80 transition-opacity`} onClick={() => setFilter(key)}>
            <div className={`text-3xl font-bold ${color}`}>{counts[key]}</div>
            <div className="text-slate-400 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-slate-500" />
        {['all', 'critical', 'warning', 'opportunity'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === f ? 'bg-energy-cyan text-bg-space' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {f} {counts[f] > 0 && `(${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-white/10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-1/4" />
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass p-12 text-center">
          <CheckCircle size={48} className="mx-auto mb-4 text-energy-green opacity-50" />
          <p className="text-white font-medium mb-2">No {filter !== 'all' ? filter : ''} alerts</p>
          <p className="text-slate-400 text-sm">
            {alerts.length === 0
              ? 'Generate a forecast to populate alerts from the decision engine analysis.'
              : 'All alerts in this category have been resolved.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(alert => (
              <AlertCard key={alert._id} alert={alert} onResolve={handleResolve} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;

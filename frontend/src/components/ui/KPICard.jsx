import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPICard = ({ title, value, unit, change, changeType, icon: Icon, color = 'cyan', loading }) => {
  const colorMap = {
    cyan: 'text-energy-cyan border-energy-cyan/30 bg-energy-cyan/5',
    green: 'text-energy-green border-energy-green/30 bg-energy-green/5',
    amber: 'text-energy-amber border-energy-amber/30 bg-energy-amber/5',
    red: 'text-energy-red border-energy-red/30 bg-energy-red/5'
  };

  const glowMap = {
    cyan: 'glow-cyan',
    green: 'glow-green',
    amber: 'glow-amber',
    red: 'glow-red'
  };

  const TrendIcon = changeType === 'up' ? TrendingUp : changeType === 'down' ? TrendingDown : Minus;
  const trendColor = changeType === 'up' ? 'text-energy-green' : changeType === 'down' ? 'text-energy-red' : 'text-slate-400';

  if (loading) {
    return (
      <div className="glass p-5 rounded-xl h-[120px] flex flex-col justify-between animate-pulse">
        <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
        <div className="h-8 bg-slate-700/50 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-slate-500 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        {Icon && (
          <div className={`p-2 rounded-lg border ${colorMap[color]} ${glowMap[color]} opacity-80`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
        {unit && <span className="text-sm text-slate-500 font-medium">{unit}</span>}
      </div>

      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
          <TrendIcon size={14} />
          <span>{change}</span>
        </div>
      )}

      {/* Decorative gradient blur in background */}
      <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-2xl opacity-20 ${color === 'cyan' ? 'bg-energy-cyan' : color === 'green' ? 'bg-energy-green' : color === 'amber' ? 'bg-energy-amber' : 'bg-energy-red'}`}></div>
    </motion.div>
  );
};

export default KPICard;

import React from 'react';
import { Battery, BatteryCharging, Zap, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const DecisionBadge = ({ decision = 'USE' }) => {
  const config = {
    USE: { color: 'energy-green', icon: Zap, label: 'USE', desc: 'Direct consumption' },
    STORE: { color: 'energy-cyan', icon: BatteryCharging, label: 'STORE', desc: 'Charging battery' },
    EXPORT: { color: 'energy-amber', icon: ArrowRightLeft, label: 'EXPORT', desc: 'Selling to grid' },
    GRID: { color: 'energy-red', icon: Battery, label: 'GRID', desc: 'Buying from grid' }
  };

  const curr = config[decision] || config.USE;
  const Icon = curr.icon;

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`glass p-6 rounded-xl flex flex-col items-center justify-center w-full h-[200px] border-${curr.color}/30 bg-${curr.color}/5 glow-${curr.color.split('-')[1]}`}
    >
      <h3 className="absolute top-4 left-4 text-slate-300 font-medium text-sm">AI Decision</h3>
      
      <div className={`p-4 rounded-full bg-${curr.color}/10 border border-${curr.color}/50 mb-3`}>
        <Icon size={32} className={`text-${curr.color}`} />
      </div>
      
      <span className={`text-2xl font-bold tracking-widest text-${curr.color}`}>
        {curr.label}
      </span>
      <span className="text-slate-400 text-sm mt-1">{curr.desc}</span>
    </motion.div>
  );
};

export default DecisionBadge;

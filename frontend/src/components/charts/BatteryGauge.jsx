import React from 'react';
import { motion } from 'framer-motion';

const BatteryGauge = ({ soc = 0 }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // Use a half-circle gauge: 180 degrees
  const offset = circumference - (soc / 100) * (circumference / 2);
  
  let color = '#ef4444'; // red
  if (soc > 50) color = '#00ff88'; // green
  else if (soc >= 20) color = '#f59e0b'; // amber

  return (
    <div className="glass p-4 rounded-xl flex flex-col items-center justify-center relative w-full h-[200px]">
      <h3 className="absolute top-4 left-4 text-slate-300 font-medium text-sm">Battery SOC</h3>
      
      <div className="relative w-[160px] h-[80px] overflow-hidden mt-6">
        <svg width="160" height="160" className="transform -rotate-180">
          <circle
            cx="80" cy="80" r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth="16"
            strokeDasharray={circumference}
            strokeDashoffset={circumference / 2}
            className="opacity-50"
          />
          <motion.circle
            cx="80" cy="80" r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="16"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference / 2 + offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        <div className="absolute bottom-0 w-full text-center flex flex-col items-center">
          <span className="text-3xl font-bold text-white tracking-tight">{soc.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default BatteryGauge;

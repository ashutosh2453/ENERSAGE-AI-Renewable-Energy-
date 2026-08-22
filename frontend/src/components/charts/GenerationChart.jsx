import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-3 !bg-surface/90">
        <p className="text-slate-300 text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm font-medium">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="text-white">{Number(entry.value).toFixed(2)} kW</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const GenerationChart = ({ data, title = "Power Generation", height = 300 }) => {
  return (
    <div className="glass p-4 h-full w-full flex flex-col">
      <h3 className="text-slate-300 font-medium mb-4">{title}</h3>
      <div style={{ height }} className="w-full relative">
        {(!data || data.length === 0) ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Area 
                type="monotone" 
                dataKey="solarGeneration" 
                name="Solar" 
                stroke="#00d4ff" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSolar)" 
              />
              <Area 
                type="monotone" 
                dataKey="windGeneration" 
                name="Wind" 
                stroke="#00ff88" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorWind)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default GenerationChart;

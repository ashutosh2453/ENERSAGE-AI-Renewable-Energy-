import React, { useState } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-3 !bg-surface/90">
        <p className="text-slate-300 text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm font-medium">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="text-white">{Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ForecastChart = ({ data, title = "Demand Forecast" }) => {
  const [filter, setFilter] = useState('24h');
  
  // In a real app, 'data' would be filtered based on the 'filter' state
  // Assuming 'data' contains { time, actual, forecast, lowerBound, upperBound }
  
  return (
    <div className="glass p-4 flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-300 font-medium">{title}</h3>
        <div className="flex gap-2">
          {['6h', '24h', '3d', '7d'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                filter === f 
                  ? 'bg-energy-cyan/20 border-energy-cyan text-energy-cyan' 
                  : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 w-full relative min-h-[300px]">
        {(!data || data.length === 0) ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">No forecast data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              
              {/* Confidence Band */}
              <Area type="monotone" dataKey="upperBound" stroke="none" fill="#f59e0b" fillOpacity={0.1} name="Upper Bound" />
              <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#0a0d14" fillOpacity={1} name="Lower Bound" />
              
              <Line type="monotone" dataKey="actual" name="Actual Demand" stroke="#94a3b8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="forecast" name="Forecast Demand" stroke="#00d4ff" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ForecastChart;

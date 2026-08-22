import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const actionColors = {
  STORE: '#00d4ff',
  EXPORT: '#f59e0b',
  USE: '#00ff88',
  GRID: '#ef4444',
};

const FlowNode = ({ x, y, label, icon, value, unit, color, glow, active }) => (
  <g>
    <rect x={x - 60} y={y - 35} width={120} height={70} rx={10}
      fill={active ? `${color}18` : 'rgba(17,24,39,0.9)'}
      stroke={color}
      strokeWidth={active ? 2.5 : 1.5}
      filter={glow ? `drop-shadow(0 0 ${active ? 14 : 7}px ${color})` : 'none'} />
    <text x={x} y={y - 12} textAnchor="middle" fill={color} fontSize={20} fontFamily="serif">{icon}</text>
    <text x={x} y={y + 8} textAnchor="middle" fill="#f1f5f9" fontSize={13} fontWeight={600}>{label}</text>
    {value !== undefined && (
      <text x={x} y={y + 24} textAnchor="middle" fill={color} fontSize={12} fontWeight={700}>
        {typeof value === 'number' ? value.toFixed(1) : value} {unit}
      </text>
    )}
  </g>
);


const AnimatedArrow = ({ x1, y1, x2, y2, color, active, power, delay = 0 }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const opacity = active ? 1 : 0.2;

  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={active ? 2.5 : 1.5}
        strokeDasharray="8 4"
        style={{ animation: active ? `dash 1.2s linear infinite` : 'none', animationDelay: `${delay}s` }}
        filter={active ? `drop-shadow(0 0 4px ${color})` : 'none'} />
      {/* Arrowhead */}
      <polygon
        points={`0,-5 10,0 0,5`}
        fill={color}
        transform={`translate(${x2},${y2}) rotate(${angle})`}
      />
      {/* Power label */}
      {active && power !== undefined && (
        <text x={mx} y={my - 10} textAnchor="middle" fill={color} fontSize={11} fontWeight={700}>
          {typeof power === 'number' ? power.toFixed(1) : power} kW
        </text>
      )}
    </g>
  );
};

const EnergyFlowDiagram = ({ solarGen = 0, windGen = 0, decision = 'USE', surplus = 0, deficit = 0, batterySOC = 50, demand = 0 }) => {
  const totalGen = solarGen + windGen;
  const actionColor = actionColors[decision] || '#00d4ff';

  // Node positions (SVG coordinate space 700 × 420)
  const nodes = {
    solar:   { x: 100, y: 120 },
    wind:    { x: 100, y: 300 },
    manager: { x: 350, y: 210 },
    use:     { x: 590, y: 100 },
    store:   { x: 590, y: 200 },
    export:  { x: 590, y: 300 },
    grid:    { x: 590, y: 395 },
  };

  const isStore  = decision === 'STORE';
  const isExport = decision === 'EXPORT';
  const isGrid   = decision === 'GRID';
  const isUse    = decision === 'USE';

  return (
    <div className="glass p-4 rounded-xl relative overflow-hidden">
      <style>{`
        @keyframes dash { to { stroke-dashoffset: -24; } }
      `}</style>
      <svg viewBox="0 0 700 440" className="w-full" style={{ maxHeight: 440 }}>
        {/* Source → Manager arrows */}
        <AnimatedArrow x1={160} y1={120} x2={290} y2={185} color="#00d4ff" active={solarGen > 0} power={solarGen} delay={0} />
        <AnimatedArrow x1={160} y1={300} x2={290} y2={230} color="#00ff88" active={windGen > 0} power={windGen} delay={0.3} />

        {/* Manager → Outputs */}
        <AnimatedArrow x1={410} y1={185} x2={530} y2={115} color={actionColors.USE}    active={isUse}    power={isUse ? totalGen : 0}     delay={0} />
        <AnimatedArrow x1={410} y1={200} x2={530} y2={200} color={actionColors.STORE}  active={isStore}  power={isStore ? surplus : 0}    delay={0.2} />
        <AnimatedArrow x1={410} y1={215} x2={530} y2={290} color={actionColors.EXPORT} active={isExport} power={isExport ? surplus : 0}   delay={0.4} />
        <AnimatedArrow x1={410} y1={225} x2={530} y2={380} color={actionColors.GRID}   active={isGrid}   power={isGrid ? deficit : 0}     delay={0.6} />

        {/* Nodes */}
        <FlowNode {...nodes.solar}   label="Solar"   icon="☀" value={solarGen}  unit="kW" color="#00d4ff" glow={solarGen > 0} />
        <FlowNode {...nodes.wind}    label="Wind"    icon="🌬" value={windGen}   unit="kW" color="#00ff88" glow={windGen > 0} />
        <FlowNode {...nodes.manager} label="Manager" icon="⚡" value={totalGen}  unit="kW" color={actionColor} glow={true} />
        <FlowNode {...nodes.use}     label="USE"     icon="🏠" value={demand}    unit="kW" color={actionColors.USE}    glow={isUse}    active={isUse} />
        <FlowNode {...nodes.store}   label="STORE"   icon="🔋" value={batterySOC} unit="%" color={actionColors.STORE}  glow={isStore}  active={isStore} />
        <FlowNode {...nodes.export}  label="EXPORT"  icon="📤" value={isExport ? surplus : 0} unit="kW" color={actionColors.EXPORT} glow={isExport} active={isExport} />
        <FlowNode {...nodes.grid}    label="GRID"    icon="🔌" value={isGrid ? deficit : 0} unit="kW" color={actionColors.GRID} glow={isGrid} active={isGrid} />





        {/* Legend */}
        <text x={10} y={430} fill="#475569" fontSize={10}>
          ● Active flow | ○ Inactive
        </text>
        <text x={350} y={430} textAnchor="middle" fill={actionColor} fontSize={12} fontWeight={700}>
          Decision: {decision}
        </text>
      </svg>
    </div>
  );
};

export default EnergyFlowDiagram;

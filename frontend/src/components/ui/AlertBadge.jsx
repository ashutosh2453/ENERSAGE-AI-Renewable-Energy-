import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const AlertBadge = ({ type = 'info', size = 'sm', showIcon = true }) => {
  const config = {
    critical: {
      color: 'text-energy-red bg-energy-red/10 border-energy-red/30',
      icon: AlertCircle,
      label: 'Critical'
    },
    warning: {
      color: 'text-energy-amber bg-energy-amber/10 border-energy-amber/30',
      icon: AlertTriangle,
      label: 'Warning'
    },
    opportunity: {
      color: 'text-energy-green bg-energy-green/10 border-energy-green/30',
      icon: CheckCircle,
      label: 'Opportunity'
    },
    info: {
      color: 'text-energy-cyan bg-energy-cyan/10 border-energy-cyan/30',
      icon: Info,
      label: 'Info'
    }
  };

  const current = config[type] || config.info;
  const Icon = current.icon;
  
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <div className={`inline-flex items-center gap-1.5 border rounded-full font-medium tracking-wide ${current.color} ${sizeClasses}`}>
      {showIcon && <Icon size={iconSize} />}
      {current.label}
    </div>
  );
};

export default AlertBadge;

import React from 'react';

const LoadingSkeleton = ({ className = '', type = 'box' }) => {
  const baseClass = "bg-slate-700/30 animate-pulse rounded-md";
  
  if (type === 'text') {
    return <div className={`${baseClass} h-4 w-full ${className}`}></div>;
  }
  
  if (type === 'circle') {
    return <div className={`${baseClass} rounded-full ${className}`}></div>;
  }

  return <div className={`${baseClass} ${className}`}></div>;
};

export default LoadingSkeleton;

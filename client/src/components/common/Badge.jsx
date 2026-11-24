import React from 'react';

export const Badge = ({
  children,
  variant = 'gold', // 'gold' | 'blue' | 'green' | 'amber' | 'red' | 'gray'
  size = 'md',      // 'sm' | 'md'
  className = '',
  pulse = false,
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  const variantStyles = {
    gold: 'bg-salon-gold/20 text-salon-gold border border-salon-gold/40',
    blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
    green: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    amber: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    red: 'bg-red-500/20 text-red-400 border border-red-500/40',
    gray: 'bg-gray-700/50 text-gray-300 border border-gray-600',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full select-none ${sizeStyles[size]} ${variantStyles[variant]} ${pulse ? 'animate-pulse' : ''} ${className}`}
    >
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
};

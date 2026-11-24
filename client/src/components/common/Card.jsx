import React from 'react';

export const Card = ({
  children,
  className = '',
  variant = 'default', // 'default' | 'elevated' | 'goldBorder' | 'glass'
  onClick,
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-200';

  const variantStyles = {
    default: 'bg-salon-darker border border-gray-800 p-6 shadow-card-dark',
    elevated: 'bg-salon-surface border border-gray-700 p-6 shadow-xl',
    goldBorder: 'bg-salon-darker border-2 border-salon-gold/60 p-6 shadow-gold-glow',
    glass: 'bg-salon-darker/80 backdrop-blur-md border border-gray-800 p-6 shadow-xl',
  };

  const interactiveStyles = onClick ? 'cursor-pointer hover:border-salon-gold/50 active:scale-[0.99]' : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${interactiveStyles} ${className}`}
    >
      {children}
    </div>
  );
};

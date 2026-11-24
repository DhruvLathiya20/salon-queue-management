import React from 'react';

export const Button = ({
  children,
  onClick,
  variant = 'gold', // 'gold' | 'outline' | 'danger' | 'ghost' | 'secondary'
  size = 'md',       // 'sm' | 'md' | 'lg' | 'xl'
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  icon: Icon = null,
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-salon-gold/50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 font-semibold',
    xl: 'px-8 py-4 text-lg gap-3 font-bold',
  };

  const variantStyles = {
    gold: 'bg-salon-gold hover:bg-salon-goldHover text-black font-semibold shadow-gold-glow hover:shadow-lg',
    outline: 'border border-salon-gold text-salon-gold hover:bg-salon-gold/10',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-900/30',
    ghost: 'text-salon-textSecondary hover:text-white hover:bg-salon-surface/50',
    secondary: 'bg-salon-surface hover:bg-gray-600 text-salon-textPrimary border border-gray-600',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
};

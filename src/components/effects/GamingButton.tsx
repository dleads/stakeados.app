'use client';

import React from 'react';
import Link from 'next/link';

export interface GamingButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'neon' | 'cyber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export default function GamingButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}: GamingButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-black font-bold shadow-lg hover:shadow-green-500/50 hover:scale-105';
      case 'secondary':
        return 'border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-black font-bold hover:shadow-green-500/50';
      case 'neon':
        return 'border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-black hover:shadow-xl hover:shadow-green-500/50';
      case 'cyber':
        return 'bg-gray-900/50 backdrop-blur-sm border border-gray-700 hover:border-green-500/50 text-white hover:shadow-green-500/20';
      default:
        return '';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm';
      case 'md':
        return 'px-6 py-3 text-base';
      case 'lg':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  const baseClasses = `
    relative
    inline-flex
    items-center
    justify-center
    font-bold
    text-center
    rounded-lg
    transition-all
    duration-300
    transform
    hover:scale-105
    active:scale-95
    focus:outline-none
    focus:ring-2
    focus:ring-green-400/50
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:scale-100
    overflow-hidden
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${className}
  `;

  const ButtonContent = () => (
    <>
      <span className="relative z-10 flex items-center space-x-2">
        {children}
      </span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={baseClasses}>
        <ButtonContent />
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={baseClasses}>
      <ButtonContent />
    </button>
  );
}

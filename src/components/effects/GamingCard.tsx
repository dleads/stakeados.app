'use client';

import React from 'react';

export interface GamingCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'neon' | 'holographic' | 'cyber';
  className?: string;
  hover?: boolean;
}

export default function GamingCard({
  children,
  variant = 'default',
  className = '',
  hover = true,
}: GamingCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'neon':
        return 'bg-gray-900/50 backdrop-blur-sm border border-gray-700 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20';
      case 'holographic':
        return 'bg-gray-900/50 backdrop-blur-sm border border-gray-700 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20';
      case 'cyber':
        return 'bg-gray-900/50 backdrop-blur-sm border border-gray-700 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20';
      default:
        return 'bg-gray-900/50 backdrop-blur-sm border border-gray-700 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20';
    }
  };

  const baseClasses = `
    relative
    rounded-lg
    p-6
    backdrop-blur-sm
    transition-all
    duration-300
    ${hover ? 'hover:transform hover:scale-105' : ''}
    ${getVariantClasses()}
    ${className}
  `;

  return (
    <div className={baseClasses}>
      {variant === 'holographic' && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-400/10 via-pink-400/10 to-cyan-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}

      {variant === 'cyber' && (
        <>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent" />
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent" />
        </>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

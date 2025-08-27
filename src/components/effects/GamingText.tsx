'use client';

import React from 'react';

export interface GamingTextProps {
  text: string;
  variant?: 'neon' | 'glitch' | 'typewriter' | 'matrix';
  className?: string;
  speed?: number;
}

export default function GamingText({
  text,
  variant = 'neon',
  className = '',
}: GamingTextProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'neon':
        return 'bg-gradient-to-r from-green-400 via-green-300 to-green-500 bg-clip-text text-transparent font-bold';
      case 'glitch':
        return 'text-red-400 animate-pulse font-semibold';
      case 'typewriter':
        return 'font-mono bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent font-medium';
      case 'matrix':
        return 'font-mono text-green-400 font-medium';
      default:
        return '';
    }
  };

  return <span className={`${getVariantClasses()} ${className}`}>{text}</span>;
}

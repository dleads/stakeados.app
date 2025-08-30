'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { a11yUtils, KEYBOARD_KEYS } from '@/lib/navigation/accessibility';

export interface NavLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function NavLogo({
  className,
  size = 'md',
  showText = false,
}: NavLogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto md:h-12 lg:h-14',
    lg: 'h-16 w-auto',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
      e.preventDefault();
      // The Link component will handle the navigation
      (e.target as HTMLElement).click();
    }
  };

  return (
    <Link
      href="/"
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center group rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 p-2 hover:bg-stakeados-primary/5',
        a11yUtils.getFocusStyles(),
        className
      )}
      aria-label="Stakeados - Ir a la página principal"
      title="Ir a la página principal de Stakeados"
    >
      <Image
        src="https://res.cloudinary.com/dvmtkwrme/image/upload/v1756440936/logo_2_yrsudy.svg"
        alt="Logotipo de Stakeados - Plataforma de staking y blockchain"
        width={64}
        height={64}
        priority
        sizes="(min-width: 1024px) 56px, (min-width: 768px) 48px, 40px"
        className={cn(
          sizeClasses[size],
          'drop-shadow-[0_0_8px_rgba(0,0,0,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(0,255,136,0.6)] transition-all duration-300 group-hover:brightness-110'
        )}
        role="img"
      />
      
      {showText && (
        <span className="ml-3 text-xl font-bold text-white group-hover:text-stakeados-primary transition-all duration-300 group-hover:text-glow">
          Stakeados
        </span>
      )}
    </Link>
  );
}
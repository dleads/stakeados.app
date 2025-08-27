'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: (theme: 'dark' | 'light') => void;
  className?: string;
}

export default function AdminThemeToggle({
  theme,
  onToggle,
  className,
}: AdminThemeToggleProps) {
  const t = useTranslations('admin.layout.customization');

  const themes = [
    {
      value: 'dark' as const,
      icon: Moon,
      label: t('darkTheme'),
      description: t('darkThemeDesc'),
    },
    {
      value: 'light' as const,
      icon: Sun,
      label: t('lightTheme'),
      description: t('lightThemeDesc'),
    },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  const handleThemeChange = () => {
    const currentIndex = themes.findIndex(t => t.value === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    onToggle(themes[nextIndex].value);
  };

  return (
    <button
      onClick={handleThemeChange}
      className={cn(
        'p-2 rounded-gaming transition-all duration-200 group relative',
        'text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700',
        className
      )}
      title={`${currentTheme.label} - ${t('clickToChange')}`}
    >
      <CurrentIcon className="w-5 h-5" />

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gaming-card border border-stakeados-gray-600 rounded-gaming shadow-glow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
        <div className="text-sm font-medium text-white">
          {currentTheme.label}
        </div>
        <div className="text-xs text-stakeados-gray-400">
          {currentTheme.description}
        </div>

        {/* Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-stakeados-gray-600"></div>
      </div>
    </button>
  );
}

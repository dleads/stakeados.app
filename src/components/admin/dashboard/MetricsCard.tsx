'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface MetricsCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  Icon: LucideIcon;
  accentBg?: string; // e.g., 'bg-emerald-400/10'
  accentText?: string; // e.g., 'text-emerald-400'
  loading?: boolean;
  onClick?: () => void;
}

export function MetricsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  Icon,
  accentBg = 'bg-gray-700/40',
  accentText = 'text-gray-300',
  loading = false,
  onClick,
}: MetricsCardProps) {
  const changeColor =
    changeType === 'increase'
      ? 'text-green-400'
      : changeType === 'decrease'
        ? 'text-red-400'
        : 'text-gray-400';

  const trendArrow =
    changeType === 'increase' ? '▲' : changeType === 'decrease' ? '▼' : '•';

  return (
    <div
      className={`bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-all ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={title}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1" aria-busy={loading}>
            {loading ? '...' : value}
          </p>
          {typeof change === 'number' && (
            <p className={`text-sm mt-1 ${changeColor}`} aria-live="polite">
              {trendArrow} {change > 0 ? '+' : ''}
              {change}% vs ayer
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${accentBg}`} aria-hidden="true">
          <Icon className={`w-6 h-6 ${accentText}`} />
        </div>
      </div>
    </div>
  );
}

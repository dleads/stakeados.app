'use client';

import React from 'react';
import { useBaseName } from '@/hooks/useBaseName';
import { Globe, Loader2 } from 'lucide-react';
import type { Address } from 'viem';

interface BaseNameDisplayProps {
  address?: Address;
  showIcon?: boolean;
  showAvatar?: boolean;
  showDescription?: boolean;
  className?: string;
}

export default function BaseNameDisplay({
  address,
  showIcon = true,
  showAvatar = false,
  showDescription = false,
  className = '',
}: BaseNameDisplayProps) {
  const { name, avatar, description, isLoading, hasBaseName } =
    useBaseName(address);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 text-stakeados-gray-400 animate-spin" />
        <span className="text-stakeados-gray-400 text-sm">Loading...</span>
      </div>
    );
  }

  if (!hasBaseName || !name) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showAvatar && avatar && (
        <img
          src={avatar}
          alt={`${name} avatar`}
          className="w-6 h-6 rounded-full"
        />
      )}
      <div className="flex items-center gap-2">
        {showIcon && <Globe className="w-4 h-4 text-stakeados-blue" />}
        <div>
          <span className="text-stakeados-blue font-medium">{name}</span>
          {showDescription && description && (
            <div className="text-xs text-stakeados-gray-400 mt-1">
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

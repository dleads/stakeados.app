'use client';

import React, { useMemo } from 'react';
import { useBaseName } from '@/hooks/useBaseName';
import { User } from 'lucide-react';
import { generateAvatarUrl } from '@/lib/utils';
import type { Address } from 'viem';

interface UserAvatarProps {
  address?: Address;
  profileAvatarUrl?: string | null;
  displayName?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBaseNameAvatar?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const iconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

function UserAvatar({
  address,
  profileAvatarUrl,
  displayName,
  size = 'md',
  showBaseNameAvatar = true,
  className = '',
}: UserAvatarProps) {
  // Always call useBaseName, but handle the case where address might be undefined
  const { avatar: baseNameAvatar, loading: isLoading } = useBaseName(address);

  // Memoize the avatar URL to avoid unnecessary recalculations
  const avatarUrl = useMemo(() => {
    if (profileAvatarUrl) return profileAvatarUrl;
    if (showBaseNameAvatar && baseNameAvatar) return baseNameAvatar;
    if (displayName) return generateAvatarUrl(displayName);
    return null;
  }, [profileAvatarUrl, showBaseNameAvatar, baseNameAvatar, displayName]);

  const sizeClass = sizeClasses[size];
  const iconSizeClass = iconSizeClasses[size];

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-r from-stakeados-primary to-stakeados-primary-light flex items-center justify-center overflow-hidden ${className}`}
    >
      {isLoading ? (
        <div
          className={`${sizeClass} bg-stakeados-gray-600 rounded-full animate-pulse`}
        />
      ) : avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName || 'User avatar'}
          className="w-full h-full object-cover"
          onError={e => {
            // Fallback to generated avatar if image fails to load
            const target = e.target as HTMLImageElement;
            if (displayName && target.src !== generateAvatarUrl(displayName)) {
              target.src = generateAvatarUrl(displayName);
            }
          }}
        />
      ) : (
        <User className={`${iconSizeClass} text-stakeados-dark`} />
      )}
    </div>
  );
}

export { UserAvatar };
export default UserAvatar;

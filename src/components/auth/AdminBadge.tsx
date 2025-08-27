'use client';

import React from 'react';
import { AdminBadgeProps } from '@/types/roles';

export default function AdminBadge({
  variant = 'development',
  className = '',
}: AdminBadgeProps) {
  const badges = {
    development: {
      text: 'Admin Only - In Development',
      color: 'bg-orange-500',
      borderColor: 'border-orange-400',
    },
    testing: {
      text: 'Admin Only - Testing',
      color: 'bg-blue-500',
      borderColor: 'border-blue-400',
    },
    beta: {
      text: 'Admin Only - Beta',
      color: 'bg-purple-500',
      borderColor: 'border-purple-400',
    },
  };

  const badge = badges[variant];

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${badge.color} ${badge.borderColor} border text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm ${className}`}
    >
      {badge.text}
    </div>
  );
}

'use client';

import React from 'react';

export interface GamingBackgroundProps {
  children: React.ReactNode;
  variant?: 'matrix' | 'cyber' | 'neon' | 'particles';
}

export default function GamingBackground({
  children,
  variant = 'matrix',
}: GamingBackgroundProps) {
  const renderBackground = () => {
    switch (variant) {
      case 'matrix':
        return (
          <div className="fixed inset-0 opacity-30">
            <div className="absolute top-20 left-20 w-96 h-96 bg-green-500 rounded-full filter blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-20 right-20 w-96 h-96 bg-green-400 rounded-full filter blur-3xl animate-pulse"
              style={{ animationDelay: '1s' }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-600 rounded-full filter blur-3xl animate-pulse"
              style={{ animationDelay: '2s' }}
            ></div>
          </div>
        );
      case 'cyber':
        return (
          <div className="fixed inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-80 h-80 bg-blue-500 rounded-full filter blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500 rounded-full filter blur-3xl animate-pulse"
              style={{ animationDelay: '1.5s' }}
            ></div>
            <div
              className="absolute top-1/3 right-1/3 w-60 h-60 bg-cyan-500 rounded-full filter blur-3xl animate-pulse"
              style={{ animationDelay: '3s' }}
            ></div>
          </div>
        );
      case 'neon':
        return (
          <div className="fixed inset-0 opacity-25">
            <div className="absolute top-16 left-16 w-72 h-72 bg-pink-500 rounded-full filter blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-16 right-16 w-72 h-72 bg-yellow-500 rounded-full filter blur-3xl animate-pulse"
              style={{ animationDelay: '2s' }}
            ></div>
            <div
              className="absolute top-1/2 left-1/4 w-56 h-56 bg-orange-500 rounded-full filter blur-3xl animate-pulse"
              style={{ animationDelay: '4s' }}
            ></div>
          </div>
        );
      case 'particles':
        return (
          <div className="fixed inset-0 opacity-15">
            <div className="absolute top-24 left-24 w-64 h-64 bg-indigo-500 rounded-full filter blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-24 right-24 w-64 h-64 bg-teal-500 rounded-full filter blur-3xl animate-pulse"
              style={{ animationDelay: '2.5s' }}
            ></div>
            <div
              className="absolute top-1/3 left-1/2 w-48 h-48 bg-emerald-500 rounded-full filter blur-3xl animate-pulse"
              style={{ animationDelay: '5s' }}
            ></div>
            <div
              className="absolute bottom-1/3 left-1/3 w-40 h-40 bg-violet-500 rounded-full filter blur-3xl animate-pulse"
              style={{ animationDelay: '3.5s' }}
            ></div>
          </div>
        );
      default:
        return (
          <div className="fixed inset-0 opacity-30">
            <div className="absolute top-20 left-20 w-96 h-96 bg-green-500 rounded-full filter blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-20 right-20 w-96 h-96 bg-green-400 rounded-full filter blur-3xl animate-pulse"
              style={{ animationDelay: '1s' }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-600 rounded-full filter blur-3xl animate-pulse"
              style={{ animationDelay: '2s' }}
            ></div>
          </div>
        );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Elegant background with floating orbs */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        {renderBackground()}

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-400/5"></div>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}

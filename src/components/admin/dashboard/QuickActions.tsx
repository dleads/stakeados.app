'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import type { QuickAction } from '@/types/adminDashboard';

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const badge = (p: QuickAction['priority']) =>
    p === 'high'
      ? 'bg-red-500 text-white'
      : p === 'medium'
        ? 'bg-yellow-500 text-black'
        : 'bg-gray-600 text-white';

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">Acciones rápidas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map(a => {
          const Icon = (Icons as any)[a.icon] ?? Icons.Cog;
          return (
            <a
              key={a.id}
              href={a.actionUrl ?? '#'}
              className="text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
                {a.count !== undefined && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${badge(a.priority)}`}
                  >
                    {a.count}
                  </span>
                )}
              </div>
              <h4 className="text-white font-medium mb-1">{a.title}</h4>
              <p className="text-gray-400 text-sm">{a.description}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

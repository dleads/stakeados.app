'use client';

import React from 'react';

export function AnalyticsWidget({
  title,
  series,
}: {
  title: string;
  series: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...series.map(s => s.value));
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <div className="space-y-2">
        {series.map(s => (
          <div key={s.label}>
            <div className="flex justify-between text-sm text-gray-400">
              <span>{s.label}</span>
              <span>{s.value}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded">
              <div
                className="h-2 bg-emerald-500 rounded"
                style={{ width: `${(s.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { AnalyticsWidget } from './AnalyticsWidget';

export function ContentPerformance({
  stats,
}: {
  stats: { label: string; value: number }[];
}) {
  return <AnalyticsWidget title="Rendimiento de contenido" series={stats} />;
}

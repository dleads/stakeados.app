'use client';

import React from 'react';
import { AnalyticsChart } from './AnalyticsChart';

interface TrendDataPoint {
  date: string;
  articles?: {
    created: number;
    published: number;
    views: number;
    likes: number;
  };
  news?: { created: number; processed: number; trending: number };
  engagement?: { totalViews: number; totalLikes: number; totalShares: number };
}

interface TrendAnalysisChartProps {
  data: TrendDataPoint[];
  isLoading: boolean;
  className?: string;
}

export function TrendAnalysisChart({
  data,
  isLoading,
  className,
}: TrendAnalysisChartProps) {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className={`h-64 flex items-center justify-center ${className}`}>
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No trend data available
          </p>
        )}
      </div>
    );
  }

  // Transform data for single series chart (using total views as the main metric)
  const chartData = data.map(item => ({
    name: new Date(item.date).toLocaleDateString(),
    value: item.engagement?.totalViews || 0,
  }));

  return (
    <div className={className}>
      <AnalyticsChart type="line" data={chartData} isLoading={false} />
    </div>
  );
}

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface AnalyticsChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: ChartData[];
  isLoading?: boolean;
  height?: number;
  options?: any;
}

export function AnalyticsChart({
  type,
  data,
  isLoading = false,
  height = 300,
  options: _options = {},
}: AnalyticsChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500 dark:text-gray-400"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  // Color palette for charts
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F97316', // orange-500
    '#EC4899', // pink-500
    '#6B7280', // gray-500
  ];

  // Render appropriate chart type
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ fill: colors[0] }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={type === 'doughnut' ? 60 : 0}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return <div style={{ height }}>{renderChart()}</div>;
}

// Specialized chart components for specific use cases

interface TimeSeriesChartProps {
  data: Array<{
    date: string;
    articles?: {
      created: number;
      published: number;
      views: number;
      likes: number;
    };
    news?: { created: number; processed: number; trending: number };
    engagement?: {
      totalViews: number;
      totalLikes: number;
      totalShares: number;
    };
  }>;
  isLoading?: boolean;
  height?: number;
}

export function TimeSeriesChart({
  data,
  isLoading = false,
  height = 400,
}: TimeSeriesChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500 dark:text-gray-400"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    articlesCreated: item.articles?.created || 0,
    articlesPublished: item.articles?.published || 0,
    newsCreated: item.news?.created || 0,
    newsProcessed: item.news?.processed || 0,
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="articlesCreated"
            stroke="#3B82F6"
            strokeWidth={2}
            name="Articles Created"
          />
          <Line
            type="monotone"
            dataKey="articlesPublished"
            stroke="#10B981"
            strokeWidth={2}
            name="Articles Published"
          />
          <Line
            type="monotone"
            dataKey="newsCreated"
            stroke="#F59E0B"
            strokeWidth={2}
            name="News Created"
          />
          <Line
            type="monotone"
            dataKey="newsProcessed"
            stroke="#EF4444"
            strokeWidth={2}
            name="News Processed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { usePerformanceMonitoring } from '@/lib/performance/monitoring';
import { performanceMonitor } from '@/lib/performance/monitoring';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
}

export default function PerformanceMonitor({
  className = '',
  showDetails = false,
}: PerformanceMonitorProps) {
  const { getMemoryUsage } = usePerformanceMonitoring();
  const [memoryUsage, setMemoryUsage] = useState(getMemoryUsage());
  const [resourceAnalysis, setResourceAnalysis] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryUsage(getMemoryUsage());

      if (showDetails) {
        setResourceAnalysis(performanceMonitor.analyzeResourceTiming());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [getMemoryUsage, showDetails]);

  const getMetricValue = (name: string) => {
    return performanceMonitor.getAverageMetric(name);
  };

  const getMetricStatus = (name: string, value: number) => {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-stakeados-primary';
      case 'needs-improvement':
        return 'text-stakeados-yellow';
      case 'poor':
        return 'text-stakeados-red';
      default:
        return 'text-stakeados-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4" />;
      case 'needs-improvement':
        return <AlertTriangle className="w-4 h-4" />;
      case 'poor':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const coreWebVitals = [
    { name: 'LCP', label: 'Largest Contentful Paint', unit: 'ms' },
    { name: 'FID', label: 'First Input Delay', unit: 'ms' },
    { name: 'CLS', label: 'Cumulative Layout Shift', unit: 'score' },
    { name: 'TTFB', label: 'Time to First Byte', unit: 'ms' },
  ];

  if (process.env.NODE_ENV !== 'development' && !showDetails) {
    return null; // Only show in development or when explicitly requested
  }

  return (
    <div className={`card-gaming ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-6 h-6 text-stakeados-primary" />
        <h3 className="text-lg font-bold text-neon">Performance Monitor</h3>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {coreWebVitals.map(vital => {
          const value = getMetricValue(vital.name);
          const status = getMetricStatus(vital.name, value);
          const statusColor = getStatusColor(status);

          return (
            <div
              key={vital.name}
              className="p-3 bg-stakeados-gray-800 rounded-gaming"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-stakeados-gray-400">
                  {vital.name}
                </span>
                <div className={statusColor}>{getStatusIcon(status)}</div>
              </div>
              <div className={`text-lg font-bold ${statusColor}`}>
                {value > 0
                  ? vital.unit === 'score'
                    ? value.toFixed(3)
                    : Math.round(value)
                  : '-'}
              </div>
              <div className="text-xs text-stakeados-gray-400">
                {vital.unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Memory Usage */}
      {memoryUsage && (
        <div className="mb-6">
          <h4 className="font-semibold text-stakeados-primary mb-3">
            Memory Usage
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-sm text-stakeados-gray-300">Used Heap</div>
              <div className="text-lg font-bold text-white">
                {(memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
            <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-sm text-stakeados-gray-300">Total Heap</div>
              <div className="text-lg font-bold text-white">
                {(memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
            <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-sm text-stakeados-gray-300">Usage</div>
              <div
                className={`text-lg font-bold ${
                  memoryUsage.usagePercentage > 80
                    ? 'text-stakeados-red'
                    : memoryUsage.usagePercentage > 60
                      ? 'text-stakeados-yellow'
                      : 'text-stakeados-primary'
                }`}
              >
                {memoryUsage.usagePercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Analysis */}
      {showDetails && resourceAnalysis && (
        <div className="mb-6">
          <h4 className="font-semibold text-stakeados-primary mb-3">
            Resource Analysis
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-sm text-stakeados-gray-300">
                Total Resources
              </div>
              <div className="text-lg font-bold text-white">
                {resourceAnalysis.totalResources}
              </div>
            </div>
            <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-sm text-stakeados-gray-300">Total Size</div>
              <div className="text-lg font-bold text-white">
                {(resourceAnalysis.totalSize / 1024).toFixed(1)} KB
              </div>
            </div>
            <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-sm text-stakeados-gray-300">Load Time</div>
              <div className="text-lg font-bold text-white">
                {resourceAnalysis.totalDuration.toFixed(0)} ms
              </div>
            </div>
            <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-sm text-stakeados-gray-300">
                Slow Resources
              </div>
              <div
                className={`text-lg font-bold ${
                  resourceAnalysis.slowResources.length > 0
                    ? 'text-stakeados-red'
                    : 'text-stakeados-primary'
                }`}
              >
                {resourceAnalysis.slowResources.length}
              </div>
            </div>
          </div>

          {/* Resource breakdown by type */}
          <div className="space-y-2">
            {Object.entries(resourceAnalysis.byType).map(
              ([type, data]: [string, any]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-2 bg-stakeados-gray-800 rounded"
                >
                  <span className="text-stakeados-gray-300 capitalize">
                    {type}
                  </span>
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      {data.count} files
                    </div>
                    <div className="text-xs text-stakeados-gray-400">
                      {(data.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="p-4 bg-stakeados-blue/10 border border-stakeados-blue/30 rounded-gaming">
        <h4 className="font-semibold text-stakeados-blue mb-2">
          ⚡ Performance Tips
        </h4>
        <ul className="text-sm text-stakeados-gray-300 space-y-1">
          <li>• Images are optimized with WebP format</li>
          <li>• Components are lazy loaded for better performance</li>
          <li>• API responses are cached for faster loading</li>
          <li>• Bundle is split for optimal loading</li>
        </ul>
      </div>
    </div>
  );
}

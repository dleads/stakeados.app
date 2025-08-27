'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { performanceMonitor } from '@/lib/monitoring/PerformanceMonitor';
import { errorHandler } from '@/lib/errors/ErrorHandler';

interface PerformanceData {
  metrics: Record<
    string,
    {
      timestamp: string;
      averageDuration: number;
      operationCount: number;
      successRate: number;
      operations: Record<string, number>;
    }
  >;
  operationStats: Record<
    string,
    {
      count: number;
      averageDuration: number;
      successRate: number;
      p95Duration: number;
      p99Duration: number;
    }
  >;
  summary: {
    totalOperations: number;
    averageDuration: number;
    successRate: number;
    slowestOperations: Array<{
      operation: string;
      duration: number;
      timestamp: string;
      success: boolean;
    }>;
  };
}

export default function PerformanceMonitoringDashboard() {
  const [performanceData, setPerformanceData] =
    useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [aggregation, setAggregation] = useState<string>('hour');

  useEffect(() => {
    fetchPerformanceData();

    // Set up real-time updates
    const interval = setInterval(fetchPerformanceData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedOperation, timeRange, aggregation]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (selectedOperation !== 'all')
        params.append('operation', selectedOperation);
      params.append('aggregation', aggregation);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '1h':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/admin/monitoring/metrics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch performance data');

      const data = await response.json();
      setPerformanceData(data);
    } catch (error) {
      errorHandler.handleError(error as Error, {
        operation: 'fetch_performance_data',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceStatus = (
    successRate: number,
    avgDuration: number
  ): {
    status: string;
    color: string;
  } => {
    if (successRate < 0.9 || avgDuration > 5000) {
      return { status: 'Critical', color: 'destructive' };
    }
    if (successRate < 0.95 || avgDuration > 2000) {
      return { status: 'Warning', color: 'secondary' };
    }
    return { status: 'Good', color: 'default' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">
            Monitor system performance and operation metrics
          </p>
        </div>
        <Button onClick={fetchPerformanceData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Time Range:</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Operation:</label>
              <Select
                value={selectedOperation}
                onValueChange={setSelectedOperation}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operations</SelectItem>
                  {performanceData &&
                    Object.keys(performanceData.operationStats).map(op => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Aggregation:</label>
              <Select value={aggregation} onValueChange={setAggregation}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Hourly</SelectItem>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Operations
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceData.summary.totalOperations.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(performanceData.summary.averageDuration)}
              </div>
              <Badge
                variant={
                  getPerformanceStatus(
                    performanceData.summary.successRate,
                    performanceData.summary.averageDuration
                  ).color as any
                }
                className="mt-1"
              >
                {
                  getPerformanceStatus(
                    performanceData.summary.successRate,
                    performanceData.summary.averageDuration
                  ).status
                }
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(performanceData.summary.successRate * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operations</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(performanceData.operationStats).length}
              </div>
              <div className="text-xs text-muted-foreground">
                Unique operations
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analysis */}
      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="slowest">Slowest Operations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operation Performance</CardTitle>
              <CardDescription>
                Performance statistics for each operation type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData &&
                  Object.entries(performanceData.operationStats)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .map(([operation, stats]) => {
                      const status = getPerformanceStatus(
                        stats.successRate,
                        stats.averageDuration
                      );
                      return (
                        <div
                          key={operation}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{operation}</span>
                              <Badge variant={status.color as any}>
                                {status.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {stats.count} operations
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">
                                Avg Duration
                              </div>
                              <div className="font-medium">
                                {formatDuration(stats.averageDuration)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">
                                Success Rate
                              </div>
                              <div className="font-medium">
                                {(stats.successRate * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">P95</div>
                              <div className="font-medium">
                                {formatDuration(stats.p95Duration)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">P99</div>
                              <div className="font-medium">
                                {formatDuration(stats.p99Duration)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Count</div>
                              <div className="font-medium">{stats.count}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slowest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slowest Operations</CardTitle>
              <CardDescription>
                Individual operations with the highest response times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {performanceData?.summary.slowestOperations.map((op, index) => (
                  <div
                    key={`${op.operation}-${op.timestamp}`}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono w-6">
                        {index + 1}.
                      </span>
                      <div>
                        <div className="font-medium">{op.operation}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(op.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={op.success ? 'default' : 'destructive'}>
                        {op.success ? 'Success' : 'Failed'}
                      </Badge>
                      <span className="font-mono text-sm">
                        {formatDuration(op.duration)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData &&
                  Object.entries(performanceData.metrics)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(-24) // Show last 24 data points
                    .map(([timestamp, metrics]) => (
                      <div
                        key={timestamp}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-mono">{timestamp}</span>
                          <Badge variant="outline">
                            {metrics.operationCount} ops
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Avg: </span>
                            <span className="font-medium">
                              {formatDuration(metrics.averageDuration)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Success:{' '}
                            </span>
                            <span className="font-medium">
                              {(metrics.successRate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

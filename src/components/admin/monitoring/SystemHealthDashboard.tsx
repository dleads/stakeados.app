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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  HardDrive,
  Globe,
  Activity,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { performanceMonitor } from '@/lib/monitoring/PerformanceMonitor';
import { errorHandler } from '@/lib/errors/ErrorHandler';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'warning';
  responseTime: number;
  details?: Record<string, any>;
  error?: string;
}

interface SystemHealthData {
  database: HealthCheckResult;
  storage: HealthCheckResult;
  externalServices: HealthCheckResult;
  systemResources: HealthCheckResult;
  performance: {
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      averageResponseTime: number;
      errorRate: number;
      memoryUsage: number;
      activeAlerts: number;
    };
    recommendations: string[];
  };
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
}

export default function SystemHealthDashboard() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchHealthData();

    // Set up automatic health checks every 2 minutes
    const interval = setInterval(fetchHealthData, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/monitoring/health');
      if (!response.ok) throw new Error('Failed to fetch health data');

      const data = await response.json();
      setHealthData(data);
      setLastUpdate(new Date());
    } catch (error) {
      errorHandler.handleError(error as Error, {
        operation: 'fetch_health_data',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading && !healthData) {
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
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-muted-foreground">
            Monitor overall system health and component status
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={fetchHealthData} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(healthData.overallStatus)}
              System Status:{' '}
              {healthData.overallStatus.charAt(0).toUpperCase() +
                healthData.overallStatus.slice(1)}
            </CardTitle>
            <CardDescription>
              Overall system health based on all components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge
              variant={getStatusColor(healthData.overallStatus) as any}
              className="text-sm"
            >
              {healthData.overallStatus.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Component Health Checks */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Database Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database
              </CardTitle>
              {getStatusIcon(healthData.database.status)}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge
                  variant={getStatusColor(healthData.database.status) as any}
                >
                  {healthData.database.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Response time:{' '}
                  {formatResponseTime(healthData.database.responseTime)}
                </div>
                {healthData.database.details && (
                  <div className="text-xs space-y-1">
                    <div>
                      Connectivity: {healthData.database.details.connectivity}
                    </div>
                    <div>
                      Write capability:{' '}
                      {healthData.database.details.writeCapability}
                    </div>
                  </div>
                )}
                {healthData.database.error && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {healthData.database.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Storage Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Storage
              </CardTitle>
              {getStatusIcon(healthData.storage.status)}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge
                  variant={getStatusColor(healthData.storage.status) as any}
                >
                  {healthData.storage.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Response time:{' '}
                  {formatResponseTime(healthData.storage.responseTime)}
                </div>
                {healthData.storage.details && (
                  <div className="text-xs space-y-1">
                    <div>
                      Buckets accessible:{' '}
                      {healthData.storage.details.bucketsAccessible}
                    </div>
                    {healthData.storage.details.buckets && (
                      <div>
                        Buckets: {healthData.storage.details.buckets.join(', ')}
                      </div>
                    )}
                  </div>
                )}
                {healthData.storage.error && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {healthData.storage.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* External Services Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                External Services
              </CardTitle>
              {getStatusIcon(healthData.externalServices.status)}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge
                  variant={
                    getStatusColor(healthData.externalServices.status) as any
                  }
                >
                  {healthData.externalServices.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Response time:{' '}
                  {formatResponseTime(healthData.externalServices.responseTime)}
                </div>
                {healthData.externalServices.details?.services && (
                  <div className="space-y-1">
                    {healthData.externalServices.details.services.map(
                      (service: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-xs"
                        >
                          <span>{service.name}</span>
                          <Badge
                            variant={getStatusColor(service.status) as any}
                            className="text-xs"
                          >
                            {service.status}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                )}
                {healthData.externalServices.error && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {healthData.externalServices.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Resources */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Resources
              </CardTitle>
              {getStatusIcon(healthData.systemResources.status)}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge
                  variant={
                    getStatusColor(healthData.systemResources.status) as any
                  }
                >
                  {healthData.systemResources.status}
                </Badge>
                {healthData.systemResources.details && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Memory Usage</div>
                      <div className="font-medium">
                        {healthData.systemResources.details.memoryUsage}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Response</div>
                      <div className="font-medium">
                        {formatResponseTime(
                          healthData.systemResources.details.averageResponseTime
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Error Rate</div>
                      <div className="font-medium">
                        {healthData.systemResources.details.errorRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Operations</div>
                      <div className="font-medium">
                        {healthData.systemResources.details.totalOperations}
                      </div>
                    </div>
                  </div>
                )}
                {healthData.systemResources.error && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {healthData.systemResources.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Summary */}
      {healthData?.performance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Performance Summary
            </CardTitle>
            <CardDescription>
              Current performance metrics and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant={getStatusColor(healthData.performance.status) as any}
                >
                  {healthData.performance.status}
                </Badge>
                {getStatusIcon(healthData.performance.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Avg Response Time
                  </div>
                  <div className="text-lg font-semibold">
                    {formatResponseTime(
                      healthData.performance.metrics.averageResponseTime
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Error Rate
                  </div>
                  <div className="text-lg font-semibold">
                    {(healthData.performance.metrics.errorRate * 100).toFixed(
                      1
                    )}
                    %
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Memory Usage
                  </div>
                  <div className="text-lg font-semibold">
                    {healthData.performance.metrics.memoryUsage}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Active Alerts
                  </div>
                  <div className="text-lg font-semibold">
                    {healthData.performance.metrics.activeAlerts}
                  </div>
                </div>
              </div>

              {healthData.performance.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <div className="space-y-1">
                    {healthData.performance.recommendations.map(
                      (recommendation, index) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {recommendation}
                          </AlertDescription>
                        </Alert>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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
import { AlertTriangle, RefreshCw, Download, Filter } from 'lucide-react';
import { errorHandler } from '@/lib/errors/ErrorHandler';
import { AdminErrorCodes } from '@/lib/errors/AdminErrorCodes';

interface ErrorLog {
  id: string;
  error_code: string;
  message: string;
  details: Record<string, any>;
  user_id?: string;
  operation?: string;
  context: Record<string, any>;
  timestamp: string;
  created_at: string;
}

interface ErrorStats {
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsByHour: Record<string, number>;
  topErrors: Array<{ code: string; count: number }>;
}

export default function ErrorMonitoringDashboard() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');

  useEffect(() => {
    fetchErrorLogs();
  }, [selectedSeverity, selectedOperation, timeRange]);

  const fetchErrorLogs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (selectedSeverity !== 'all')
        params.append('severity', selectedSeverity);
      if (selectedOperation !== 'all')
        params.append('operation', selectedOperation);

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

      const response = await fetch(`/api/admin/monitoring/errors?${params}`);
      if (!response.ok) throw new Error('Failed to fetch error logs');

      const data = await response.json();
      setErrors(data.errors);
      setStats(data.stats);
    } catch (error) {
      errorHandler.handleError(error as Error, {
        operation: 'fetch_error_logs',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (code: string): "default" | "outline" | "secondary" | "destructive" => {
    const criticalErrors = [
      AdminErrorCodes.DATABASE_CONNECTION_ERROR,
      AdminErrorCodes.AUTHENTICATION_FAILED,
      AdminErrorCodes.BACKUP_FAILED,
    ];

    const highErrors = [
      AdminErrorCodes.INSUFFICIENT_PERMISSIONS,
      AdminErrorCodes.AI_PROCESSING_FAILED,
      AdminErrorCodes.BULK_OPERATION_FAILED,
    ];

    if (criticalErrors.includes(code as AdminErrorCodes)) return 'destructive';
    if (highErrors.includes(code as AdminErrorCodes)) return 'secondary';
    return 'outline';
  };

  const exportErrorLogs = async () => {
    try {
      const params = new URLSearchParams();
      params.append('format', 'csv');
      if (selectedSeverity !== 'all')
        params.append('severity', selectedSeverity);
      if (selectedOperation !== 'all')
        params.append('operation', selectedOperation);

      const response = await fetch(
        `/api/admin/monitoring/errors/export?${params}`
      );
      if (!response.ok) throw new Error('Failed to export error logs');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      errorHandler.handleError(error as Error, {
        operation: 'export_error_logs',
      });
    }
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
          <h2 className="text-2xl font-bold">Error Monitoring</h2>
          <p className="text-muted-foreground">
            Monitor and analyze system errors and issues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportErrorLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchErrorLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              <label className="text-sm font-medium">Severity:</label>
              <Select
                value={selectedSeverity}
                onValueChange={setSelectedSeverity}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
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
                  <SelectItem value="article_management">
                    Article Management
                  </SelectItem>
                  <SelectItem value="news_processing">
                    News Processing
                  </SelectItem>
                  <SelectItem value="user_management">
                    User Management
                  </SelectItem>
                  <SelectItem value="file_upload">File Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Errors
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalErrors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Error</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.topErrors[0]?.code || 'None'}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.topErrors[0]?.count || 0} occurrences
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Types</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.errorsByCode).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Errors
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  errors.filter(
                    e =>
                      new Date(e.created_at) >
                      new Date(Date.now() - 60 * 60 * 1000)
                  ).length
                }
              </div>
              <div className="text-xs text-muted-foreground">Last hour</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Logs */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Error Logs</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                Latest error logs from the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No errors found for the selected criteria
                  </div>
                ) : (
                  errors.map(error => (
                    <div
                      key={error.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(error.error_code)}>
                            {error.error_code}
                          </Badge>
                          {error.operation && (
                            <Badge variant="outline">{error.operation}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(error.created_at).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-sm font-medium">{error.message}</div>

                      {Object.keys(error.details).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">
                            Show Details
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(error.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Error Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.topErrors.slice(0, 10).map((error, index) => (
                    <div
                      key={error.code}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">{index + 1}.</span>
                        <Badge variant={getSeverityColor(error.code)}>
                          {error.code}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">{error.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Distribution by Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats &&
                    Object.entries(stats.errorsByHour)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .slice(-12)
                      .map(([hour, count]) => (
                        <div
                          key={hour}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">{hour}</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="bg-red-200 h-2 rounded"
                              style={{
                                width: `${Math.max(10, (count / Math.max(...Object.values(stats.errorsByHour))) * 100)}px`,
                              }}
                            />
                            <span className="text-sm font-medium w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

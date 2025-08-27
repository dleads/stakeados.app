// @ts-nocheck
'use client';

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Play,
  RotateCcw,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/Progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBackgroundProcessMonitor } from '@/hooks/useBackgroundProcessMonitor';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface BackgroundProcessMonitorProps {
  className?: string;
  compact?: boolean;
}

export function BackgroundProcessMonitor({
  className,
  compact = false,
}: BackgroundProcessMonitorProps) {
  const {
    processes,
    stats,
    isConnected,
    getActiveProcesses,
    getProcessesByType,
    cancelProcess,
    retryProcess,
  } = useBackgroundProcessMonitor();

  const [selectedTab, setSelectedTab] = useState('active');
  const activeProcesses = getActiveProcesses();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'started':
      case 'progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Pause className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started':
      case 'progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProcessTypeLabel = (type: string) => {
    switch (type) {
      case 'ai_processing':
        return 'Procesamiento IA';
      case 'rss_fetch':
        return 'Agregación RSS';
      case 'bulk_operation':
        return 'Operación masiva';
      case 'backup':
        return 'Respaldo';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return type;
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="font-medium">Procesos</span>
            </div>
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Activos</p>
              <p className="font-semibold text-blue-500">{stats.running}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Completados</p>
              <p className="font-semibold text-green-500">{stats.completed}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fallidos</p>
              <p className="font-semibold text-red-500">{stats.failed}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold">{stats.total}</p>
            </div>
          </div>

          {activeProcesses.length > 0 && (
            <div className="mt-3 space-y-2">
              {activeProcesses.slice(0, 2).map(process => (
                <div key={process.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">
                      {getProcessTypeLabel(process.type)}
                    </span>
                    <span>{process.progress}%</span>
                  </div>
                  <Progress value={process.progress} className="h-1" />
                </div>
              ))}
              {activeProcesses.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{activeProcesses.length - 2} más...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitor de procesos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={isConnected ? 'default' : 'destructive'}
              className="text-xs"
            >
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.running}</p>
            <p className="text-xs text-muted-foreground">Activos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">
              {stats.completed}
            </p>
            <p className="text-xs text-muted-foreground">Completados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Fallidos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">Activos ({stats.running})</TabsTrigger>
            <TabsTrigger value="completed">Completados</TabsTrigger>
            <TabsTrigger value="failed">Fallidos</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <ScrollArea className="h-96">
              {activeProcesses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay procesos activos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeProcesses.map(process => (
                    <ProcessCard
                      key={process.id}
                      process={process}
                      onCancel={cancelProcess}
                      onRetry={retryProcess}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {processes
                  .filter(p => p.status === 'completed')
                  .map(process => (
                    <ProcessCard
                      key={process.id}
                      process={process}
                      onCancel={cancelProcess}
                      onRetry={retryProcess}
                    />
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="failed" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {processes
                  .filter(p => p.status === 'failed')
                  .map(process => (
                    <ProcessCard
                      key={process.id}
                      process={process}
                      onCancel={cancelProcess}
                      onRetry={retryProcess}
                    />
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {processes.map(process => (
                  <ProcessCard
                    key={process.id}
                    process={process}
                    onCancel={cancelProcess}
                    onRetry={retryProcess}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ProcessCard({
  process,
  onCancel,
  onRetry,
}: {
  process: any;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'started':
      case 'progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Pause className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getProcessTypeLabel = (type: string) => {
    switch (type) {
      case 'ai_processing':
        return 'Procesamiento IA';
      case 'rss_fetch':
        return 'Agregación RSS';
      case 'bulk_operation':
        return 'Operación masiva';
      case 'backup':
        return 'Respaldo';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return type;
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(process.status)}
            <div>
              <h4 className="font-medium">
                {getProcessTypeLabel(process.type)}
              </h4>
              <p className="text-sm text-muted-foreground">
                ID: {process.id.slice(0, 8)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {process.status === 'failed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRetry(process.id)}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reintentar
              </Button>
            )}

            {['started', 'progress'].includes(process.status) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(process.id)}
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {process.message && (
          <p className="text-sm text-muted-foreground mb-3">
            {process.message}
          </p>
        )}

        {['started', 'progress'].includes(process.status) && (
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso</span>
              <span>{process.progress}%</span>
            </div>
            <Progress value={process.progress} />

            {process.estimatedCompletion && (
              <p className="text-xs text-muted-foreground">
                Estimado:{' '}
                {formatDistanceToNow(process.estimatedCompletion, {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Iniciado{' '}
            {formatDistanceToNow(process.startedAt, {
              addSuffix: true,
              locale: es,
            })}
          </span>

          <span>
            Duración: {formatDuration(process.startedAt, process.completedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, X, RefreshCw } from 'lucide-react';
import {
  useBulkOperations,
  BulkOperationProgress,
} from '@/hooks/useBulkOperations';

interface BulkOperationProgressProps {
  jobId: string;
  onComplete?: (progress: BulkOperationProgress) => void;
  onCancel?: () => void;
}

export function BulkOperationProgressTracker({
  jobId,
  onComplete,
  onCancel,
}: BulkOperationProgressProps) {
  const [progress, setProgress] = useState<BulkOperationProgress | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const { getOperationProgress, pollProgress } = useBulkOperations();

  useEffect(() => {
    if (!jobId || !isPolling) return;

    const stopPolling = pollProgress(jobId, newProgress => {
      setProgress(newProgress);

      if (
        newProgress.status === 'completed' ||
        newProgress.status === 'failed'
      ) {
        setIsPolling(false);
        onComplete?.(newProgress);
      }
    });

    return stopPolling;
  }, [jobId, isPolling, pollProgress, onComplete]);

  const handleRefresh = async () => {
    if (jobId) {
      const newProgress = await getOperationProgress(jobId);
      if (newProgress) {
        setProgress(newProgress);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (!progress) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Cargando progreso...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Operación masiva - {progress.operation_type}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(progress.status)}>
              {getStatusIcon(progress.status)}
              <span className="ml-1 capitalize">{progress.status}</span>
            </Badge>
            {onCancel && progress.status === 'running' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso</span>
            <span>{Math.round(progress.progress)}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {progress.processed_items} / {progress.total_items} elementos
            </span>
            {progress.estimated_completion && (
              <span>
                Estimado:{' '}
                {new Date(progress.estimated_completion).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {progress.success_count}
            </div>
            <div className="text-xs text-green-600">Exitosos</div>
          </div>

          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {progress.error_count}
            </div>
            <div className="text-xs text-red-600">Errores</div>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {progress.total_items - progress.processed_items}
            </div>
            <div className="text-xs text-blue-600">Pendientes</div>
          </div>
        </div>

        {/* Timing Information */}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Iniciado: {new Date(progress.started_at).toLocaleString()}
          </span>
          {progress.completed_at && (
            <span>
              Completado: {new Date(progress.completed_at).toLocaleString()}
            </span>
          )}
        </div>

        {/* Errors */}
        {progress.errors && progress.errors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-600">
                Errores ({progress.errors.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Actualizar
              </Button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {progress.errors.slice(0, 5).map((error, index) => (
                <div
                  key={index}
                  className="text-xs p-2 bg-red-50 border border-red-200 rounded text-red-700"
                >
                  {error}
                </div>
              ))}
              {progress.errors.length > 5 && (
                <div className="text-xs text-muted-foreground text-center">
                  ... y {progress.errors.length - 5} errores más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {progress.status === 'completed' && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar página
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

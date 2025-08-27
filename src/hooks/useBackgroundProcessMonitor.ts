'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  realTimeService,
  BackgroundProcessUpdate,
} from '@/lib/services/realTimeService';

export interface BackgroundProcess {
  id: string;
  type:
    | 'ai_processing'
    | 'rss_fetch'
    | 'bulk_operation'
    | 'backup'
    | 'maintenance';
  status: 'started' | 'progress' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message?: string;
  data?: any;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
}

export interface ProcessStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export function useBackgroundProcessMonitor() {
  const [processes, setProcesses] = useState<Map<string, BackgroundProcess>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<ProcessStats>({
    total: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  });

  // Load active processes
  const loadActiveProcesses = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/background-processes');
      if (response.ok) {
        const data = await response.json();
        const processMap = new Map();

        data.processes?.forEach((process: any) => {
          processMap.set(process.id, {
            id: process.id,
            type: process.job_type,
            status: process.status,
            progress: process.progress || 0,
            message: process.message,
            data: process.data,
            startedAt: new Date(process.created_at),
            updatedAt: new Date(process.updated_at),
            completedAt: process.completed_at
              ? new Date(process.completed_at)
              : undefined,
            estimatedCompletion: calculateEstimatedCompletion(process),
          });
        });

        setProcesses(processMap);
        updateStats(processMap);
      }
    } catch (error) {
      console.error('Error loading background processes:', error);
    }
  }, []);

  // Calculate estimated completion time
  const calculateEstimatedCompletion = useCallback(
    (process: any): Date | undefined => {
      if (
        process.status !== 'progress' ||
        !process.progress ||
        process.progress === 0
      ) {
        return undefined;
      }

      const startTime = new Date(process.created_at).getTime();
      const currentTime = new Date().getTime();
      const elapsed = currentTime - startTime;
      const progressPercent = process.progress / 100;
      const estimatedTotal = elapsed / progressPercent;
      const remaining = estimatedTotal - elapsed;

      return new Date(currentTime + remaining);
    },
    []
  );

  // Update statistics
  const updateStats = useCallback(
    (processMap: Map<string, BackgroundProcess>) => {
      const processes = Array.from(processMap.values());

      setStats({
        total: processes.length,
        running: processes.filter(p =>
          ['started', 'progress'].includes(p.status)
        ).length,
        completed: processes.filter(p => p.status === 'completed').length,
        failed: processes.filter(p => p.status === 'failed').length,
        cancelled: processes.filter(p => p.status === 'cancelled').length,
      });
    },
    []
  );

  // Handle process updates
  const handleProcessUpdate = useCallback(
    (update: BackgroundProcessUpdate) => {
      setProcesses(prev => {
        const newProcesses = new Map(prev);

        const existingProcess = newProcesses.get(update.processId);
        const updatedProcess: BackgroundProcess = {
          id: update.processId,
          type: update.type,
          status: update.status,
          progress: update.progress || existingProcess?.progress || 0,
          message: update.message || existingProcess?.message,
          data: update.data || existingProcess?.data,
          startedAt: existingProcess?.startedAt || update.timestamp,
          updatedAt: update.timestamp,
          completedAt: ['completed', 'failed', 'cancelled'].includes(
            update.status
          )
            ? update.timestamp
            : existingProcess?.completedAt,
          estimatedCompletion:
            update.status === 'progress' && update.progress
              ? calculateEstimatedCompletion({
                  created_at: existingProcess?.startedAt || update.timestamp,
                  progress: update.progress,
                })
              : undefined,
        };

        newProcesses.set(update.processId, updatedProcess);

        // Remove completed processes after 5 minutes
        if (['completed', 'failed', 'cancelled'].includes(update.status)) {
          setTimeout(
            () => {
              setProcesses(current => {
                const updated = new Map(current);
                updated.delete(update.processId);
                updateStats(updated);
                return updated;
              });
            },
            5 * 60 * 1000
          );
        }

        updateStats(newProcesses);
        return newProcesses;
      });
    },
    [calculateEstimatedCompletion, updateStats]
  );

  // Get processes by type
  const getProcessesByType = useCallback(
    (type: BackgroundProcess['type']): BackgroundProcess[] => {
      return Array.from(processes.values()).filter(p => p.type === type);
    },
    [processes]
  );

  // Get active processes
  const getActiveProcesses = useCallback((): BackgroundProcess[] => {
    return Array.from(processes.values()).filter(p =>
      ['started', 'progress'].includes(p.status)
    );
  }, [processes]);

  // Get recent processes (last 24 hours)
  const getRecentProcesses = useCallback((): BackgroundProcess[] => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return Array.from(processes.values()).filter(p => p.startedAt > oneDayAgo);
  }, [processes]);

  // Cancel process
  const cancelProcess = useCallback(
    async (processId: string) => {
      try {
        const response = await fetch(
          `/api/admin/background-processes/${processId}/cancel`,
          {
            method: 'POST',
          }
        );

        if (response.ok) {
          setProcesses(prev => {
            const newProcesses = new Map(prev);
            const process = newProcesses.get(processId);
            if (process) {
              newProcesses.set(processId, {
                ...process,
                status: 'cancelled',
                updatedAt: new Date(),
                completedAt: new Date(),
              });
            }
            updateStats(newProcesses);
            return newProcesses;
          });
        }
      } catch (error) {
        console.error('Error cancelling process:', error);
      }
    },
    [updateStats]
  );

  // Retry failed process
  const retryProcess = useCallback(async (processId: string) => {
    try {
      const response = await fetch(
        `/api/admin/background-processes/${processId}/retry`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const data = await response.json();
        // The new process will be picked up by the real-time subscription
        return data.newProcessId;
      }
    } catch (error) {
      console.error('Error retrying process:', error);
    }
  }, []);

  // Get process details
  const getProcessDetails = useCallback(
    (processId: string): BackgroundProcess | undefined => {
      return processes.get(processId);
    },
    [processes]
  );

  // Get process history
  const getProcessHistory = useCallback(
    async (type?: BackgroundProcess['type'], limit = 50) => {
      try {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        params.append('limit', limit.toString());
        params.append('include_completed', 'true');

        const response = await fetch(
          `/api/admin/background-processes/history?${params}`
        );
        if (response.ok) {
          const data = await response.json();
          return data.processes || [];
        }
      } catch (error) {
        console.error('Error loading process history:', error);
      }
      return [];
    },
    []
  );

  // Setup real-time subscription
  useEffect(() => {
    loadActiveProcesses();

    const unsubscribe =
      realTimeService.subscribeToBackgroundProcesses(handleProcessUpdate);

    // Check connection status
    const checkConnection = () => {
      setIsConnected(realTimeService.getConnectionStatus());
    };

    checkConnection();
    const connectionInterval = setInterval(checkConnection, 10000);

    // Periodic refresh for fallback
    const refreshInterval = setInterval(() => {
      if (!realTimeService.getConnectionStatus()) {
        loadActiveProcesses();
      }
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(connectionInterval);
      clearInterval(refreshInterval);
    };
  }, [loadActiveProcesses, handleProcessUpdate]);

  return {
    processes: Array.from(processes.values()),
    stats,
    isConnected,
    getProcessesByType,
    getActiveProcesses,
    getRecentProcesses,
    getProcessDetails,
    getProcessHistory,
    cancelProcess,
    retryProcess,
    refresh: loadActiveProcesses,
  };
}

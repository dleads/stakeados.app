'use client';

import { useCallback, useEffect, useRef } from 'react';
import { performanceMonitor } from '@/lib/monitoring/PerformanceMonitor';
import { errorHandler } from '@/lib/errors/ErrorHandler';

interface UsePerformanceMonitoringOptions {
  operation: string;
  autoTrack?: boolean;
  metadata?: Record<string, any>;
}

export function usePerformanceMonitoring(
  options: UsePerformanceMonitoringOptions
) {
  const { operation, autoTrack = false, metadata } = options;
  const startTimeRef = useRef<number | null>(null);
  const operationIdRef = useRef<string | null>(null);

  // Start timing an operation
  const startTiming = useCallback(() => {
    startTimeRef.current = performance.now();
    operationIdRef.current = `${operation}_${Date.now()}_${Math.random()}`;
    return operationIdRef.current;
  }, [operation]);

  // End timing and record metric
  const endTiming = useCallback(
    (success: boolean = true, additionalMetadata?: Record<string, any>) => {
      if (startTimeRef.current && operationIdRef.current) {
        const duration = performance.now() - startTimeRef.current;

        performanceMonitor.recordMetric({
          id: operationIdRef.current,
          operation,
          duration,
          timestamp: new Date(),
          metadata: { ...metadata, ...additionalMetadata },
          success,
        });

        startTimeRef.current = null;
        operationIdRef.current = null;

        return duration;
      }
      return 0;
    },
    [operation, metadata]
  );

  // Time an async operation
  const timeOperation = useCallback(
    async <T>(
      fn: () => Promise<T>,
      operationName?: string,
      additionalMetadata?: Record<string, any>
    ): Promise<T> => {
      const opName = operationName || operation;

      try {
        return await performanceMonitor.timeOperation(opName, fn, {
          ...metadata,
          ...additionalMetadata,
        });
      } catch (error) {
        // Record failed operation
        performanceMonitor.recordMetric({
          id: `${opName}_${Date.now()}_${Math.random()}`,
          operation: opName,
          duration: 0,
          timestamp: new Date(),
          metadata: { ...metadata, ...additionalMetadata, error: true },
          success: false,
        });

        throw error;
      }
    },
    [operation, metadata]
  );

  // Time a synchronous operation
  const timeSyncOperation = useCallback(
    <T>(
      fn: () => T,
      operationName?: string,
      additionalMetadata?: Record<string, any>
    ): T => {
      const opName = operationName || operation;
      const startTime = performance.now();
      const id = `${opName}_${Date.now()}_${Math.random()}`;

      try {
        const result = fn();
        const duration = performance.now() - startTime;

        performanceMonitor.recordMetric({
          id,
          operation: opName,
          duration,
          timestamp: new Date(),
          metadata: { ...metadata, ...additionalMetadata },
          success: true,
        });

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        performanceMonitor.recordMetric({
          id,
          operation: opName,
          duration,
          timestamp: new Date(),
          metadata: { ...metadata, ...additionalMetadata, error: true },
          success: false,
        });

        throw error;
      }
    },
    [operation, metadata]
  );

  // Auto-track component mount/unmount if enabled
  useEffect(() => {
    if (autoTrack) {
      const mountTime = performance.now();
      const mountId = `${operation}_mount_${Date.now()}_${Math.random()}`;

      return () => {
        const unmountTime = performance.now();
        const duration = unmountTime - mountTime;

        performanceMonitor.recordMetric({
          id: mountId,
          operation: `${operation}_lifecycle`,
          duration,
          timestamp: new Date(),
          metadata: { ...metadata, lifecycle: 'mount_to_unmount' },
          success: true,
        });
      };
    }
  }, [operation, autoTrack, metadata]);

  return {
    startTiming,
    endTiming,
    timeOperation,
    timeSyncOperation,
    performanceMonitor,
  };
}

// Hook for API call performance monitoring
export function useApiPerformanceMonitoring() {
  const timeApiCall = useCallback(
    async <T>(
      apiCall: () => Promise<Response>,
      endpoint: string,
      method: string = 'GET',
      additionalMetadata?: Record<string, any>
    ): Promise<Response> => {
      const operation = `api_${method.toLowerCase()}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const startTime = performance.now();
      const id = `${operation}_${Date.now()}_${Math.random()}`;

      try {
        const response = await apiCall();
        const duration = performance.now() - startTime;

        performanceMonitor.recordMetric({
          id,
          operation,
          duration,
          timestamp: new Date(),
          metadata: {
            endpoint,
            method,
            status: response.status,
            statusText: response.statusText,
            ...additionalMetadata,
          },
          success: response.ok,
        });

        // Handle API errors
        if (!response.ok) {
          errorHandler.handleApiError(response, operation);
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        performanceMonitor.recordMetric({
          id,
          operation,
          duration,
          timestamp: new Date(),
          metadata: {
            endpoint,
            method,
            error: true,
            errorMessage:
              error instanceof Error ? error.message : 'Unknown error',
            ...additionalMetadata,
          },
          success: false,
        });

        // Handle network errors
        errorHandler.handleError(error as Error, {
          operation,
          endpoint,
          method,
        });

        throw error;
      }
    },
    []
  );

  return { timeApiCall };
}

// Hook for form performance monitoring
export function useFormPerformanceMonitoring(formName: string) {
  const { timeOperation } = usePerformanceMonitoring({
    operation: `form_${formName}`,
  });

  const timeFormSubmission = useCallback(
    async <T>(
      submitFn: () => Promise<T>,
      additionalMetadata?: Record<string, any>
    ): Promise<T> => {
      return timeOperation(
        submitFn,
        `form_${formName}_submit`,
        additionalMetadata
      );
    },
    [timeOperation, formName]
  );

  const { timeSyncOperation } = usePerformanceMonitoring({
    operation: `form_${formName}_validate`,
  });

  const timeFormValidation = useCallback(
    <T>(validateFn: () => T, additionalMetadata?: Record<string, any>): T => {
      return timeSyncOperation(
        validateFn,
        `form_${formName}_validate`,
        additionalMetadata
      );
    },
    [timeSyncOperation, formName]
  );

  return {
    timeFormSubmission,
    timeFormValidation,
  };
}

// Hook for component render performance monitoring
export function useRenderPerformanceMonitoring(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number>(0);

  useEffect(() => {
    const renderStart = performance.now();
    renderCountRef.current += 1;

    // Use requestAnimationFrame to measure after render is complete
    requestAnimationFrame(() => {
      const renderEnd = performance.now();
      const renderDuration = renderEnd - renderStart;
      lastRenderTimeRef.current = renderDuration;

      // Only log slow renders or every 10th render
      if (renderDuration > 16 || renderCountRef.current % 10 === 0) {
        performanceMonitor.recordMetric({
          id: `${componentName}_render_${Date.now()}_${Math.random()}`,
          operation: `component_${componentName}_render`,
          duration: renderDuration,
          timestamp: new Date(),
          metadata: {
            renderCount: renderCountRef.current,
            isSlowRender: renderDuration > 16,
          },
          success: true,
        });
      }
    });
  });

  return {
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current,
  };
}

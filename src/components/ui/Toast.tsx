'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, clearToasts }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  const toastContent = (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );

  return createPortal(toastContent, document.body);
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success:
      'text-stakeados-primary border-stakeados-primary/30 bg-stakeados-primary/10',
    error: 'text-stakeados-red border-stakeados-red/30 bg-stakeados-red/10',
    warning:
      'text-stakeados-yellow border-stakeados-yellow/30 bg-stakeados-yellow/10',
    info: 'text-stakeados-blue border-stakeados-blue/30 bg-stakeados-blue/10',
  };

  return (
    <div
      className={cn(
        'bg-gaming-card border rounded-gaming shadow-glow-lg p-4 animate-slide-in-right',
        colors[toast.type]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{icons[toast.type]}</div>

        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="font-semibold text-white mb-1">{toast.title}</h4>
          )}
          <p className="text-sm text-stakeados-gray-300">{toast.message}</p>

          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium hover:underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 text-stakeados-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Convenience functions
export function useToastHelpers() {
  const { addToast } = useToast();

  return {
    success: (message: string, title?: string) =>
      addToast({ type: 'success', message, title }),
    error: (message: string, title?: string) =>
      addToast({ type: 'error', message, title }),
    warning: (message: string, title?: string) =>
      addToast({ type: 'warning', message, title }),
    info: (message: string, title?: string) =>
      addToast({ type: 'info', message, title }),
  };
}

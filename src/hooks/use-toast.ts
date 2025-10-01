import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

interface ToastState {
  toasts: Toast[];
}

const toastState: ToastState = {
  toasts: [],
};

const listeners: Array<(state: ToastState) => void> = [];

function dispatch(action: { type: string; payload?: any }) {
  switch (action.type) {
    case 'ADD_TOAST':
      toastState.toasts.push(action.payload);
      break;
    case 'REMOVE_TOAST':
      toastState.toasts = toastState.toasts.filter(t => t.id !== action.payload);
      break;
    case 'CLEAR_TOASTS':
      toastState.toasts = [];
      break;
  }
  
  listeners.forEach(listener => listener(toastState));
}

export function useToast() {
  const [state, setState] = useState(toastState);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    dispatch({
      type: 'ADD_TOAST',
      payload: { id, title, description, variant },
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
      dispatch({
        type: 'REMOVE_TOAST',
        payload: id,
      });
    }, 5000);

    return id;
  }, []);

  const dismiss = useCallback((toastId: string) => {
    dispatch({
      type: 'REMOVE_TOAST',
      payload: toastId,
    });
  }, []);

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  };
}
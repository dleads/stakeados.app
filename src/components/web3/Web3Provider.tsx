'use client';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/web3/config';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 3,
    },
  },
});

interface Web3ProviderProps {
  children: React.ReactNode;
}

// Error boundary component for Web3 errors
class Web3ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Log the error for debugging
    console.warn('Web3 Error Boundary caught an error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Web3 Error Boundary error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when Web3 fails
      return (
        <div className="min-h-screen bg-stakeados-dark flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              Web3 Connection Error
            </h2>
            <p className="text-stakeados-gray-400 mb-4">
              There was an issue connecting to Web3 services.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-stakeados-primary text-stakeados-dark rounded-gaming hover:bg-stakeados-primary-light transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <Web3ErrorBoundary>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </Web3ErrorBoundary>
  );
}

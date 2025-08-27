'use client';

import React from 'react';

export class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Error en el dashboard
          </h3>
          <p className="text-gray-300 mb-4">{this.state.error.message}</p>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            onClick={() => location.reload()}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

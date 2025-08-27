'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-4xl font-bold text-red-500 mb-6">System Error</h1>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-8">
          <h2 className="font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm opacity-90">
            An unexpected error occurred. Please try again or contact support if
            the problem persists.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-yellow-400 hover:text-yellow-300">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-auto">
                {error.message}
                {error.stack && (
                  <>
                    {'\n\nStack Trace:\n'}
                    {error.stack}
                  </>
                )}
              </pre>
            </details>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg"
          >
            Go Home
          </button>
        </div>
        <div className="mt-8 text-sm text-gray-400">
          <p>Error ID: {error.digest || 'Unknown'}</p>
          <p className="mt-2">
            Need help? Contact{' '}
            <a
              href="mailto:support@stakeados.com"
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              support@stakeados.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

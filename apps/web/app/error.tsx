'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Error boundary for the entire application
 * Catches and displays errors gracefully instead of showing blank page
 * https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log error to console in development
    console.error('Application error:', error);

    // In production, you could send to error tracking service like Sentry
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="w-16 h-16 text-red-500" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            An unexpected error occurred. The error has been logged and our team will investigate.
          </p>
        </div>

        {/* Error details (only in development) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-left">
            <p className="text-xs font-mono text-red-700 dark:text-red-400 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => reset()}
            className="flex-1"
          >
            Try again
          </Button>
          <Button
            onClick={() => {
              // Reload page
              window.location.href = '/';
            }}
            variant="outline"
            className="flex-1"
          >
            Go home
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 pt-4">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}

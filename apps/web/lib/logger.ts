/**
 * Structured logging utility for Crystal Forge
 *
 * Usage:
 * - logger.error('Query failed', error)
 * - logger.warn('Slow query detected')
 * - logger.debug('Query state updated')
 * - logger.info('User connected to cluster')
 *
 * In production, configure error tracking service in the error() method
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
}

/**
 * Format an Error object for logging
 */
function formatError(error: unknown): LogEntry['error'] | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
    };
  }

  return {
    name: 'Unknown',
    message: String(error),
  };
}

/**
 * Get current environment
 */
function getEnvironment(): string {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.NODE_ENV || 'development';
  }
  // Client-side
  return process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development';
}

/**
 * Format log entry as JSON string
 */
function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry, null, 2);
}

/**
 * Send error to external tracking service (Sentry, LogRocket, etc.)
 * Configure this based on your monitoring solution
 */
function sendToErrorTracking(level: LogLevel, message: string, error?: LogEntry['error']) {
  // Only send errors and warnings to tracking service
  if (level !== 'error' && level !== 'warn') return;

  try {
    // Example: Sentry integration
    // if (window.Sentry && level === 'error') {
    //   window.Sentry.captureException(error);
    // }

    // Example: LogRocket integration
    // if (window.LogRocket && level === 'error') {
    //   window.LogRocket.captureException(new Error(message));
    // }

    // TODO: Configure your error tracking service here
  } catch (trackingError) {
    // Silently fail if error tracking fails
    console.error('Error tracking service failed:', trackingError);
  }
}

/**
 * Main logger object with methods for each log level
 */
export const logger = {
  /**
   * Log debug messages (development only)
   */
  debug: (message: string, context?: Record<string, unknown>) => {
    if (getEnvironment() !== 'development') return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      context,
    };

    console.debug(`[DEBUG] ${message}`, context ? entry : '');
  },

  /**
   * Log info messages
   */
  info: (message: string, context?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    };

    console.log(`[INFO] ${message}`, context ? entry : '');
  },

  /**
   * Log warnings
   */
  warn: (message: string, error?: unknown) => {
    const errorObj = formatError(error);
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      error: errorObj,
    };

    console.warn(`[WARN] ${message}`, errorObj ? entry : '');
    sendToErrorTracking('warn', message, errorObj);
  },

  /**
   * Log errors
   */
  error: (message: string, error?: unknown) => {
    const errorObj = formatError(error);
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: errorObj,
    };

    console.error(`[ERROR] ${message}`, entry);
    sendToErrorTracking('error', message, errorObj);

    // In development, also show error details
    if (getEnvironment() === 'development' && error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
  },

  /**
   * Create a child logger with a prefix
   * Useful for module-specific logging
   *
   * Example:
   * const queryLogger = logger.child('QueryContext');
   * queryLogger.debug('Query state updated');
   * // Outputs: [DEBUG] [QueryContext] Query state updated
   */
  child: (prefix: string) => {
    return {
      debug: (message: string, context?: Record<string, unknown>) =>
        logger.debug(`[${prefix}] ${message}`, context),
      info: (message: string, context?: Record<string, unknown>) =>
        logger.info(`[${prefix}] ${message}`, context),
      warn: (message: string, error?: unknown) =>
        logger.warn(`[${prefix}] ${message}`, error),
      error: (message: string, error?: unknown) =>
        logger.error(`[${prefix}] ${message}`, error),
    };
  },
};

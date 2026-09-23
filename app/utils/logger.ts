/**
 * Centralized Error & Telemetry Logger
 * Captures errors and telemetry metrics from loaders, actions, middlewares, and UI rendering.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'loader' | 'action' | 'ui' | 'middleware' | 'api' | 'system';

export interface LogEntry {
  id: string;
  level: LogLevel;
  category: LogCategory;
  context: string;
  message: string;
  stack?: string;
  url?: string;
  method?: string;
  route?: string;
  userAgent?: string;
  userId?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

const MAX_LOGS_HISTORY = 100;
const LOGS_BUFFER: LogEntry[] = [];

/**
 * Formats and records a log entry into the local buffer and console stream.
 */
function recordLog(
  level: LogLevel,
  category: LogCategory,
  context: string,
  message: string,
  errorOrMeta?: unknown,
  extra?: Partial<LogEntry>
): LogEntry {
  let stack: string | undefined;
  let metadata: Record<string, any> | undefined;

  if (errorOrMeta instanceof Error) {
    stack = errorOrMeta.stack;
    if (!message || message === errorOrMeta.message) {
      message = errorOrMeta.message;
    } else {
      message = `${message}: ${errorOrMeta.message}`;
    }
  } else if (errorOrMeta && typeof errorOrMeta === 'object') {
    metadata = errorOrMeta as Record<string, any>;
  }

  const entry: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    level,
    category,
    context,
    message,
    stack,
    metadata,
    timestamp: new Date().toISOString(),
    ...extra,
  };

  // Ring buffer eviction
  if (LOGS_BUFFER.length >= MAX_LOGS_HISTORY) {
    LOGS_BUFFER.shift();
  }
  LOGS_BUFFER.push(entry);

  // Formatted Console Output
  const isProd =
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') ||
    Boolean(typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD);
  if (isProd) {
    // In production, emit single-line structured JSON for log aggregators
    const stream =
      level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    stream(JSON.stringify(entry));
  } else {
    // In development, emit human-readable colored log
    const tag = `[${entry.category.toUpperCase()}:${entry.context}]`;
    if (level === 'error') {
      console.error(`🔴 ${tag} ${entry.message}`, stack ?? '', metadata ?? '');
    } else if (level === 'warn') {
      console.warn(`🟡 ${tag} ${entry.message}`, metadata ?? '');
    } else if (level === 'info') {
      console.log(`🔵 ${tag} ${entry.message}`, metadata ?? '');
    } else {
      console.debug(`⚪ ${tag} ${entry.message}`, metadata ?? '');
    }
  }

  return entry;
}

export const logger = {
  /**
   * Log an error event with context and stack trace.
   */
  error(
    context: string,
    error: unknown,
    metadata?: Record<string, any>,
    category: LogCategory = 'system'
  ): LogEntry {
    const msg =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown Error';
    return recordLog('error', category, context, msg, error, { metadata });
  },

  /**
   * Log a warning message.
   */
  warn(
    context: string,
    message: string,
    metadata?: Record<string, any>,
    category: LogCategory = 'system'
  ): LogEntry {
    return recordLog('warn', category, context, message, metadata, { metadata });
  },

  /**
   * Log an informational message.
   */
  info(
    context: string,
    message: string,
    metadata?: Record<string, any>,
    category: LogCategory = 'system'
  ): LogEntry {
    return recordLog('info', category, context, message, metadata, { metadata });
  },

  /**
   * Log a debug trace message.
   */
  debug(
    context: string,
    message: string,
    metadata?: Record<string, any>,
    category: LogCategory = 'system'
  ): LogEntry {
    return recordLog('debug', category, context, message, metadata, { metadata });
  },

  /**
   * Captures and logs errors occurring in Route Loaders.
   */
  logLoaderError(context: string, error: unknown, request?: Request): LogEntry {
    let url: string | undefined;
    let method: string | undefined;

    if (request) {
      url = request.url;
      method = request.method;
    }

    return recordLog('error', 'loader', context, 'Loader execution failed', error, {
      url,
      method,
    });
  },

  /**
   * Captures and logs errors occurring in Route Actions.
   */
  logActionError(context: string, error: unknown, request?: Request): LogEntry {
    let url: string | undefined;
    let method: string | undefined;

    if (request) {
      url = request.url;
      method = request.method;
    }

    return recordLog('error', 'action', context, 'Action execution failed', error, {
      url,
      method,
    });
  },

  /**
   * Captures and logs route or API errors.
   */
  logRouteError(context: string, error: unknown, request?: Request): LogEntry {
    let url: string | undefined;
    let method: string | undefined;

    if (request) {
      url = request.url;
      method = request.method;
    }

    return recordLog('error', 'api', context, 'Route / API error occurred', error, {
      url,
      method,
    });
  },

  /**
   * Captures and logs errors occurring in Client-Side UI Rendering or Error Boundaries.
   */
  logClientError(context: string, error: unknown): LogEntry {
    return recordLog('error', 'ui', context, 'UI Client Render Error', error);
  },

  /**
   * Retrieves the recent in-memory log history.
   */
  getRecentLogs(limit: number = 50): LogEntry[] {
    return LOGS_BUFFER.slice(-limit);
  },

  /**
   * Clears the in-memory log history buffer.
   */
  clearLogs(): void {
    LOGS_BUFFER.length = 0;
  },
};

export default logger;

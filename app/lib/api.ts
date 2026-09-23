// Server-only — base fetch helper ke Rayeen API.

import { redirect } from 'react-router';

export function getApiBase() {
  if (import.meta.env.SSR) {
    return (typeof process !== 'undefined' ? process.env?.API_URL : undefined) ?? 'https://api.rayeen.web.id';
  }
  return 'https://api.rayeen.web.id';
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  error_message: string | null;
  data: T | null;
  summary?: unknown;
  version: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ErrorCatchPayload {
  error: unknown;
  context: string;
  userId?: string;
  requestId?: string;
  extra?: Record<string, any>;
  notifyTelegram?: boolean;
}

/**
 * Global ErrorCatch Dispatcher
 * Centralized exception boundary for all server functions (loaders, actions, API services).
 * Logs structured telemetry, bypasses Response redirects, and dispatches to Telegram/bug_logs.
 */
export function ErrorCatch({
  error,
  context,
  userId,
  requestId,
  extra,
  notifyTelegram = false,
}: ErrorCatchPayload) {
  // CRITICAL: Do not intercept React Router redirects or 401/302 responses
  if (error instanceof Response) throw error;

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const statusCode = error instanceof ApiError ? error.statusCode : undefined;
  const timestamp = new Date().toISOString();

  // 1. Structured Central Console Logging
  console.error(`🚨 [ErrorCatch] [${context}]`, {
    message,
    statusCode,
    userId,
    requestId,
    extra,
    stack,
    timestamp,
  });

  // 2. Telegram Alert Dispatcher (Fire-and-forget, non-blocking)
  if (notifyTelegram && typeof fetch === 'function') {
    try {
      const telegramWebhook =
        typeof process !== 'undefined' ? process.env?.TELEGRAM_LOG_WEBHOOK : undefined;
      if (telegramWebhook) {
        fetch(telegramWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🔥 *[Rayeen Gateway Error]*\n*Context:* \`${context}\`\n*Error:* ${message}\n*Status:* ${statusCode || 500}\n*Time:* ${timestamp}`,
            parse_mode: 'Markdown',
          }),
        }).catch(() => {});
      }
    } catch {
      // Ignore webhook network failure to prevent crashing the main thread
    }
  }
}

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  token?: string;
  requestId?: string;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
  retries = 2
): Promise<ApiResponse<T>> {
  const { token, requestId, headers = {}, ...rest } = options;

  // Jika body adalah FormData, JANGAN set Content-Type manual — biarkan browser
  // men-set multipart boundary sendiri (menghindari error multipart).
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(`${getApiBase()}${path}`, {
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(requestId ? { 'x-request-id': requestId } : {}),
          ...headers,
        },
        signal: controller.signal,
        ...rest,
      });

      if (res.status === 401) {
        throw redirect('/auth/login');
      }

      const text = await res.text();
      let json: ApiResponse<T>;
      try {
        json = JSON.parse(text) as ApiResponse<T>;
      } catch {
        throw new ApiError(`Invalid JSON response from ${path}: ${text.slice(0, 100)}`, res.status);
      }

      if (!res.ok) {
        const issues = (json.data as any)?.issues;
        const issueDetails =
          Array.isArray(issues) && issues.length > 0
            ? issues.map((i: any) => `${i.field}: ${i.message}`).join(', ')
            : '';
        const finalMessage = issueDetails
          ? `${json.error_message || 'Validation failed'} (${issueDetails})`
          : (json.error_message ?? `HTTP ${res.status}`);
        throw new ApiError(finalMessage, res.status);
      }

      return json;
    } catch (error) {
      if (error instanceof Response) throw error;
      if (error instanceof ApiError && error.statusCode < 500) throw error;
      if (attempt === retries) throw error;
      const delay = Math.min(2 ** attempt * 1000, 4000);
      await new Promise((r) => setTimeout(r, delay));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error('unreachable');
}

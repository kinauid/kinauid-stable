import { z } from 'zod';
import { ErrorCatch } from '~/lib/api';
import { logger } from '~/utils/logger';

// ==========================================
// 1. Custom ApiError Class
// ==========================================

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    status: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(
    message = 'Permintaan tidak valid.',
    details?: any,
    code = 'BAD_REQUEST'
  ): ApiError {
    return new ApiError(message, 400, code, details);
  }

  static unauthorized(
    message = 'Sesi telah berakhir atau Anda belum login.',
    details?: any,
    code = 'UNAUTHORIZED'
  ): ApiError {
    return new ApiError(message, 401, code, details);
  }

  static forbidden(
    message = 'Akses ditolak: Anda tidak memiliki izin untuk sumber daya ini.',
    details?: any,
    code = 'FORBIDDEN'
  ): ApiError {
    return new ApiError(message, 403, code, details);
  }

  static notFound(
    message = 'Data atau rute tidak ditemukan.',
    details?: any,
    code = 'NOT_FOUND'
  ): ApiError {
    return new ApiError(message, 404, code, details);
  }

  static conflict(
    message = 'Terjadi konflik data pada server.',
    details?: any,
    code = 'CONFLICT'
  ): ApiError {
    return new ApiError(message, 409, code, details);
  }

  static validation(
    message = 'Validasi data gagal.',
    details?: any,
    code = 'VALIDATION_ERROR'
  ): ApiError {
    return new ApiError(message, 422, code, details);
  }

  static tooManyRequests(
    message = 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
    details?: any,
    code = 'RATE_LIMITED'
  ): ApiError {
    return new ApiError(message, 429, code, details);
  }

  static internal(
    message = 'Terjadi kesalahan internal pada server.',
    details?: any,
    code = 'INTERNAL_SERVER_ERROR'
  ): ApiError {
    return new ApiError(message, 500, code, details);
  }
}

// ==========================================
// 2. Standard Response Payloads
// ==========================================

export interface ApiSuccessPayload<T = any> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
  [key: string]: any;
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
    details?: ApiErrorDetail[] | Record<string, any> | any;
  };
}

export type ApiResponsePayload<T = any> = ApiSuccessPayload<T> | ApiErrorPayload;

// ==========================================
// 3. Response Factories (React Router v7 / Web Standards)
// ==========================================

export type SuccessResponseOptions =
  | number
  | (ResponseInit & {
      meta?: Record<string, any>;
    });

/**
 * Creates a standardized JSON success Response.
 * @param data The payload data to return
 * @param options HTTP status code or ResponseInit object with optional metadata
 */
export function successResponse<T = any>(data: T, options?: SuccessResponseOptions): Response {
  let status = 200;
  let headersInit: HeadersInit | undefined;
  let meta: Record<string, any> | undefined;

  if (typeof options === 'number') {
    status = options;
  } else if (options && typeof options === 'object') {
    if (options.status !== undefined) status = options.status;
    if (options.headers !== undefined) headersInit = options.headers;
    if (options.meta !== undefined) meta = options.meta;
  }

  const payload: ApiSuccessPayload<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };

  const headers = new Headers(headersInit);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers,
  });
}

export type ErrorResponseOptions =
  | number
  | (ResponseInit & {
      code?: string;
      fallbackMessage?: string;
      details?: any;
    });

/**
 * Creates a standardized JSON error Response.
 * Automatically formats ZodError, ApiError, standard Error, and unknown exceptions.
 * @param error The thrown or caught error
 * @param options HTTP status fallback or ResponseInit configuration
 */
export function errorResponse(error: unknown, options?: ErrorResponseOptions): Response {
  let fallbackStatus = 500;
  let fallbackCode: string | undefined;
  let fallbackMessage = 'Terjadi kesalahan pada server.';
  let fallbackDetails: any;
  let headersInit: HeadersInit | undefined;

  if (typeof options === 'number') {
    fallbackStatus = options;
  } else if (options && typeof options === 'object') {
    if (options.status !== undefined) fallbackStatus = options.status;
    if (options.code !== undefined) fallbackCode = options.code;
    if (options.fallbackMessage !== undefined) fallbackMessage = options.fallbackMessage;
    if (options.details !== undefined) fallbackDetails = options.details;
    if (options.headers !== undefined) headersInit = options.headers;
  }

  let status = fallbackStatus;
  let code = fallbackCode || 'INTERNAL_SERVER_ERROR';
  let message = fallbackMessage;
  let details = fallbackDetails;

  // 1. Handle ApiError instance
  if (error instanceof ApiError) {
    status = error.status;
    code = error.code;
    message = error.message;
    details = error.details ?? fallbackDetails;
  }
  // 2. Handle Zod validation errors
  else if (
    error instanceof z.ZodError ||
    (typeof error === 'object' &&
      error !== null &&
      'issues' in error &&
      Array.isArray((error as any).issues))
  ) {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Data yang dikirimkan tidak valid.';
    details = (error as z.ZodError).issues.map((issue) => ({
      field: Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path || ''),
      message: issue.message,
      code: issue.code,
    }));
  }
  // 3. Handle standard Response instances (e.g. from fetch / sub-requests)
  else if (error instanceof Response) {
    status = error.status;
    code = `HTTP_${error.status}`;
    message = error.statusText || `HTTP ${error.status} Error`;
  }
  // 4. Handle standard Error instance
  else if (error instanceof Error) {
    status = (error as any).status || (error as any).statusCode || fallbackStatus;
    code =
      (error as any).code ||
      fallbackCode ||
      (status === 400
        ? 'BAD_REQUEST'
        : status === 401
          ? 'UNAUTHORIZED'
          : status === 403
            ? 'FORBIDDEN'
            : status === 404
              ? 'NOT_FOUND'
              : status === 422
                ? 'VALIDATION_ERROR'
                : 'INTERNAL_SERVER_ERROR');
    message = error.message || fallbackMessage;
    details = (error as any).details ?? fallbackDetails;
  }
  // 5. Handle string literals
  else if (typeof error === 'string') {
    status = fallbackStatus !== 500 ? fallbackStatus : 400;
    code = fallbackCode || (status === 400 ? 'BAD_REQUEST' : 'ERROR');
    message = error;
  }
  // 6. Handle plain objects
  else if (typeof error === 'object' && error !== null) {
    status = (error as any).status || (error as any).statusCode || fallbackStatus;
    code = (error as any).code || fallbackCode || 'UNKNOWN_ERROR';
    message = (error as any).message || fallbackMessage;
    details = (error as any).details ?? fallbackDetails;
  }

  // Auto-log 5xx server errors
  if (status >= 500) {
    try {
      ErrorCatch({ error, context: 'apiResponse:errorResponse' });
      logger.logRouteError('apiResponse', error);
    } catch (_) {}
  }

  const payload: ApiErrorPayload = {
    success: false,
    error: {
      code,
      message,
      status,
      ...(details !== undefined ? { details } : {}),
    },
  };

  const headers = new Headers(headersInit);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers,
  });
}

// ==========================================
// 4. Payload Evaluators & Unwrappers
// ==========================================

export function isApiSuccess<T = any>(payload: unknown): payload is ApiSuccessPayload<T> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as any).success === true &&
    'data' in payload
  );
}

export function isApiError(payload: unknown): payload is ApiErrorPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as any).success === false &&
    'error' in payload
  );
}

/**
 * Unwraps an ApiResponsePayload. Returns data if success, or throws ApiError if error.
 */
export function unwrapApiResponse<T = any>(payload: ApiResponsePayload<T> | unknown): T {
  if (isApiSuccess<T>(payload)) {
    return payload.data;
  }
  if (isApiError(payload)) {
    throw new ApiError(
      payload.error.message,
      payload.error.status,
      payload.error.code,
      payload.error.details
    );
  }
  return payload as T;
}

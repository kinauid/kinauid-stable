import React from 'react';
import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type HeadersArgs,
  type HeadersFunction,
} from 'react-router';
import {
  composeMiddlewares,
  withTelemetry,
  rateLimitMiddleware,
  optionalAuthMiddleware,
  metaAccessMiddleware,
  sessionToAuthUser,
  type MiddlewareFunction,
  type MiddlewareContext,
  type RouteHandler,
} from '~/lib/middleware.server';
import { getSessionData } from '~/lib/session.server';
import {
  cacheHeaders,
  buildCacheControlHeader,
  CACHE_PRESETS,
  type CachePreset,
  type CacheControlOptions,
} from '~/lib/cache';
import { type MetaAccessConfig, type AuthUser, checkMetaAccess } from '~/constants/permissions';
import { ErrorCatch } from '~/lib/api';
import { logger } from '~/utils/logger';
import { errorResponse, ApiError } from '~/utils/apiResponse';
import { getThemeFromRequest, setThemeCookieHeader, type Theme } from '~/lib/theme.server';
import {
  getLanguageFromRequest,
  setLanguageCookieHeader,
  type SupportedLanguage,
} from '~/utils/i18n';

export {
  getThemeFromRequest,
  setThemeCookieHeader,
  getLanguageFromRequest,
  setLanguageCookieHeader,
};
export type { Theme, SupportedLanguage };

export interface GlobalHandlerConfig {
  /** Global middlewares to run before all loaders */
  loaderMiddlewares?: MiddlewareFunction[];
  /** Global middlewares to run before all actions */
  actionMiddlewares?: MiddlewareFunction[];
  /** Default caching preset for loaders */
  defaultCachePreset?: CachePreset | CacheControlOptions;
}

const DEFAULT_CONFIG: GlobalHandlerConfig = {
  loaderMiddlewares: [
    withTelemetry('global:loader'),
    rateLimitMiddleware({ limit: 200, windowMs: 60_000 }),
    optionalAuthMiddleware(),
  ],
  actionMiddlewares: [
    withTelemetry('global:action'),
    rateLimitMiddleware({ limit: 60, windowMs: 60_000 }),
  ],
  defaultCachePreset: 'Dynamic',
};

/**
 * Enforces authentication and RBAC permissions based on MetaAccessConfig.
 */
export async function enforceMetaAccess(
  metaAccess: MetaAccessConfig | undefined,
  ctx: MiddlewareContext
): Promise<void> {
  if (!metaAccess) return;

  // Ensure session and user are resolved
  if (!ctx.session && !ctx.user) {
    const session = await getSessionData(ctx.request);
    ctx.session = session;
    ctx.user = sessionToAuthUser(session);
  }

  const accessResult = checkMetaAccess(metaAccess, ctx.user);

  if (accessResult.status === 401) {
    const redirectTo = metaAccess.redirectTo || '/login';
    throw redirect(redirectTo);
  }

  if (accessResult.status === 403) {
    throw errorResponse(
      new ApiError(
        accessResult.message || 'Forbidden: Insufficient permissions to access this resource.',
        403,
        'FORBIDDEN'
      ),
      403
    );
  }
}

/**
 * Creates a global loader pipeline that runs universal middleware,
 * enforces RBAC metaAccess, and delegates to the feature-specific loader.
 */
export function createGlobalLoader<T = any>(
  featureLoader?: (
    args: LoaderFunctionArgs & { session?: any; user?: AuthUser | null }
  ) => Promise<T> | T,
  options?: {
    customMiddlewares?: MiddlewareFunction[];
    metaAccess?: MetaAccessConfig;
  }
) {
  const middlewares = [
    ...(DEFAULT_CONFIG.loaderMiddlewares || []),
    ...(options?.customMiddlewares || []),
  ];

  const pipeline = composeMiddlewares(...middlewares);

  return async function globalLoader(args: LoaderFunctionArgs): Promise<T | null | Response> {
    const ctx: MiddlewareContext = {
      request: args.request,
      params: args.params,
      session: null,
      user: null,
      state: {},
      startTime: Date.now(),
    };

    try {
      return await pipeline(ctx, async () => {
        // 1. Check metaAccess attached to featureLoader or passed in options
        const targetAccess: MetaAccessConfig | undefined =
          options?.metaAccess || (featureLoader as any)?.metaAccess;

        if (targetAccess) {
          await enforceMetaAccess(targetAccess, ctx);
        }

        if (!featureLoader) return null as T;

        return featureLoader({
          ...args,
          session: ctx.session,
          user: ctx.user,
        });
      });
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      ErrorCatch({ error, context: 'GlobalLoader:Unhandled' });
      logger.logRouteError('GlobalLoader:Unhandled', error, args.request);
      throw errorResponse(error);
    }
  };
}

/**
 * Creates a global action pipeline that executes rate limiting, telemetry,
 * RBAC access checks, and security middleware before delegating to the feature-specific action.
 */
export function createGlobalAction<T = any>(
  featureAction?: (
    args: ActionFunctionArgs & { session?: any; user?: AuthUser | null }
  ) => Promise<T> | T,
  options?: {
    customMiddlewares?: MiddlewareFunction[];
    metaAccess?: MetaAccessConfig;
  }
) {
  const middlewares = [
    ...(DEFAULT_CONFIG.actionMiddlewares || []),
    ...(options?.customMiddlewares || []),
  ];

  const pipeline = composeMiddlewares(...middlewares);

  return async function globalAction(args: ActionFunctionArgs): Promise<T | null | Response> {
    const ctx: MiddlewareContext = {
      request: args.request,
      params: args.params,
      session: null,
      user: null,
      state: {},
      startTime: Date.now(),
    };

    try {
      return await pipeline(ctx, async () => {
        // 1. Check metaAccess attached to featureAction or passed in options
        const targetAccess: MetaAccessConfig | undefined =
          options?.metaAccess || (featureAction as any)?.metaAccess;

        if (targetAccess) {
          await enforceMetaAccess(targetAccess, ctx);
        }

        if (!featureAction) return null as T;

        return featureAction({
          ...args,
          session: ctx.session,
          user: ctx.user,
        });
      });
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      ErrorCatch({ error, context: 'GlobalAction:Unhandled' });
      logger.logActionError('GlobalAction:Unhandled', error, args.request);
      return errorResponse(error);
    }
  };
}

/**
 * Creates a global caching headers resolver that forwards and merges
 * headers from feature .ts files directly into React Router v7 response headers.
 */
export function createGlobalHeaders(
  featureHeaders?:
    | HeadersFunction
    | CachePreset
    | CacheControlOptions
    | ((args: HeadersArgs) => CachePreset | CacheControlOptions),
  defaultPreset: CachePreset | CacheControlOptions = 'Dynamic'
): HeadersFunction {
  return (args: HeadersArgs) => {
    const headers = new Headers(args.loaderHeaders);

    // 1. If feature exported a function
    if (typeof featureHeaders === 'function') {
      try {
        const result = (featureHeaders as any)(args);

        // Result is Headers object
        if (result instanceof Headers) {
          result.forEach((val, key) => headers.set(key, val));
          return headers;
        }

        // Result is CachePreset or CacheControlOptions
        if (typeof result === 'string' || (result && typeof result === 'object')) {
          const cacheControl = buildCacheControlHeader(result);
          headers.set('Cache-Control', cacheControl);
          if (typeof result === 'object' && result.tags && result.tags.length > 0) {
            headers.set('Cache-Tag', result.tags.join(','));
          }
          return headers;
        }
      } catch (err) {
        console.error('[GlobalHandler] Error resolving feature headers:', err);
      }
    }

    // 2. If feature exported a static preset or CacheControlOptions
    if (featureHeaders && typeof featureHeaders !== 'function') {
      const cacheControl = buildCacheControlHeader(featureHeaders);
      headers.set('Cache-Control', cacheControl);
      if (
        typeof featureHeaders === 'object' &&
        featureHeaders.tags &&
        featureHeaders.tags.length > 0
      ) {
        headers.set('Cache-Tag', featureHeaders.tags.join(','));
      }
      return headers;
    }

    // 3. Fallback to default preset
    const fallbackControl = buildCacheControlHeader(defaultPreset);
    headers.set('Cache-Control', fallbackControl);
    return headers;
  };
}

/**
 * Dynamically resolves headers from any feature module (inspects exported headers or DSL metadata)
 */
export function resolveFeatureHeaders(featureModule: any, args: HeadersArgs): Headers {
  const featureHeaders =
    featureModule?.headers || featureModule?.default?._headers || DEFAULT_CONFIG.defaultCachePreset;

  const resolver = createGlobalHeaders(featureHeaders);
  return resolver(args) as Headers;
}

/**
 * Feature Module Lazy Guard Component
 * Provides an isolated fallback error state if a micro-feature module encounters a runtime exception or failed import.
 */
export function FeatureModuleGuard({
  featureName = 'Feature Module',
  error,
  onRetry,
}: {
  featureName?: string;
  error?: unknown;
  onRetry?: () => void;
}) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Gagal memuat modul fitur atau ekspor default tidak ditemukan.';

  return (
    <div className="p-6 rounded-[var(--radius-card)] bg-[var(--card)] border border-red-500/30 shadow-[var(--shadow-card)] text-center space-y-4 my-4">
      <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center font-bold text-lg">
        !
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-[var(--foreground)]">
          Gagal Memuat Komponen: {featureName}
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed max-w-md mx-auto">
          {errorMessage}
        </p>
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onRetry || (() => window.location.reload())}
          className="px-4 py-1.5 rounded-full bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Coba Muat Ulang
        </button>
      </div>
    </div>
  );
}

/**
 * Creates a lazy-loaded, crash-resilient feature route with automatic error boundary fallback.
 */
export function createLazyFeatureRoute(importFn: () => Promise<any>, featureName?: string) {
  const LazyComponent = React.lazy(async () => {
    try {
      const module = await importFn();
      if (!module || !module.default) {
        throw new Error(
          `Module '${featureName || 'unnamed'}' does not have a default export. Ensure createPage(...) is exported as default.`
        );
      }
      return { default: module.default };
    } catch (error) {
      ErrorCatch({ error, context: `LazyFeatureRoute:${featureName}` });
      logger.logClientError(`LazyFeatureRoute:${featureName}`, error);
      return {
        default: () => <FeatureModuleGuard featureName={featureName} error={error} />,
      };
    }
  });

  return function LazyFeatureWrapper(props: any) {
    return (
      <React.Suspense
        fallback={
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-6 w-48 bg-[var(--surface-subtle)] rounded" />
            <div className="h-32 w-full bg-[var(--surface-subtle)] rounded" />
          </div>
        }
      >
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
}

/**
 * Global Error Boundary & Catch handler for React Router v7 routes.
 */
export function GlobalErrorBoundary({ error }: { error?: unknown }) {
  React.useEffect(() => {
    if (error) {
      ErrorCatch({ error, context: 'GlobalErrorBoundary:client' });
      logger.logClientError('GlobalErrorBoundary:client', error);
    }
  }, [error]);

  const isRouteError = typeof error === 'object' && error !== null && 'status' in error;
  const status = isRouteError ? (error as any).status : 500;
  const statusText = isRouteError ? (error as any).statusText : 'Internal Server Error';

  const errorMessage =
    isRouteError && (error as any).data
      ? typeof (error as any).data === 'string'
        ? (error as any).data
        : (error as any).data?.message || (error as any).statusText
      : error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Terjadi kesalahan yang tidak terduga pada halaman ini.';

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-6 rounded-[24px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-card)] text-center space-y-4">
        <div
          className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-xl ${
            status === 403 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
          }`}
        >
          {status === 403 ? '🔒' : '!'}
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            {status === 403
              ? '403 — Akses Ditolak (Forbidden)'
              : `${status} — Gagal Memuat Halaman`}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{errorMessage}</p>
        </div>
        <div className="pt-2 flex justify-center gap-2">
          {status === 403 ? (
            <a
              href="/"
              className="px-4 py-2 rounded-full bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Kembali ke Beranda
            </a>
          ) : (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-full bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Muat Ulang Halaman
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

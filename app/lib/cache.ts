import type { HeadersFunction, HeadersArgs } from 'react-router';

export type CachePreset = 'Dynamic' | 'SemiStatic' | 'Static' | 'Immutable' | 'ContentOnly';

export const CACHE_PRESETS = {
  dynamic: 'Dynamic' as const,
  semiStatic: 'SemiStatic' as const,
  static: 'Static' as const,
  immutable: 'Immutable' as const,
  contentOnly: 'ContentOnly' as const,
};

export interface CacheControlOptions {
  /**
   * Browser cache duration in seconds (max-age).
   * Default: 0 for Dynamic, 300 for SemiStatic, 3600 for Static.
   */
  maxAge?: number;

  /**
   * Shared / CDN cache duration in seconds (s-maxage).
   */
  sMaxAge?: number;

  /**
   * Stale-while-revalidate window in seconds.
   */
  staleWhileRevalidate?: number;

  /**
   * Stale-if-error window in seconds.
   */
  staleIfError?: number;

  /**
   * Mark cache as private (browser only, no CDN).
   */
  isPrivate?: boolean;

  /**
   * Mark content as immutable (no revalidation needed during maxAge).
   */
  immutable?: boolean;

  /**
   * Optional CDN cache tag(s) for instant cache purge.
   */
  tags?: string[];
}

const PRESET_CONFIGS: Record<CachePreset, CacheControlOptions> = {
  Dynamic: {
    maxAge: 0,
    isPrivate: true,
  },
  SemiStatic: {
    maxAge: 300, // 5 minutes browser
    sMaxAge: 3600, // 1 hour CDN
    staleWhileRevalidate: 86400, // 1 day SWR
    isPrivate: false,
  },
  Static: {
    maxAge: 3600, // 1 hour browser
    sMaxAge: 86400, // 24 hours CDN
    staleWhileRevalidate: 604800, // 7 days SWR
    isPrivate: false,
  },
  Immutable: {
    maxAge: 31536000, // 1 year
    sMaxAge: 31536000,
    immutable: true,
    isPrivate: false,
  },
  ContentOnly: {
    maxAge: 60, // 1 minute browser
    sMaxAge: 600, // 10 minutes CDN
    staleWhileRevalidate: 300,
    isPrivate: false,
  },
};

/**
 * Builds standard Cache-Control header string from options or preset name.
 */
export function buildCacheControlHeader(
  presetOrOptions: CachePreset | CacheControlOptions
): string {
  const opts: CacheControlOptions =
    typeof presetOrOptions === 'string'
      ? (PRESET_CONFIGS[presetOrOptions] ?? PRESET_CONFIGS.Dynamic)
      : presetOrOptions;

  if (opts.isPrivate && opts.maxAge === 0) {
    return 'private, no-cache, no-store, must-revalidate';
  }

  const directives: string[] = [];

  if (opts.isPrivate) {
    directives.push('private');
  } else {
    directives.push('public');
  }

  if (typeof opts.maxAge === 'number') {
    directives.push(`max-age=${opts.maxAge}`);
  }

  if (typeof opts.sMaxAge === 'number' && !opts.isPrivate) {
    directives.push(`s-maxage=${opts.sMaxAge}`);
  }

  if (typeof opts.staleWhileRevalidate === 'number') {
    directives.push(`stale-while-revalidate=${opts.staleWhileRevalidate}`);
  }

  if (typeof opts.staleIfError === 'number') {
    directives.push(`stale-if-error=${opts.staleIfError}`);
  }

  if (opts.immutable) {
    directives.push('immutable');
  }

  return directives.join(', ');
}

export interface CacheHeadersFunctionFactory {
  (
    presetOrOptions:
      CachePreset | CacheControlOptions | ((args: HeadersArgs) => CachePreset | CacheControlOptions)
  ): HeadersFunction;
  dynamic: () => HeadersFunction;
  semiStatic: () => HeadersFunction;
  static: () => HeadersFunction;
  contentOnly: () => HeadersFunction;
  immutable: () => HeadersFunction;
}

/**
 * Creates a React Router v7 `headers` function that applies optimal HTTP caching headers.
 *
 * @example
 * // In single-file .ts route:
 * export const headers = cacheHeaders("SemiStatic");
 * export const headers = cacheHeaders(CACHE_PRESETS.semiStatic);
 * export const headers = cacheHeaders.semiStatic();
 *
 * // Or with dynamic options:
 * export const headers = cacheHeaders({
 *   maxAge: 60,
 *   sMaxAge: 600,
 *   staleWhileRevalidate: 3600
 * });
 */
function createCacheHeadersFunction(
  presetOrOptions:
    CachePreset | CacheControlOptions | ((args: HeadersArgs) => CachePreset | CacheControlOptions)
): HeadersFunction {
  return (args: HeadersArgs) => {
    const resolved =
      typeof presetOrOptions === 'function' ? presetOrOptions(args) : presetOrOptions;

    const cacheControl = buildCacheControlHeader(resolved);
    const headers = new Headers(args.loaderHeaders);

    headers.set('Cache-Control', cacheControl);

    if (typeof resolved === 'object' && resolved.tags && resolved.tags.length > 0) {
      headers.set('Cache-Tag', resolved.tags.join(','));
    }

    return headers;
  };
}

export const cacheHeaders: CacheHeadersFunctionFactory = Object.assign(createCacheHeadersFunction, {
  dynamic: () => createCacheHeadersFunction('Dynamic'),
  semiStatic: () => createCacheHeadersFunction('SemiStatic'),
  static: () => createCacheHeadersFunction('Static'),
  contentOnly: () => createCacheHeadersFunction('ContentOnly'),
  immutable: () => createCacheHeadersFunction('Immutable'),
});

/**
 * Injects Cache-Control headers into a Response object directly.
 */
export function applyCacheHeaders(
  response: Response,
  presetOrOptions: CachePreset | CacheControlOptions
): Response {
  const cacheControl = buildCacheControlHeader(presetOrOptions);
  response.headers.set('Cache-Control', cacheControl);

  if (
    typeof presetOrOptions === 'object' &&
    presetOrOptions.tags &&
    presetOrOptions.tags.length > 0
  ) {
    response.headers.set('Cache-Tag', presetOrOptions.tags.join(','));
  }

  return response;
}

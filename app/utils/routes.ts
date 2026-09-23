import { encryptCompactState } from './cryptoState';

export interface RouteNavigationOptions<TState = Record<string, any>> {
  params?: Record<string, string | number>;
  state?: TState;
  query?: Record<string, string | number | boolean | null | undefined>;
  hash?: string;
}

export type RouteBuilderFn<TState = Record<string, any>> = (
  optionsOrParam?: RouteNavigationOptions<TState> | string | number
) => string;

export interface KnownRouteMap {
  home: RouteBuilderFn;
  _index: RouteBuilderFn;
  dashboard: {
    admin: {
      manage: RouteBuilderFn;
    };
  };
  terms: {
    glossary: RouteBuilderFn;
  };
  [key: string]: any;
}

/**
 * Converts dot-notation segment array and options to a clean, valid URL path.
 */
function buildPathFromSegments(
  segments: string[],
  optionsOrParam?: RouteNavigationOptions | string | number
): string {
  // If no segments or index/home
  if (
    segments.length === 0 ||
    (segments.length === 1 &&
      (segments[0] === '_index' || segments[0] === 'home' || segments[0] === 'index'))
  ) {
    return appendOptionsToPath('/', optionsOrParam);
  }

  // Handle shorthand positional parameter e.g. routes.users.$id("123")
  let opts: RouteNavigationOptions = {};
  if (typeof optionsOrParam === 'string' || typeof optionsOrParam === 'number') {
    opts = { params: { id: String(optionsOrParam), 0: String(optionsOrParam) } };
  } else if (optionsOrParam && typeof optionsOrParam === 'object') {
    opts = optionsOrParam;
  }

  const pathParts: string[] = [];
  const params = opts.params || {};

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === '_index' || seg === 'index') continue;

    if (seg.startsWith('$')) {
      const paramName = seg.slice(1);
      const val = params[paramName] ?? params[String(i)] ?? params.id ?? seg;
      pathParts.push(encodeURIComponent(String(val)));
    } else {
      pathParts.push(seg);
    }
  }

  const basePath = '/' + pathParts.join('/');
  return appendOptionsToPath(basePath, opts);
}

function appendOptionsToPath(
  basePath: string,
  opts?: RouteNavigationOptions | string | number
): string {
  if (!opts || typeof opts !== 'object') return basePath;

  const urlParams = new URLSearchParams();

  // 1. Append encrypted state if provided (?q=...)
  if (opts.state && Object.keys(opts.state).length > 0) {
    const cipher = encryptCompactState(opts.state);
    if (cipher) {
      urlParams.set('q', cipher);
    }
  }

  // 2. Append standard query parameters
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) {
        urlParams.set(k, String(v));
      }
    }
  }

  const queryString = urlParams.toString();
  const pathWithQuery = queryString
    ? `${basePath}${basePath.includes('?') ? '&' : '?'}${queryString}`
    : basePath;

  const hashString = opts.hash ? (opts.hash.startsWith('#') ? opts.hash : `#${opts.hash}`) : '';
  return `${pathWithQuery}${hashString}`;
}

/**
 * Creates a recursive proxy that allows arbitrary dot-notation routing.
 */
function createRouteProxy(segments: string[] = []): any {
  const targetFn = function routeBuilder(
    optionsOrParam?: RouteNavigationOptions | string | number
  ) {
    return buildPathFromSegments(segments, optionsOrParam);
  };

  return new Proxy(targetFn, {
    get(_target, prop: string) {
      if (prop === 'then' || typeof prop === 'symbol') return undefined;
      if (prop === 'toString' || prop === 'valueOf') {
        return () => buildPathFromSegments(segments);
      }
      return createRouteProxy([...segments, prop]);
    },
    apply(_target, _thisArg, args) {
      return buildPathFromSegments(segments, args[0]);
    },
  });
}

/**
 * Type-Safe Route Navigation Helper
 *
 * @example
 * // Simple navigation:
 * routes.dashboard.admin.manage() // -> "/dashboard/admin/manage"
 * routes.terms.glossary()         // -> "/terms/glossary"
 * routes.home()                   // -> "/"
 *
 * // With encrypted URL state:
 * routes.dashboard.admin.manage({ state: { search: "rayhan", page: 2 } })
 * // -> "/dashboard/admin/manage?q=..."
 *
 * // With path parameters:
 * routes.users.$id({ params: { id: "usr-01" } }) // -> "/users/usr-01"
 * routes.users.$id("usr-01")                     // -> "/users/usr-01"
 */
export const routes: KnownRouteMap = createRouteProxy();

export default routes;

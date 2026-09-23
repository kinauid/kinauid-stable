import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { requireAuth, getSessionData, type SessionData } from './session.server';
import {
  type AuthUser,
  type MetaAccessConfig,
  type Role,
  type Permission,
  checkMetaAccess,
} from '~/constants/permissions';
import { ErrorCatch } from './api';

export interface MiddlewareContext {
  request: Request;
  params: Record<string, string | undefined>;
  session: SessionData | null;
  user: AuthUser | null;
  state: Record<string, any>;
  startTime: number;
}

export type MiddlewareArgs = LoaderFunctionArgs & {
  session?: SessionData | null;
  user?: AuthUser | null;
  state?: Record<string, any>;
};

export type MiddlewareNext = () => Promise<Response | any>;

export type MiddlewareFunction = (
  ctx: MiddlewareContext,
  next: MiddlewareNext
) => Promise<Response | any>;

export type RouteHandler<TArgs = MiddlewareArgs, TReturn = any> = (
  args: TArgs
) => Promise<TReturn> | TReturn;

/**
 * Normalizes SessionData into an AuthUser object.
 */
export function sessionToAuthUser(session: SessionData | null): AuthUser | null {
  if (!session) return null;
  return {
    id: session.user_id,
    email: session.user_email,
    name: session.user_name,
    role: (session.user_role as Role) || 'viewer',
  };
}

/**
 * Compose multiple middleware functions into a single pipeline.
 */
export function composeMiddlewares(
  ...middlewares: (MiddlewareFunction | undefined | null | false)[]
): MiddlewareFunction {
  const activeMiddlewares = middlewares.filter(Boolean) as MiddlewareFunction[];

  return async function composedPipeline(ctx: MiddlewareContext, next: MiddlewareNext) {
    let index = -1;

    async function dispatch(i: number): Promise<Response | any> {
      if (i <= index) {
        throw new Error('next() called multiple times in middleware chain');
      }
      index = i;

      const fn = activeMiddlewares[i];
      if (!fn) {
        return next();
      }

      return fn(ctx, () => dispatch(i + 1));
    }

    return dispatch(0);
  };
}

/**
 * Creates an authentication guard middleware.
 * Automatically checks and refreshes the user session.
 */
export function requireAuthMiddleware(options?: { redirectTo?: string }): MiddlewareFunction {
  const redirectTo = options?.redirectTo ?? '/login';

  return async (ctx, next) => {
    try {
      const session = await requireAuth(ctx.request);
      ctx.session = session;
      ctx.user = sessionToAuthUser(session);
      return await next();
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      ErrorCatch({ error, context: 'middleware:requireAuth' });
      throw redirect(redirectTo);
    }
  };
}

/**
 * Optional authentication middleware: populates session/user if present, but does not block.
 */
export function optionalAuthMiddleware(): MiddlewareFunction {
  return async (ctx, next) => {
    try {
      const session = await getSessionData(ctx.request);
      ctx.session = session;
      ctx.user = sessionToAuthUser(session);
    } catch (error) {
      // Non-blocking
      ctx.session = null;
      ctx.user = null;
    }
    return await next();
  };
}

/**
 * Role-based access control (RBAC) middleware.
 * Requires one of the specified roles.
 */
export function requireRoleMiddleware(...allowedRoles: (Role | string)[]): MiddlewareFunction {
  return metaAccessMiddleware({ roles: allowedRoles });
}

/**
 * Central MetaAccess Enforcement Middleware.
 * Enforces authentication (401 -> redirect) and authorization (403 -> Response).
 */
export function metaAccessMiddleware(metaAccess?: MetaAccessConfig): MiddlewareFunction {
  return async (ctx, next) => {
    if (!metaAccess) {
      return await next();
    }

    // Ensure session is loaded
    if (!ctx.session && !ctx.user) {
      const session = await getSessionData(ctx.request);
      ctx.session = session;
      ctx.user = sessionToAuthUser(session);
    }

    const accessResult = checkMetaAccess(metaAccess, ctx.user);

    if (accessResult.status === 401) {
      const targetRedirect = metaAccess.redirectTo || '/login';
      throw redirect(targetRedirect);
    }

    if (accessResult.status === 403) {
      throw new Response(
        accessResult.message || 'Forbidden: Insufficient permissions to access this route.',
        {
          status: 403,
          statusText: 'Forbidden',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }
      );
    }

    return await next();
  };
}

/**
 * Telemetry and performance logger middleware.
 * Measures latency and logs execution metrics.
 */
export function withTelemetry(contextName?: string): MiddlewareFunction {
  return async (ctx, next) => {
    const start = performance.now();
    const name = contextName || new URL(ctx.request.url).pathname;

    try {
      const result = await next();
      const durationMs = Math.round(performance.now() - start);

      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.log(`[Telemetry] ${ctx.request.method} ${name} — ${durationMs}ms`);
      }

      if (result instanceof Response) {
        result.headers.set('Server-Timing', `app;dur=${durationMs};desc="${name}"`);
      }

      return result;
    } catch (error) {
      const durationMs = Math.round(performance.now() - start);
      if (!(error instanceof Response)) {
        ErrorCatch({
          error,
          context: `telemetry:${name}:${ctx.request.method}`,
        });
      }
      throw error;
    }
  };
}

// In-memory token bucket for lightweight server-side rate limiting
const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiting middleware to prevent brute force or denial-of-service.
 */
export function rateLimitMiddleware(options?: {
  limit?: number;
  windowMs?: number;
}): MiddlewareFunction {
  const limit = options?.limit ?? 120; // 120 requests
  const windowMs = options?.windowMs ?? 60_000; // per 1 minute

  return async (ctx, next) => {
    const ip =
      ctx.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      ctx.request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const key = `ratelimit:${ip}`;
    const now = Date.now();
    const entry = RATE_LIMIT_STORE.get(key);

    if (!entry || now > entry.resetAt) {
      RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count += 1;
      if (entry.count > limit) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return new Response(
          JSON.stringify({
            status: 'error',
            error_message: 'Rate limit exceeded. Please try again later.',
            retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter),
            },
          }
        );
      }
    }

    return await next();
  };
}

/**
 * Wraps a React Router loader or action function with a list of middlewares.
 *
 * @example
 * export const loader = withMiddleware(
 *   [requireAuthMiddleware(), requireRoleMiddleware("admin", "editor")],
 *   async ({ request, session }) => {
 *     return { user: session, items: [] };
 *   }
 * );
 */
export function withMiddleware<TReturn = any>(
  middlewares: (MiddlewareFunction | undefined | null | false)[],
  handler: RouteHandler<MiddlewareArgs, TReturn>
) {
  const composed = composeMiddlewares(...middlewares);

  return async function wrappedRouteHandler(
    args: LoaderFunctionArgs | ActionFunctionArgs
  ): Promise<TReturn> {
    const ctx: MiddlewareContext = {
      request: args.request,
      params: args.params,
      session: null,
      user: null,
      state: {},
      startTime: Date.now(),
    };

    return (await composed(ctx, async () => {
      const mergedArgs: MiddlewareArgs = {
        ...args,
        session: ctx.session,
        user: ctx.user,
        state: ctx.state,
      };
      return await handler(mergedArgs);
    })) as TReturn;
  };
}

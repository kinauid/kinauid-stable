// Server-only — session storage for Kinau ID & Clean Core v2
import { createCookieSessionStorage, redirect } from 'react-router';
import { APP_COOKIE_NAME } from '~/constants/brand';

const sessionSecret =
  (typeof process !== 'undefined' ? process.env?.SESSION_SECRET : undefined) ||
  'kinau_secure_session_secret_default_2026_key';

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: APP_COOKIE_NAME,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [sessionSecret],
    secure: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
});

export interface SessionData {
  access_token: string;
  refresh_token: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_role: string;
}

export async function getSession(cookieHeader: string | Request | null) {
  const header = typeof cookieHeader === 'string' || cookieHeader === null 
    ? cookieHeader 
    : cookieHeader.headers.get('Cookie');
  return sessionStorage.getSession(header);
}

export async function commitSession(session: any) {
  return sessionStorage.commitSession(session);
}

export async function getSessionData(request: Request): Promise<SessionData | null> {
  const session = await getSession(request);
  const access_token = session.get('access_token') as string | undefined;
  if (!access_token) return null;

  return {
    access_token,
    refresh_token: (session.get('refresh_token') as string) || '',
    user_id: (session.get('user_id') as string) || '',
    user_email: (session.get('user_email') as string) || '',
    user_name: (session.get('user_name') as string) || '',
    user_role: (session.get('user_role') as string) || 'customer',
  };
}

export async function requireAuth(request: Request): Promise<SessionData> {
  const data = await getSessionData(request);
  if (!data) throw redirect('/login');
  return data;
}

export async function createUserSession(data: SessionData, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set('access_token', data.access_token);
  session.set('refresh_token', data.refresh_token);
  session.set('user_id', data.user_id);
  session.set('user_email', data.user_email);
  session.set('user_name', data.user_name);
  session.set('user_role', data.user_role);

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

export async function destroySession(request: Request, redirectTo = '/login') {
  const session = await getSession(request);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}

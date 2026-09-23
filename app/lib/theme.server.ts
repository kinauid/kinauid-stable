/**
 * Server-Side Cookie Theme Engine
 * Reads and sets theme cookie ('dark' | 'light') to prevent UI flash/flicker.
 */

import { DEFAULT_THEME, type Theme } from '~/utils/theme';
export * from '~/utils/theme';

/**
 * Extracts theme preference from Request Cookie header.
 */
export function getThemeFromRequest(request: Request): Theme {
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)theme=(dark|light)(?:;|$)/);
    if (match && (match[1] === 'dark' || match[1] === 'light')) {
      return match[1];
    }
  }
  return DEFAULT_THEME;
}

/**
 * Generates Set-Cookie header for theme.
 */
export function setThemeCookieHeader(theme: Theme): string {
  return `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

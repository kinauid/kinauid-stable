import React, { createElement } from 'react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { UI } from '~/builder';
import { renderLayoutAdmin } from '~/components/shared/layouts/LayoutAdmin';
import { renderLayoutPublic } from '~/components/shared/layouts/LayoutPublic';
import type { FlashMessage } from '~/lib/flash.server';

export type { NavLinkItem } from '~/components/shared/layouts/LayoutAdmin';

export interface RootLayoutProps {
  children: ReactNode;
  flash?: FlashMessage | null;
  pathname: string;
  isNavigating?: boolean;
  user?: any;
}

/** Route prefixes yang termasuk halaman publik (tanpa admin layout) */
const PUBLIC_PREFIXES = ['/', '/login', '/terms', '/_auth'];

export function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.slice(1).some((prefix) => pathname.startsWith(prefix));
}

export function renderRootLayout(props: RootLayoutProps): React.ReactElement {
  const { children, pathname, isNavigating = false, user } = props;

  if (isPublicRoute(pathname)) {
    return renderLayoutPublic({ children, isNavigating, user });
  }

  return renderLayoutAdmin({ children, pathname, isNavigating, user });
}

export function renderRootErrorBoundary(
  error: unknown,
  pathname: string = '',
  user?: any
): React.ReactElement {
  const isRouteError = typeof error === 'object' && error !== null && 'status' in error;
  const status = isRouteError ? (error as any).status : 500;
  const statusText = isRouteError ? (error as any).statusText : 'Internal Server Error';
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : status === 404
          ? 'Halaman yang Anda tuju tidak ditemukan atau URL belum terdaftar dalam sistem.'
          : 'Terjadi kesalahan tidak terduga pada sistem.';

  const currentPath =
    pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');

  const errorContent = createElement(
    'div',
    {
      className:
        'flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-5 select-none font-sans',
    },
    createElement(
      'div',
      {
        className:
          'w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs',
      },
      UI.Icon(status === 404 ? 'FileQuestion' : 'AlertTriangle', { size: 32 })
    ),
    createElement(
      'div',
      { className: 'space-y-1.5 max-w-md' },
      createElement(
        'h2',
        { className: 'text-xl font-bold text-slate-900 tracking-tight' },
        `${status} — ${statusText}`
      ),
      createElement(
        'p',
        { className: 'text-xs text-slate-600 leading-relaxed' },
        errorMessage
      )
    ),
    createElement(
      'div',
      { className: 'pt-2 flex items-center justify-center gap-3' },
      createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            if (typeof window !== 'undefined') window.history.back();
          },
          className:
            'px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer',
        },
        UI.Icon('ArrowLeft', { size: 14 }),
        'Halaman Sebelumnya'
      ),
      createElement(
        NavLink,
        {
          to: isPublicRoute(currentPath) ? '/' : '/app/dashboard',
          className:
            'px-4 py-2 bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors no-underline cursor-pointer',
        },
        UI.Icon(isPublicRoute(currentPath) ? 'Home' : 'LayoutDashboard', { size: 14 }),
        isPublicRoute(currentPath) ? 'Ke Beranda' : 'Ke Dashboard'
      )
    )
  );

  if (currentPath && !isPublicRoute(currentPath)) {
    return renderLayoutAdmin({
      children: errorContent,
      pathname: currentPath,
      isNavigating: false,
      user,
    });
  }

  return renderLayoutPublic({
    children: errorContent,
    isNavigating: false,
    user,
  });
}

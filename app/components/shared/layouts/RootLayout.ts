import React, { createElement, useEffect } from 'react';
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

/**
 * Cek apakah rute termasuk halaman publik (landing, login, artikel, public-drive, auth)
 * Sesuai arsitektur, SELAIN rute-rute publik ini, seluruh halaman WAJIB menggunakan LayoutAdmin UI Panel.
 */
export function isPublicRoute(pathname: string): boolean {
  if (!pathname || pathname === '/') return true;

  const cleanPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  if (cleanPath === '/login' || cleanPath.startsWith('/login?')) return true;
  if (cleanPath === '/articles' || cleanPath.startsWith('/articles/') || cleanPath.startsWith('/articles?')) return true;
  if (cleanPath.startsWith('/public/')) return true;
  if (cleanPath.startsWith('/_auth')) return true;
  if (cleanPath === '/katalog' || cleanPath.startsWith('/katalog/')) return true;

  return false;
}

/**
 * Cek apakah rute adalah rute internal admin panel (seluruh rute selain rute publik)
 */
export function isAdminRoute(pathname: string): boolean {
  return !isPublicRoute(pathname);
}

/**
 * Guard View ketika user tanpa session mencoba mengakses admin panel
 */
function AdminAuthGuard({ pathname }: { pathname: string }): React.ReactElement {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dest = `/login?redirectTo=${encodeURIComponent(pathname || '/app/dashboard')}`;
      const timer = setTimeout(() => {
        window.location.href = dest;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const loginUrl = `/login?redirectTo=${encodeURIComponent(pathname || '/app/dashboard')}`;

  return createElement(
    'div',
    {
      className:
        'min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF4FB] to-[#E2E8F0] flex items-center justify-center p-6 select-none font-sans',
    },
    createElement(
      'div',
      {
        className:
          'bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center space-y-6',
      },
      createElement(
        'div',
        {
          className:
            'w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs',
        },
        UI.Icon('ShieldAlert', { size: 32 })
      ),
      createElement(
        'div',
        { className: 'space-y-2' },
        createElement(
          'h2',
          { className: 'text-xl font-bold text-slate-900 tracking-tight' },
          'Sesi Login Diperlukan'
        ),
        createElement(
          'p',
          { className: 'text-xs text-slate-600 leading-relaxed' },
          'Area ini khusus untuk operasional staf internal Kinau ID. Anda belum login atau sesi telah berakhir.'
        )
      ),
      createElement(
        'div',
        { className: 'pt-2 flex flex-col gap-2.5' },
        createElement(
          NavLink,
          {
            to: loginUrl,
            className:
              'w-full py-2.5 px-4 bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 no-underline cursor-pointer',
          },
          UI.Icon('LogIn', { size: 14 }),
          'Masuk ke Akun Staf (Login)'
        ),
        createElement(
          NavLink,
          {
            to: '/',
            className:
              'w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 no-underline cursor-pointer',
          },
          UI.Icon('Home', { size: 14 }),
          'Kembali ke Beranda'
        )
      )
    )
  );
}

/**
 * Guard View ketika customer role mencoba mengakses panel staf internal
 */
function CustomerRoleGuard(): React.ReactElement {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        window.location.href = '/customer/orders';
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return createElement(
    'div',
    {
      className:
        'min-h-screen bg-slate-50 flex items-center justify-center p-6 select-none font-sans',
    },
    createElement(
      'div',
      {
        className:
          'bg-white border border-slate-200 rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-5',
      },
      createElement(
        'div',
        {
          className:
            'w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto',
        },
        UI.Icon('ShieldX', { size: 28 })
      ),
      createElement(
        'div',
        { className: 'space-y-1.5' },
        createElement(
          'h2',
          { className: 'text-lg font-bold text-slate-900' },
          'Akses Terbatas'
        ),
        createElement(
          'p',
          { className: 'text-xs text-slate-500 leading-relaxed' },
          'Akun Anda terdaftar sebagai Pelanggan (Customer) dan tidak memiliki otorisasi untuk mengakses panel staf operasional.'
        )
      ),
      createElement(
        NavLink,
        {
          to: '/customer/orders',
          className:
            'inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#103557] hover:bg-[#164e78] text-white text-xs font-bold rounded-xl no-underline cursor-pointer',
        },
        UI.Icon('Package', { size: 14 }),
        'Buka Portal Pesanan Saya'
      )
    )
  );
}

export function renderRootLayout(props: RootLayoutProps): React.ReactElement {
  const { children, pathname, isNavigating = false, user } = props;

  // 1. Jika rute publik (landing, artikel, login, terms, katalog, customizer, dll), gunakan LayoutPublic TANPA admin sidebar
  if (isPublicRoute(pathname)) {
    return renderLayoutPublic({ children, isNavigating, user });
  }

  // 2. Jika rute admin, wajib verifikasi sesi staf:
  const hasValidSession = Boolean(
    user && (user.user_id || user.id || user.user_email || user.email)
  );

  if (!hasValidSession) {
    return renderLayoutPublic({
      children: createElement(AdminAuthGuard, { pathname }),
      isNavigating,
      user: null,
    });
  }

  const role = String(user?.user_role || user?.role || '').toLowerCase();
  if (role === 'customer') {
    return renderLayoutPublic({
      children: createElement(CustomerRoleGuard, null),
      isNavigating,
      user,
    });
  }

  // 3. Render Admin Layout khusus staf internal terotentikasi
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

  const hasValidSession = Boolean(
    user && (user.user_id || user.id || user.user_email || user.email)
  );

  if (isAdminRoute(currentPath) && hasValidSession) {
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

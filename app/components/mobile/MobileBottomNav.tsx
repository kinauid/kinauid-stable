import React, { createElement } from 'react';
import { NavLink } from 'react-router';
import { UI } from '~/builder';

export interface MobileBottomNavProps {
  pathname: string;
}

/**
 * Dedicated Mobile Bottom Navigation Bar (Overview | Pesanan | Setting)
 * Automatically hidden on detail pages & 2x children routes (e.g. /app/order-manage, /app/order-form, /app/setting/design, etc.)
 */
export function MobileBottomNav({ pathname }: MobileBottomNavProps) {
  const cleanPath = pathname.split('?')[0];
  const segments = cleanPath.split('/').filter(Boolean);

  // Hide on detail pages, form pages, and 2x level child routes
  const isDetailPage =
    cleanPath.startsWith('/app/order-manage') ||
    cleanPath.startsWith('/app/order-form') ||
    cleanPath.startsWith('/app/setting/design') ||
    cleanPath.includes('/detail') ||
    cleanPath.startsWith('/customer/configure') ||
    segments.length >= 3;

  if (isDetailPage) {
    return null;
  }

  const isOverviewActive = cleanPath === '/app/dashboard' || cleanPath === '/app';
  const isPesananActive =
    cleanPath === '/app/order-list' || cleanPath === '/app/order-history' || cleanPath === '/app/print-area';
  const isProfilActive = cleanPath === '/app/profile';

  return createElement(
    'nav',
    {
      className:
        'fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-6 py-2 flex items-center justify-around md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)] select-none',
    },
    // Item 1: Overview
    createElement(
      NavLink,
      {
        to: '/app/dashboard',
        className: () =>
          `flex flex-col items-center justify-center gap-1 transition-all no-underline ${
            isOverviewActive
              ? 'text-[#103557] font-black'
              : 'text-slate-400 hover:text-slate-700 font-medium'
          }`,
      },
      createElement(
        'div',
        {
          className: `p-1.5 rounded-xl transition-all ${
            isOverviewActive
              ? 'bg-[#103557]/10 text-[#103557]'
              : 'text-slate-400'
          }`,
        },
        UI.Icon('LayoutDashboard', { size: 20 })
      ),
      createElement(
        'span',
        { className: 'text-[10px] tracking-tight leading-none' },
        'Overview'
      )
    ),
    // Item 2: Pesanan
    createElement(
      NavLink,
      {
        to: '/app/order-list',
        className: () =>
          `flex flex-col items-center justify-center gap-1 transition-all no-underline ${
            isPesananActive
              ? 'text-[#103557] font-black'
              : 'text-slate-400 hover:text-slate-700 font-medium'
          }`,
      },
      createElement(
        'div',
        {
          className: `p-1.5 rounded-xl transition-all ${
            isPesananActive
              ? 'bg-[#103557]/10 text-[#103557]'
              : 'text-slate-400'
          }`,
        },
        UI.Icon('FileText', { size: 20 })
      ),
      createElement(
        'span',
        { className: 'text-[10px] tracking-tight leading-none' },
        'Pesanan'
      )
    ),
    // Item 3: Profil
    createElement(
      NavLink,
      {
        to: '/app/profile',
        className: () =>
          `flex flex-col items-center justify-center gap-1 transition-all no-underline ${
            isProfilActive
              ? 'text-[#103557] font-black'
              : 'text-slate-400 hover:text-slate-700 font-medium'
          }`,
      },
      createElement(
        'div',
        {
          className: `p-1.5 rounded-xl transition-all ${
            isProfilActive
              ? 'bg-[#103557]/10 text-[#103557]'
              : 'text-slate-400'
          }`,
        },
        UI.Icon('User', { size: 20 })
      ),
      createElement(
        'span',
        { className: 'text-[10px] tracking-tight leading-none' },
        'Profil'
      )
    )
  );
}

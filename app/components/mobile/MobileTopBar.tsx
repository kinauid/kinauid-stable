import React, { createElement, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { UI, modals } from '~/builder';
import { BRAND_NAME } from '~/constants/brand';

export interface MobileTopBarProps {
  pathname: string;
  user?: any;
  onOpenProfile?: () => void;
  activeTitle?: string;
  activeGroupTitle?: string;
  onSearchClick?: () => void;
  onFilterClick?: () => void;
}

/**
 * Dedicated Mobile Top Bar Component (App-Like Native UX)
 * Dynamically adapts according to current route:
 * 1. Overview/Dashboard: Brand Logo + Action Icons (Search, Bell, Avatar)
 * 2. Listing/Table Pages: Big Page Title + Search Icon + Filter Icon + Avatar
 * 3. Detail/Form Pages: Back Button (<) + Centered Page Title + More Options (...) [NO Profile Avatar]
 */
export function MobileTopBar({
  pathname,
  user,
  onOpenProfile,
  activeTitle,
  activeGroupTitle,
  onSearchClick,
  onFilterClick,
}: MobileTopBarProps) {
  const navigate = useNavigate();
  const [detailMenuOpen, setDetailMenuOpen] = useState(false);

  const cleanPath = pathname.split('?')[0];
  const isOverview = cleanPath === '/app/dashboard' || cleanPath === '/app';
  const isProfile = cleanPath === '/app/profile';
  const isDetailPage =
    cleanPath.startsWith('/app/order-manage') ||
    cleanPath.includes('/detail') ||
    cleanPath === '/app/order-form' ||
    cleanPath.startsWith('/app/setting/design');

  const avatarInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.user_name
    ? user.user_name.charAt(0).toUpperCase()
    : 'K';

  // Format dynamic title if not explicitly provided
  const pageTitle =
    activeTitle ||
    (cleanPath.startsWith('/app/order-list')
      ? 'Orders'
      : cleanPath.startsWith('/app/order-history')
      ? 'Riwayat Pesanan'
      : cleanPath.startsWith('/app/order-manage')
      ? 'Order Details'
      : cleanPath.startsWith('/app/order-form')
      ? 'Input Pesanan'
      : cleanPath.startsWith('/app/setting/design')
      ? 'Custom Desain'
      : cleanPath.startsWith('/app/print-area')
      ? 'Area Cetak'
      : cleanPath.startsWith('/app/finance')
      ? 'Keuangan'
      : cleanPath.startsWith('/app/profile')
      ? 'Profile'
      : cleanPath.startsWith('/dashboard/admin')
      ? 'Pengaturan Sistem'
      : 'Kinau ID');

  // Case 0: Profile Page (Ref UX: Centered / Clean "Profile" Top Bar)
  if (isProfile) {
    return createElement(
      'header',
      {
        className:
          'flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]',
      },
      createElement(
        'h1',
        { className: 'text-base font-black text-slate-900 tracking-tight' },
        'Profile'
      ),
      createElement(
        'div',
        { className: 'text-xs text-slate-400 font-medium' },
        BRAND_NAME
      )
    );
  }

  // Case 1: Overview / Beranda Page (Brand Logo + Quick Actions)
  if (isOverview) {
    return createElement(
      'header',
      {
        className:
          'flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]',
      },
      // Left: Brand Logo (Matching Kinau Sidebar Logo)
      createElement(
        NavLink,
        {
          to: '/app/dashboard',
          className: 'flex items-center no-underline cursor-pointer group py-0.5 min-w-0',
        },
        createElement(
          'div',
          {
            className: 'h-8 max-w-[140px] flex items-center justify-start overflow-hidden',
          },
          createElement('img', {
            src: '/kinau-logo.png',
            alt: BRAND_NAME,
            className: 'h-7 w-auto object-contain',
          })
        )
      ),

      // Right: Actions (Search, Notification, Avatar)
      createElement(
        'div',
        { className: 'flex items-center gap-1.5' },
        // Action 1: Search / Quick Menu
        createElement(
          'button',
          {
            type: 'button',
            onClick: onSearchClick || (() => navigate('/app/order-list')),
            'aria-label': 'Pencarian',
            className:
              'p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer',
          },
          UI.Icon('Search', { size: 18 })
        ),
        // Action 2: Notifications
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => alert('Belum ada notifikasi baru hari ini.'),
            'aria-label': 'Notifikasi',
            className:
              'p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer relative',
          },
          UI.Icon('Bell', { size: 18 }),
          createElement('span', {
            className:
              'absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white',
          })
        ),
        // Action 3: User Avatar
        createElement(
          'button',
          {
            type: 'button',
            onClick: onOpenProfile,
            'aria-label': 'Profil Pengguna',
            className:
              'w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs hover:ring-2 hover:ring-[#103557]/30 transition-all cursor-pointer ml-1',
          },
          avatarInitial
        )
      )
    );
  }

  // Case 2: Detail / Form / Manage Pages (Ref Page 3 Header: < | Order Details | ... [WITHOUT AVATAR])
  if (isDetailPage) {
    return createElement(
      'header',
      {
        className:
          'flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]',
      },
      // Left: Circular Back Button
      createElement(
        'button',
        {
          type: 'button',
          onClick: () => (window.history.length > 1 ? navigate(-1) : navigate('/app/order-list')),
          'aria-label': 'Kembali',
          className:
            'p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center',
        },
        UI.Icon('ArrowLeft', { size: 19 })
      ),

      // Center: Page Title (Order Details)
      createElement(
        'div',
        { className: 'flex-1 text-center px-2 min-w-0' },
        createElement(
          'h1',
          { className: 'text-sm font-black text-slate-900 truncate' },
          pageTitle === 'Detail Pesanan' ? 'Order Details' : pageTitle
        ),
        activeGroupTitle
          ? createElement(
              'p',
              { className: 'text-[10px] text-slate-400 font-medium truncate' },
              activeGroupTitle
            )
          : null
      ),

      // Right: More Options Action Button (No Profile Avatar)
      createElement(
        'div',
        { className: 'relative shrink-0' },
        createElement(
          'button',
          {
            type: 'button',
            onClick: () => setDetailMenuOpen(!detailMenuOpen),
            'aria-label': 'Pilihan Opsi',
            className:
              'p-2 -mr-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer',
          },
          UI.Icon('MoreHorizontal', { size: 20 })
        ),
        detailMenuOpen
          ? createElement(
              'div',
              { className: 'absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 text-xs divide-y divide-slate-100' },
              createElement(
                'button',
                {
                  type: 'button',
                  onClick: () => {
                    setDetailMenuOpen(false);
                    navigate('/app/order-list');
                  },
                  className: 'w-full text-left px-3.5 py-2 hover:bg-slate-50 font-bold text-slate-800 flex items-center gap-2 cursor-pointer',
                },
                UI.Icon('FileText', { size: 14, className: 'text-blue-600' }),
                'Daftar Semua Pesanan'
              ),
              createElement(
                'button',
                {
                  type: 'button',
                  onClick: () => {
                    setDetailMenuOpen(false);
                    if (navigator.share) {
                      navigator.share({ title: 'Kinau ID Order', url: window.location.href }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link pesanan berhasil disalin!');
                    }
                  },
                  className: 'w-full text-left px-3.5 py-2 hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2 cursor-pointer',
                },
                UI.Icon('Share2', { size: 14, className: 'text-orange-600' }),
                'Bagikan Link Pesanan'
              )
            )
          : null
      )
    );
  }

  // Case 3: Listing / Management Pages (Ref Page 2: Orders Title + Search + Filter + Avatar)
  return createElement(
    'header',
    {
      className:
        'flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]',
    },
    // Left: Page Title
    createElement(
      'div',
      { className: 'min-w-0 pr-2' },
      createElement(
        'h1',
        { className: 'text-lg font-black text-slate-900 tracking-tight leading-tight truncate' },
        pageTitle
      )
    ),

    // Right: Actions (Search, Filter, Avatar)
    createElement(
      'div',
      { className: 'flex items-center gap-1.5 shrink-0' },
      // Action 1: Search
      createElement(
        'button',
        {
          type: 'button',
          onClick: onSearchClick,
          'aria-label': 'Cari data',
          className:
            'p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer',
        },
        UI.Icon('Search', { size: 18 })
      ),
      // Action 2: Filter
      createElement(
        'button',
        {
          type: 'button',
          onClick: onFilterClick,
          'aria-label': 'Filter data',
          className:
            'p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer',
        },
        UI.Icon('SlidersHorizontal', { size: 18 })
      ),
      // Action 3: User Avatar
      createElement(
        'button',
        {
          type: 'button',
          onClick: onOpenProfile,
          'aria-label': 'Profil Pengguna',
          className:
            'w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs hover:ring-2 hover:ring-[#103557]/30 transition-all cursor-pointer ml-1',
        },
        avatarInitial
      )
    )
  );
}

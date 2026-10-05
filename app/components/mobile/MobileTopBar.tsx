import React, { createElement, useState, useMemo, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router';
import { UI, modals } from '~/builder';
import { BRAND_NAME } from '~/constants/brand';
import { decryptCompactState, buildEncryptedUrl } from '~/utils/cryptoState';

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
 * 2. Listing/Table Pages: Big Page Title + TopBar Search (Expandable Inline Search) + Filter Icon (with Badge) + Avatar
 * 3. Detail/Form Pages: Back Button (<) + Centered Page Title + Dynamic Order Subtitle + More Options (...) [NO Profile Avatar]
 * 4. Profile Page: Clean Native TopBar with Back Button + Centered Profile Title
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
  const location = useLocation();
  const [detailMenuOpen, setDetailMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cleanPath = pathname.split('?')[0];
  const isOverview = cleanPath === '/app/dashboard' || cleanPath === '/app';
  const isProfile = cleanPath === '/app/profile';
  const isDetailPage =
    cleanPath.startsWith('/app/order-manage') ||
    cleanPath.includes('/detail') ||
    cleanPath === '/app/order-form' ||
    cleanPath.startsWith('/app/order-edit') ||
    cleanPath.startsWith('/app/setting/design');

  const avatarInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.user_name
    ? user.user_name.charAt(0).toUpperCase()
    : 'K';

  // Extract query from URL state
  const decryptedQueryState = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const searchParams = new URLSearchParams(window.location.search);
    const q = searchParams.get('q');
    if (q) {
      return decryptCompactState<any>(q) || {};
    }
    const result: any = {};
    for (const [k, v] of searchParams.entries()) {
      result[k] = v;
    }
    return result;
  }, [pathname, location.search]);

  const [searchValue, setSearchValue] = useState(decryptedQueryState.search || '');

  // Keep search input synced when URL query changes
  useEffect(() => {
    setSearchValue(decryptedQueryState.search || '');
  }, [decryptedQueryState.search]);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Compute active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (decryptedQueryState.status && decryptedQueryState.status !== 'all') count++;
    if (decryptedQueryState.payment_status && decryptedQueryState.payment_status !== 'all') count++;
    if (decryptedQueryState.year) count++;
    if (decryptedQueryState.category && decryptedQueryState.category !== 'all') count++;
    if (decryptedQueryState.kkn_institution) count++;
    return count;
  }, [decryptedQueryState]);

  const handleExecuteSearch = (query: string) => {
    const nextState = { ...decryptedQueryState, search: query, page: 1 };
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('MOBILE_SEARCH_SUBMIT', { detail: { search: query } }));
    }
    const targetUrl = buildEncryptedUrl(cleanPath, nextState);
    navigate(targetUrl);
  };

  // Dynamic order identifier extraction for detail pages
  const dynamicOrderSubtitle = useMemo(() => {
    if (typeof window === 'undefined') return activeGroupTitle;
    if (cleanPath.startsWith('/app/order-manage')) {
      const searchParams = new URLSearchParams(window.location.search);
      const q = searchParams.get('q');
      if (q) {
        const dec = decryptCompactState<{ id?: string; order_number?: string }>(q);
        if (dec?.order_number) return `#${dec.order_number}`;
        if (dec?.id) return `#ORD-${dec.id}`;
      }
      const rawId = searchParams.get('id') || searchParams.get('order_number');
      if (rawId) return `#ORD-${rawId}`;
    }
    return activeGroupTitle;
  }, [cleanPath, activeGroupTitle]);

  // Format dynamic title if not explicitly provided
  const pageTitle =
    (cleanPath.startsWith('/app/order-manage')
      ? 'Order Details'
      : activeTitle ||
        (cleanPath.startsWith('/app/order-list')
          ? 'Orders'
          : cleanPath.startsWith('/app/order-history')
          ? 'Riwayat Pesanan'
          : cleanPath.startsWith('/app/order-form')
          ? 'Input Pesanan'
          : cleanPath.startsWith('/app/order-edit')
          ? 'Edit Pesanan'
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
          : 'Kinau ID'));

  // Case 0: Profile Page (Ref UX: Native Back Button + Centered Title)
  if (isProfile) {
    return (
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white dark:bg-[#103557] border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors">
        {/* Left: Back Button */}
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/app/dashboard'))}
          aria-label="Kembali"
          className="p-2 -ml-1 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
        >
          {UI.Icon('ArrowLeft', { size: 19 })}
        </button>
        {/* Center: Profile Title */}
        <div className="flex-1 text-center px-2 min-w-0">
          <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            Profile
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-300 font-medium truncate">
            {user?.role ? `Akun ${user.role.toUpperCase()}` : BRAND_NAME}
          </p>
        </div>
        {/* Right: Secure Badge */}
        <div className="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-slate-300">
          {UI.Icon('ShieldCheck', { size: 18, className: 'text-emerald-500' })}
        </div>
      </header>
    );
  }

  // Case 1: Overview / Beranda Page (Brand Logo + Quick Actions)
  if (isOverview) {
    return (
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white dark:bg-[#103557] border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors">
        {/* Left: Brand Logo */}
        <NavLink
          to="/app/dashboard"
          className="flex items-center no-underline cursor-pointer group py-0.5 min-w-0"
        >
          <div className="h-8 max-w-[140px] flex items-center justify-start overflow-hidden">
            <img
              src="/kinau-logo.png"
              alt={BRAND_NAME}
              className="h-7 w-auto object-contain"
            />
          </div>
        </NavLink>

        {/* Right: Actions (Search, Notification, Avatar) */}
        <div className="flex items-center gap-1.5">
          {/* Action 1: Search / Quick Menu */}
          <button
            type="button"
            onClick={onSearchClick || (() => navigate('/app/order-list'))}
            aria-label="Pencarian"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {UI.Icon('Search', { size: 18 })}
          </button>
          {/* Action 2: Notifications */}
          <button
            type="button"
            onClick={() => alert('Belum ada notifikasi baru hari ini.')}
            aria-label="Notifikasi"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer relative"
          >
            {UI.Icon('Bell', { size: 18 })}
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>
          {/* Action 3: User Avatar */}
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Profil Pengguna"
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs hover:ring-2 hover:ring-[#103557]/30 transition-all cursor-pointer ml-1"
          >
            {avatarInitial}
          </button>
        </div>
      </header>
    );
  }

  // Case 2: Detail / Form / Manage Pages (Ref Page 3 Header: < | Order Details | ... [WITHOUT AVATAR])
  if (isDetailPage) {
    return (
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white dark:bg-[#103557] border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors">
        {/* Left: Circular Back Button */}
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/app/order-list'))}
          aria-label="Kembali"
          className="p-2 -ml-1 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
        >
          {UI.Icon('ArrowLeft', { size: 19 })}
        </button>

        {/* Center: Page Title (Order Details) */}
        <div className="flex-1 text-center px-2 min-w-0">
          <h1 className="text-sm font-black text-slate-900 dark:text-white truncate">
            {pageTitle === 'Detail Pesanan' ? 'Order Details' : pageTitle}
          </h1>
          {dynamicOrderSubtitle && (
            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium truncate">
              {dynamicOrderSubtitle}
            </p>
          )}
        </div>

        {/* Right: More Options Action Button (No Profile Avatar) */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setDetailMenuOpen(!detailMenuOpen)}
            aria-label="Pilihan Opsi"
            className="p-2 -mr-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {UI.Icon('MoreHorizontal', { size: 20 })}
          </button>
          {detailMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#103557] rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-700 py-1.5 z-40 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDetailMenuOpen(false);
                  navigate('/app/order-list');
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-800 dark:text-white flex items-center gap-2 cursor-pointer"
              >
                {UI.Icon('FileText', { size: 14, className: 'text-blue-600' })}
                Daftar Semua Pesanan
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailMenuOpen(false);
                  if (navigator.share) {
                    navigator.share({ title: 'Kinau ID Order', url: window.location.href }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link pesanan berhasil disalin!');
                  }
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
              >
                {UI.Icon('Share2', { size: 14, className: 'text-orange-600' })}
                Bagikan Link Pesanan
              </button>
            </div>
          )}
        </div>
      </header>
    );
  }

  // Case 3: Listing / Management Pages
  if (searchOpen) {
    return (
      <header className="flex md:hidden items-center justify-between px-3 py-2.5 bg-white dark:bg-[#103557] border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors gap-2">
        <button
          type="button"
          onClick={() => setSearchOpen(false)}
          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          aria-label="Tutup pencarian"
        >
          {UI.Icon('ArrowLeft', { size: 19 })}
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteSearch(searchValue);
          }}
          className="flex-1 relative flex items-center"
        >
          <div className="absolute left-3 text-slate-400">
            {UI.Icon('Search', { size: 15 })}
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Cari pesanan, instansi, PIC..."
            className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-[#103557] focus:ring-1 focus:ring-[#103557] text-slate-900 dark:text-white"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue('');
                handleExecuteSearch('');
              }}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              {UI.Icon('X', { size: 14 })}
            </button>
          )}
        </form>

        <button
          type="button"
          onClick={() => handleExecuteSearch(searchValue)}
          className="px-3 py-2 bg-[#103557] hover:bg-[#0c2842] text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0 shadow-2xs"
        >
          Cari
        </button>
      </header>
    );
  }

  return (
    <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white dark:bg-[#103557] border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors">
      {/* Left: Page Title */}
      <div className="min-w-0 pr-2">
        <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
          {pageTitle}
        </h1>
        {decryptedQueryState.search ? (
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">
            Cari: "{decryptedQueryState.search}"
          </p>
        ) : null}
      </div>

      {/* Right: Actions (Search, Filter, Avatar) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Action 1: Search Button (opens inline topbar search) */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Cari data"
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            decryptedQueryState.search
              ? 'bg-blue-50 text-[#103557] border border-blue-200'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          {UI.Icon('Search', { size: 18 })}
        </button>

        {/* Action 2: Filter Button (with badge count) */}
        <button
          type="button"
          onClick={onFilterClick}
          aria-label="Filter data"
          className={`p-2 rounded-xl transition-colors cursor-pointer relative ${
            activeFiltersCount > 0
              ? 'bg-[#103557] text-white'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          {UI.Icon('SlidersHorizontal', { size: 18 })}
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Action 3: User Avatar */}
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label="Profil Pengguna"
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-600 dark:from-sky-600 dark:to-blue-800 text-white font-bold text-xs flex items-center justify-center shadow-2xs hover:ring-2 hover:ring-[#103557]/30 transition-all cursor-pointer ml-1"
        >
          {avatarInitial}
        </button>
      </div>
    </header>
  );
}

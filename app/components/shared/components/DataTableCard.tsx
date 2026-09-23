import React, { useState, useEffect, useMemo, createElement, type ReactNode } from 'react';
import { useHydrated, useIsMobile } from '~/builder/hooks';
import { renderIcon as Icon } from '~/builder/components';
import { Badge } from '~/components/core/Badge';
import { cn } from '~/lib/utils';
import { TableActionGroup, TableActionButton } from '~/components/core/TableActionGroup';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface TableStatItem {
  label: string;
  value: string | number;
  icon?: string;
  color?: 'amber' | 'cyan' | 'green' | 'blue' | 'rose' | 'purple' | 'slate' | 'emerald';
  trend?: string;
  badge?: string;
  description?: string;
  subtext?: string;
  onClick?: () => void;
}

export interface TableMainAction {
  action?: 'add' | 'create' | 'export' | 'import' | 'sync' | 'verify' | 'custom';
  label?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'gradient';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export interface TableTabItem {
  id?: string;
  key?: string;
  label: string;
  count?: number;
  icon?: string;
  badgeVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface TableActionItem {
  id?: string;
  label?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'gradient';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export interface ActiveFilterItem {
  key: string;
  label: string;
  value: string;
  onRemove?: () => void;
}

export interface TableBannerConfig {
  title?: ReactNode;
  description?: ReactNode;
  icon?: string;
  action?: ReactNode;
  variant?: 'info' | 'warning' | 'success' | 'neutral';
  className?: string;
}

export interface DataTableCardColumn<T = any> {
  id?: string | number;
  name?: ReactNode;
  header?: ReactNode;
  key?: string;
  selector?: (row: T, rowIndex?: number) => any;
  cell?: (row: T, rowIndex?: number) => ReactNode;
  accessor?: (row: T, rowIndex?: number) => ReactNode;
  sortable?: boolean;
  sortField?: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  center?: boolean;
  right?: boolean;
  grow?: number;
  wrap?: boolean;
  freeze?: 'left' | 'right';
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableCardProps<T = any> {
  // 1. Statistics Cards Section (Rendered inside card under Title/Subtitle)
  stats?: TableStatItem[];

  // 2. Title & Description
  title?: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  totalItems?: number;
  totalBadgeLabel?: string;
  headerRight?: ReactNode;

  // 3. Info / Notice Banner (like BAAK shield banner)
  banner?: TableBannerConfig;
  bannerIcon?: string;
  bannerText?: ReactNode;

  // 4. Tab Filter Navigation
  tabs?: TableTabItem[];
  activeTab?: string;
  onTabChange?: (tabKey: string) => void;

  // 5. Search & Main Action Toolbar
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: () => void;

  // 6. Main Action Buttons (rendered to the left of Filter button)
  mainActions?: TableMainAction[];

  // 7. Filter Button & Active Filter Bar
  showFilterButton?: boolean;
  filterButtonLabel?: string;
  activeFilterCount?: number;
  onFilterClick?: () => void;
  filterActive?: boolean;
  activeFilters?: ActiveFilterItem[];
  onResetFilters?: () => void;

  // 8. Secondary Actions / Custom Toolbar
  actions?: TableActionItem[];
  customToolbar?: ReactNode;

  // 9. Checkbox Selection
  selectable?: boolean;
  selectableRows?: boolean;
  selectedRows?: T[];
  onSelectedRowsChange?: (selected: { allSelected: boolean; selectedCount: number; selectedRows: T[] }) => void;
  clearSelectedRows?: boolean;
  keyField?: string | ((row: T) => string);

  // 10. Columns & Data
  columns: DataTableCardColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyText?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  striped?: boolean;
  highlightOnHover?: boolean;
  dense?: boolean;
  onRowClick?: (row: T) => void;

  // 11. Freeze / Sticky Columns Config
  freezeLeftColumnsCount?: number;
  freezeRightColumnsCount?: number;

  // 12. Mobile View
  enableMobileCards?: boolean;
  renderMobileCard?: (row: T, index: number) => ReactNode;

  // 13. Pagination Controls
  pagination?: boolean;
  paginationServer?: boolean;
  page?: number;
  pageSize?: number;
  totalRows?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  // 14. Styling
  className?: string;
}

// ============================================================================
// DataTableCard Component Implementation
// Pure Tailwind Native Table Engine (100% Anti-Hydration & SSR Safe)
// ============================================================================

export function DataTableCard<T = any>(props: DataTableCardProps<T>): React.ReactElement {
  const {
    stats,
    title,
    subtitle,
    description,
    totalItems,
    totalBadgeLabel,
    headerRight,
    banner,
    bannerIcon = 'ShieldCheck',
    bannerText,
    tabs,
    activeTab,
    onTabChange,
    showSearch = true,
    searchPlaceholder = 'Cari data...',
    searchValue = '',
    onSearchChange,
    onSearchSubmit,
    mainActions = [],
    showFilterButton = true,
    filterButtonLabel = 'Filter',
    activeFilterCount = 0,
    onFilterClick,
    filterActive = false,
    activeFilters = [],
    onResetFilters,
    actions = [],
    customToolbar,
    selectable = false,
    selectableRows = false,
    selectedRows: controlledSelectedRows = [],
    onSelectedRowsChange,
    clearSelectedRows = false,
    keyField = 'id',
    columns = [],
    data = [],
    isLoading = false,
    emptyText = 'Tidak ada data',
    emptySubtitle = 'Belum ada data pada tahap atau kriteria filter ini',
    emptyIcon = 'Search',
    striped = true,
    highlightOnHover = true,
    dense = false,
    onRowClick,
    freezeLeftColumnsCount = 0,
    freezeRightColumnsCount = 0,
    enableMobileCards = true,
    renderMobileCard,
    pagination = true,
    paginationServer = false,
    page = 1,
    pageSize = 10,
    totalRows,
    pageSizeOptions = [10, 25, 50, 100],
    onPageChange,
    onPageSizeChange,
    className = '',
  } = props;

  // Hydration & Screen state
  const isHydrated = useHydrated();
  const isMobile = useIsMobile(768);
  const [internalSearch, setInternalSearch] = useState(searchValue);
  const [internalPage, setInternalPage] = useState(page);
  const [internalPageSize, setInternalPageSize] = useState(pageSize);
  const [sortColumnKey, setSortColumnKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    setInternalSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    setInternalPage(page);
  }, [page]);

  useEffect(() => {
    setInternalPageSize(pageSize);
  }, [pageSize]);

  useEffect(() => {
    if (clearSelectedRows) {
      setSelectedRowKeys(new Set());
    }
  }, [clearSelectedRows]);

  const resolvedSubtitle = subtitle || description;
  const isSelectable = selectable || selectableRows;
  const resolvedTotal = totalRows !== undefined ? totalRows : totalItems !== undefined ? totalItems : data.length;

  // Helper to extract row key
  const getRowKey = (row: T, index: number): string | number => {
    if (typeof keyField === 'function') return keyField(row);
    if (typeof keyField === 'string' && (row as any)?.[keyField] !== undefined) {
      return (row as any)[keyField];
    }
    return (row as any)?.id || (row as any)?.uid || index;
  };

  // Sort & Paginate data for client-side mode
  const processedData = useMemo(() => {
    let result = [...data];

    // Client-side sort if active and not server paginated
    if (sortColumnKey && !paginationServer) {
      const col = columns.find((c) => (c.key || c.id) === sortColumnKey);
      if (col) {
        result.sort((a, b) => {
          const valA = col.selector ? col.selector(a) : (a as any)[sortColumnKey];
          const valB = col.selector ? col.selector(b) : (b as any)[sortColumnKey];
          if (valA === valB) return 0;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          const cmp = valA > valB ? 1 : -1;
          return sortDirection === 'asc' ? cmp : -cmp;
        });
      }
    }

    // Client-side pagination if active and not paginationServer
    if (pagination && !paginationServer) {
      const start = (internalPage - 1) * internalPageSize;
      const end = start + internalPageSize;
      return result.slice(start, end);
    }

    return result;
  }, [data, sortColumnKey, sortDirection, pagination, paginationServer, internalPage, internalPageSize, columns]);

  // Handle Sort Toggle
  const handleSort = (col: DataTableCardColumn<T>) => {
    const key = (col.key || col.id || '') as string;
    if (!col.sortable || !key) return;

    if (sortColumnKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumnKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumnKey(key);
      setSortDirection('asc');
    }
  };

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const nextSet = new Set<string | number>();
    if (checked) {
      data.forEach((row, i) => nextSet.add(getRowKey(row, i)));
    }
    setSelectedRowKeys(nextSet);
    if (onSelectedRowsChange) {
      onSelectedRowsChange({
        allSelected: checked,
        selectedCount: nextSet.size,
        selectedRows: checked ? data : [],
      });
    }
  };

  const handleSelectRow = (row: T, index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const key = getRowKey(row, index);
    const nextSet = new Set(selectedRowKeys);
    if (nextSet.has(key)) {
      nextSet.delete(key);
    } else {
      nextSet.add(key);
    }
    setSelectedRowKeys(nextSet);

    if (onSelectedRowsChange) {
      const selected = data.filter((r, i) => nextSet.has(getRowKey(r, i)));
      onSelectedRowsChange({
        allSelected: nextSet.size === data.length && data.length > 0,
        selectedCount: nextSet.size,
        selectedRows: selected,
      });
    }
  };

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalSearch(val);
    if (onSearchChange) onSearchChange(val);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const totalPages = Math.max(1, Math.ceil(resolvedTotal / internalPageSize));
  const startRow = resolvedTotal === 0 ? 0 : (internalPage - 1) * internalPageSize + 1;
  const endRow = Math.min(resolvedTotal, internalPage * internalPageSize);

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setInternalPage(clamped);
    if (onPageChange) onPageChange(clamped);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value) || 10;
    setInternalPageSize(newSize);
    setInternalPage(1);
    if (onPageSizeChange) onPageSizeChange(newSize);
    if (onPageChange) onPageChange(1);
  };

  const hasStats = Boolean(stats && stats.length > 0);
  const hasHeader = Boolean(title || resolvedSubtitle || totalItems !== undefined || headerRight);
  const hasBanner = Boolean(banner || bannerText);
  const hasTabs = Boolean(tabs && tabs.length > 0);
  const hasActiveFilters = Boolean(activeFilters && activeFilters.length > 0);

  return createElement(
    'div',
    {
      className: cn(
        'bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col',
        className
      ),
    },
    // ── 1. HEADER SECTION ──
    hasHeader
      ? createElement(
          'div',
          { className: 'px-5 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap' },
          createElement(
            'div',
            { className: 'space-y-0.5' },
            title
              ? createElement('h2', { className: 'text-base md:text-lg font-bold text-slate-900 leading-tight' }, title)
              : null,
            resolvedSubtitle
              ? createElement('p', { className: 'text-xs md:text-sm text-slate-500' }, resolvedSubtitle)
              : null
          ),
          createElement(
            'div',
            { className: 'flex items-center gap-2' },
            totalItems !== undefined
              ? createElement(
                  Badge,
                  {
                    label: totalBadgeLabel || `Total: ${totalItems} data`,
                    variant: 'secondary',
                    className: 'bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-1 font-semibold rounded-full',
                  }
                )
              : null,
            headerRight
          )
        )
      : null,

    // ── 2. SEAMLESS DIVIDED STATS RIBBON (Inside Card, below Title/Subtitle) ──
    hasStats
      ? createElement(
          'div',
          {
            className: cn(
              'border-b border-slate-100 bg-slate-50/40 grid grid-cols-1 divide-y sm:divide-y-0 divide-slate-100/90',
              stats!.length === 2
                ? 'sm:grid-cols-2 sm:divide-x'
                : stats!.length === 4
                ? 'sm:grid-cols-2 lg:grid-cols-4 sm:divide-x'
                : 'sm:grid-cols-3 sm:divide-x'
            ),
          },
          stats!.map((stat, idx) =>
            createElement(
              'div',
              {
                key: idx,
                onClick: stat.onClick,
                className: cn(
                  'px-4 md:px-6 py-3 md:py-3.5 flex items-center justify-between gap-3 md:gap-4 group hover:bg-white/80 transition-all duration-150',
                  stat.onClick ? 'cursor-pointer' : ''
                ),
              },
              createElement(
                'div',
                { className: 'space-y-0.5 min-w-0 flex-1' },
                createElement(
                  'div',
                  { className: 'flex items-center gap-1.5 min-w-0' },
                  createElement('span', {
                    className:
                      'w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[#103557] transition-colors shrink-0',
                  }),
                  createElement(
                    'p',
                    { className: 'text-[10px] md:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate' },
                    stat.label
                  )
                ),
                createElement(
                  'div',
                  { className: 'flex items-baseline gap-2 flex-wrap min-w-0' },
                  createElement(
                    'span',
                    {
                      className:
                        'text-base md:text-xl font-bold text-slate-900 tracking-tight group-hover:text-[#103557] transition-colors truncate',
                    },
                    stat.value
                  ),
                  stat.trend || stat.badge
                    ? createElement(
                        'span',
                        {
                          className:
                            'text-[9px] md:text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-full whitespace-nowrap shrink-0',
                        },
                        stat.trend || stat.badge
                      )
                    : null
                ),
                stat.description || stat.subtext
                  ? createElement('p', { className: 'text-[10px] md:text-[11px] text-slate-400 truncate' }, stat.description || stat.subtext)
                  : null
              ),
              stat.icon
                ? createElement(
                    'div',
                    {
                      className:
                        'w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-400 group-hover:text-[#103557] group-hover:border-[#103557]/40 group-hover:shadow-xs transition-all shrink-0',
                    },
                    Icon(stat.icon, { className: 'w-3.5 h-3.5 md:w-4 md:h-4' })
                  )
                : null
            )
          )
        )
      : null,

    // ── 3. BAAK-STYLE INFO BANNER ──
    hasBanner
      ? createElement(
          'div',
          {
            className: cn(
              'px-5 md:px-6 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 text-xs text-slate-600',
              banner?.className
            ),
          },
          createElement(
            'div',
            { className: 'flex items-center gap-2.5' },
            Icon(banner?.icon || bannerIcon, { className: 'w-4 h-4 text-slate-400 shrink-0' }),
            createElement(
              'div',
              { className: 'space-y-0.5' },
              banner?.title ? createElement('p', { className: 'font-bold text-slate-800' }, banner.title) : null,
              createElement('p', {}, banner?.description || bannerText)
            )
          ),
          banner?.action ? createElement('div', { className: 'shrink-0' }, banner.action) : null
        )
      : null,

    // ── 4. TABS MENU (WR1 SIAKAD Style) ──
    hasTabs
      ? createElement(
          'div',
          { className: 'border-b border-slate-100 bg-slate-50/50 px-5 md:px-6 overflow-x-auto no-scrollbar' },
          createElement(
            'nav',
            { className: 'flex items-center gap-6' },
            tabs!.map((tab) => {
              const tabKey = tab.key || tab.id || '';
              const isActive = activeTab === tabKey;
              return createElement(
                'button',
                {
                  key: tabKey,
                  type: 'button',
                  onClick: () => onTabChange && onTabChange(tabKey),
                  className: cn(
                    'py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer',
                    isActive
                      ? 'border-[#103557] text-[#103557] font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  ),
                },
                tab.icon ? Icon(tab.icon, { className: 'w-4 h-4' }) : null,
                createElement('span', {}, tab.label),
                tab.count !== undefined
                  ? createElement(
                      'span',
                      {
                        className: cn(
                          'px-1.5 py-0.5 text-[10px] rounded-full font-bold',
                          isActive ? 'bg-[#103557] text-white' : 'bg-slate-200 text-slate-600'
                        ),
                      },
                      tab.count
                    )
                  : null
              );
            })
          )
        )
      : null,

    // ── 5. SEARCH, MAIN ACTIONS, FILTER BUTTON & TOOLBAR ──
    createElement(
      'div',
      { className: 'px-5 md:px-6 py-3.5 border-b border-slate-100 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap' },
      // Left: Search
      showSearch
        ? createElement(
            'div',
            { className: 'relative flex-1 min-w-[240px] max-w-md' },
            createElement(
              'span',
              { className: 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' },
              Icon('Search', { className: 'w-4 h-4' })
            ),
            createElement('input', {
              type: 'text',
              placeholder: searchPlaceholder,
              value: internalSearch,
              onChange: handleSearchChange,
              onKeyDown: handleSearchKeyDown,
              className:
                'w-full pl-9 pr-8 py-2 bg-slate-50/60 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-[#103557] focus:border-[#103557] outline-none transition-all',
            }),
            internalSearch
              ? createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: () => {
                      setInternalSearch('');
                      if (onSearchChange) onSearchChange('');
                    },
                    className: 'absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer',
                  },
                  Icon('X', { className: 'w-3.5 h-3.5' })
                )
              : null
          )
        : createElement('div'),

      // Right: Main Actions (Left of Filter) -> Filter Button -> Custom Toolbar & Secondary Actions
      createElement(
        'div',
        { className: 'flex items-center gap-2 flex-wrap' },
        // 5a. Main Action Buttons (e.g. Order Baru, Tambah, dsb.)
        mainActions.map((act, idx) => {
          const resolvedIcon = act.icon || (act.action === 'add' || act.action === 'create' ? 'Plus' : act.action === 'export' ? 'Download' : act.action === 'import' ? 'Upload' : act.action === 'sync' ? 'RefreshCw' : act.action === 'verify' ? 'ShieldCheck' : undefined);
          const resolvedLabel = act.label || (act.action === 'add' ? 'Tambah Data' : act.action === 'export' ? 'Export' : act.action === 'import' ? 'Import' : act.action === 'sync' ? 'Sinkron' : 'Aksi');
          const resolvedVariant = act.variant || (act.action === 'add' || act.action === 'create' ? 'primary' : act.action === 'verify' ? 'gradient' : 'outline');

          const isGradient = resolvedVariant === 'gradient' || resolvedVariant === 'success';
          const isDanger = resolvedVariant === 'danger';
          const isWarning = resolvedVariant === 'warning';

          return createElement(
            'button',
            {
              key: idx,
              type: 'button',
              disabled: act.disabled,
              onClick: act.onClick,
              className: cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                isGradient
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 border border-emerald-600'
                  : isDanger
                  ? 'bg-rose-600 text-white hover:bg-rose-700 border border-rose-600'
                  : isWarning
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 border border-amber-600'
                  : resolvedVariant === 'primary'
                  ? 'bg-[#103557] text-white hover:bg-[#0c2842] border border-[#103557]'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
                act.className
              ),
            },
            resolvedIcon ? Icon(resolvedIcon, { className: 'w-3.5 h-3.5' }) : null,
            createElement('span', {}, resolvedLabel)
          );
        }),

        // 5b. Filter Button with active count badge
        showFilterButton && onFilterClick
          ? createElement(
              'button',
              {
                type: 'button',
                onClick: onFilterClick,
                className: cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95',
                  filterActive || activeFilterCount > 0
                    ? 'bg-[#103557] text-white border-[#103557] hover:bg-[#0c2842]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                ),
              },
              Icon('Filter', { className: 'w-3.5 h-3.5' }),
              createElement('span', {}, filterButtonLabel),
              activeFilterCount > 0
                ? createElement(
                    'span',
                    {
                      className: cn(
                        'ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                        filterActive || activeFilterCount > 0
                          ? 'bg-white text-[#103557]'
                          : 'bg-[#103557] text-white'
                      ),
                    },
                    activeFilterCount
                  )
                : null
            )
          : null,

        // 5c. Custom Toolbar & Secondary Actions
        customToolbar,
        actions.map((act, idx) => {
          const isGradient = act.variant === 'gradient' || act.variant === 'success';
          const isDanger = act.variant === 'danger';
          const isWarning = act.variant === 'warning';

          return createElement(
            'button',
            {
              key: act.id || idx,
              type: 'button',
              disabled: act.disabled,
              onClick: act.onClick,
              className: cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                isGradient
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 border border-emerald-600'
                  : isDanger
                  ? 'bg-rose-600 text-white hover:bg-rose-700 border border-rose-600'
                  : isWarning
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 border border-amber-600'
                  : act.variant === 'primary'
                  ? 'bg-[#103557] text-white hover:bg-[#0c2842] border border-[#103557]'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
                act.className
              ),
            },
            act.icon ? Icon(act.icon, { className: 'w-3.5 h-3.5' }) : null,
            act.label ? createElement('span', {}, act.label) : null
          );
        })
      )
    ),

    // ── 6. ACTIVE FILTER BADGES BAR ──
    hasActiveFilters
      ? createElement(
          'div',
          { className: 'px-5 md:px-6 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 flex-wrap text-xs' },
          createElement('span', { className: 'text-slate-500 font-medium' }, 'Filter Aktif:'),
          activeFilters.map((f) =>
            createElement(
              'span',
              {
                key: f.key,
                className: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs',
              },
              createElement('span', { className: 'text-slate-400 font-normal' }, `${f.label}:`),
              createElement('span', { className: 'font-bold text-slate-800' }, f.value),
              f.onRemove
                ? createElement(
                    'button',
                    {
                      type: 'button',
                      onClick: f.onRemove,
                      className: 'text-slate-400 hover:text-rose-600 transition-colors cursor-pointer',
                      title: 'Hapus filter',
                    },
                    Icon('X', { className: 'w-3 h-3' })
                  )
                : null
            )
          ),
          onResetFilters
            ? createElement(
                'button',
                {
                  type: 'button',
                  onClick: onResetFilters,
                  className: 'text-rose-600 hover:text-rose-700 font-bold ml-1 hover:underline cursor-pointer',
                },
                'Reset Filter'
              )
            : null
        )
      : null,

    // ── 7. TABLE CONTENT (Tailwind Native Table Engine with Anti-Hydration Guard) ──
    createElement(
      'div',
      { className: 'relative flex-1 min-h-[300px] overflow-x-auto' },
      isLoading
        ? createElement(TableSkeleton, { columnsCount: Math.max(3, columns.length), rowsCount: 5 })
        : isMobile && enableMobileCards && renderMobileCard
        ? // Mobile Card View
          createElement(
            'div',
            { className: 'p-4 space-y-3' },
            processedData.length === 0
              ? createElement(EmptyStateDisplay, { icon: emptyIcon, text: emptyText, subtitle: emptySubtitle })
              : processedData.map((item, idx) => renderMobileCard(item, idx))
          )
        : processedData.length === 0
        ? createElement(EmptyStateDisplay, { icon: emptyIcon, text: emptyText, subtitle: emptySubtitle })
        : // Desktop Semantic Table
          createElement(
            'table',
            { className: 'w-full text-left border-collapse' },
            // Table Header
            createElement(
              'thead',
              { className: 'bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10' },
              createElement(
                'tr',
                null,
                isSelectable
                  ? createElement(
                      'th',
                      { className: 'w-10 px-4 py-3 text-center' },
                      createElement('input', {
                        type: 'checkbox',
                        checked: data.length > 0 && selectedRowKeys.size === data.length,
                        onChange: handleSelectAll,
                        className: 'rounded border-slate-300 text-[#103557] focus:ring-[#103557] cursor-pointer',
                      })
                    )
                  : null,
                columns.map((col, colIdx) => {
                  const headerTitle = col.name !== undefined ? col.name : col.header !== undefined ? col.header : '';
                  const colKey = (col.key || col.id || `col_${colIdx}`) as string;
                  const isSorted = sortColumnKey === colKey;
                  const isFreezeLeft = freezeLeftColumnsCount > 0 && colIdx < freezeLeftColumnsCount;

                  return createElement(
                    'th',
                    {
                      key: colKey,
                      style: {
                        width: col.width,
                        minWidth: col.minWidth,
                        maxWidth: col.maxWidth,
                        ...(isFreezeLeft
                          ? { position: 'sticky', left: `${colIdx * 50}px`, zIndex: 11, backgroundColor: '#F8FAFC' }
                          : {}),
                      },
                      className: cn(
                        'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600 select-none whitespace-nowrap',
                        col.center ? 'text-center' : col.right ? 'text-right' : 'text-left',
                        col.sortable ? 'cursor-pointer hover:bg-slate-100/80 transition-colors' : '',
                        col.headerClassName
                      ),
                      onClick: () => col.sortable && handleSort(col),
                    },
                    createElement(
                      'div',
                      {
                        className: cn(
                          'flex items-center gap-1.5',
                          col.center ? 'justify-center' : col.right ? 'justify-end' : 'justify-start'
                        ),
                      },
                      headerTitle,
                      col.sortable
                        ? createElement(
                            'span',
                            { className: 'text-slate-400' },
                            isSorted
                              ? sortDirection === 'asc'
                                ? Icon('ChevronUp', { className: 'w-3.5 h-3.5 text-[#103557]' })
                                : Icon('ChevronDown', { className: 'w-3.5 h-3.5 text-[#103557]' })
                              : Icon('ChevronsUpDown', { className: 'w-3 h-3 opacity-60' })
                          )
                        : null
                    )
                  );
                })
              )
            ),
            // Table Body
            createElement(
              'tbody',
              { className: 'divide-y divide-slate-100 bg-white' },
              processedData.map((row, rowIdx) => {
                const rowKey = getRowKey(row, rowIdx);
                const isSelected = selectedRowKeys.has(rowKey);

                return createElement(
                  'tr',
                  {
                    key: rowKey,
                    onClick: () => onRowClick && onRowClick(row),
                    className: cn(
                      'transition-colors duration-100',
                      striped && rowIdx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white',
                      highlightOnHover ? 'hover:bg-blue-50/25' : '',
                      isSelected ? 'bg-blue-50/50' : '',
                      onRowClick ? 'cursor-pointer' : ''
                    ),
                  },
                  isSelectable
                    ? createElement(
                        'td',
                        { className: 'w-10 px-4 py-3 text-center' },
                        createElement('input', {
                          type: 'checkbox',
                          checked: isSelected,
                          onChange: (e) => handleSelectRow(row, rowIdx, e),
                          className: 'rounded border-slate-300 text-[#103557] focus:ring-[#103557] cursor-pointer',
                        })
                      )
                    : null,
                  columns.map((col, colIdx) => {
                    const colKey = (col.key || col.id || `col_${colIdx}`) as string;
                    const cellRenderer =
                      col.cell ||
                      col.accessor ||
                      (col.selector ? (r: T) => col.selector!(r, rowIdx) : (r: any) => r[col.key || '']);
                    const cellContent =
                      typeof cellRenderer === 'function' ? cellRenderer(row, rowIdx) : contentToString(row, col.key);
                    const isFreezeLeft = freezeLeftColumnsCount > 0 && colIdx < freezeLeftColumnsCount;

                    return createElement(
                      'td',
                      {
                        key: colKey,
                        style: {
                          width: col.width,
                          minWidth: col.minWidth,
                          maxWidth: col.maxWidth,
                          ...(isFreezeLeft
                            ? {
                                position: 'sticky',
                                left: `${colIdx * 50}px`,
                                zIndex: 10,
                                backgroundColor: rowIdx % 2 === 1 && striped ? '#FAFAFA' : '#FFFFFF',
                              }
                            : {}),
                        },
                        className: cn(
                          dense ? 'px-4 py-2 text-xs' : 'px-4 py-3 text-xs md:text-sm text-slate-800',
                          col.center ? 'text-center' : col.right ? 'text-right' : 'text-left',
                          col.wrap === false ? 'whitespace-nowrap' : '',
                          col.cellClassName
                        ),
                      },
                      cellContent
                    );
                  })
                );
              })
            )
          )
    ),

    // ── 8. PAGINATION FOOTER ──
    pagination
      ? createElement(
          'div',
          {
            className:
              'px-5 md:px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500',
          },
          // Left: Info & Rows Per Page
          createElement(
            'div',
            { className: 'flex items-center gap-3 flex-wrap' },
            createElement(
              'span',
              null,
              `Menampilkan ${startRow} - ${endRow} dari ${resolvedTotal} data`
            ),
            createElement(
              'div',
              { className: 'flex items-center gap-1.5' },
              createElement('span', null, 'Baris per halaman:'),
              createElement(
                'select',
                {
                  value: internalPageSize,
                  onChange: handlePageSizeChange,
                  className:
                    'bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-1 focus:ring-[#103557] outline-none cursor-pointer',
                },
                pageSizeOptions.map((opt) =>
                  createElement('option', { key: opt, value: opt }, `${opt}`)
                )
              )
            )
          ),

          // Right: Page Navigator Buttons
          createElement(
            'div',
            { className: 'flex items-center gap-1.5' },
            createElement(
              'button',
              {
                type: 'button',
                disabled: internalPage <= 1,
                onClick: () => handlePageChange(1),
                className:
                  'px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer',
                title: 'Halaman Pertama',
              },
              Icon('ChevronsLeft', { className: 'w-3.5 h-3.5' })
            ),
            createElement(
              'button',
              {
                type: 'button',
                disabled: internalPage <= 1,
                onClick: () => handlePageChange(internalPage - 1),
                className:
                  'px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer',
                title: 'Halaman Sebelumnya',
              },
              Icon('ChevronLeft', { className: 'w-3.5 h-3.5' })
            ),
            createElement(
              'span',
              { className: 'px-2 font-medium text-slate-700' },
              `Hal. ${internalPage} dari ${totalPages}`
            ),
            createElement(
              'button',
              {
                type: 'button',
                disabled: internalPage >= totalPages,
                onClick: () => handlePageChange(internalPage + 1),
                className:
                  'px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer',
                title: 'Halaman Berikutnya',
              },
              Icon('ChevronRight', { className: 'w-3.5 h-3.5' })
            ),
            createElement(
              'button',
              {
                type: 'button',
                disabled: internalPage >= totalPages,
                onClick: () => handlePageChange(totalPages),
                className:
                  'px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer',
                title: 'Halaman Terakhir',
              },
              Icon('ChevronsRight', { className: 'w-3.5 h-3.5' })
            )
          )
        )
      : null
  );
}

// ============================================================================
// Internal Helper Components
// ============================================================================

function TableSkeleton({ columnsCount = 5, rowsCount = 5 }: { columnsCount?: number; rowsCount?: number }) {
  return createElement(
    'div',
    { className: 'w-full p-4 space-y-3' },
    // Header skeleton
    createElement(
      'div',
      { className: 'grid gap-4 py-2 border-b border-slate-100', style: { gridTemplateColumns: `repeat(${columnsCount}, 1fr)` } },
      Array.from({ length: columnsCount }).map((_, i) =>
        createElement('div', { key: i, className: 'h-4 bg-slate-200/70 rounded animate-pulse' })
      )
    ),
    // Row skeleton
    Array.from({ length: rowsCount }).map((_, rowIdx) =>
      createElement(
        'div',
        {
          key: rowIdx,
          className: 'grid gap-4 py-3 border-b border-slate-50 items-center',
          style: { gridTemplateColumns: `repeat(${columnsCount}, 1fr)` },
        },
        Array.from({ length: columnsCount }).map((_, colIdx) =>
          createElement('div', { key: colIdx, className: 'h-3 bg-slate-100 rounded animate-pulse' })
        )
      )
    )
  );
}

function EmptyStateDisplay({ icon = 'Search', text = 'Tidak ada data', subtitle = 'Belum ada data pada kriteria ini' }: { icon?: string; text?: string; subtitle?: string }) {
  return createElement(
    'div',
    { className: 'py-16 text-center flex flex-col items-center justify-center' },
    createElement(
      'div',
      { className: 'w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3' },
      Icon(icon, { className: 'w-6 h-6' })
    ),
    createElement('p', { className: 'text-sm font-bold text-slate-800' }, text),
    createElement('p', { className: 'mt-1 text-xs text-slate-400 max-w-xs' }, subtitle)
  );
}

function contentToString(row: any, key?: string): string {
  if (!key || !row) return '-';
  const val = row[key];
  if (val === undefined || val === null) return '-';
  return String(val);
}

export const TableCard = DataTableCard;

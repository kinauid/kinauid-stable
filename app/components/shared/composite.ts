import React from 'react';
import type { ReactNode } from 'react';
import {
  Row,
  Col,
  Div,
  Span,
  P,
  H1,
  Card,
  Badge,
  Button,
  Input,
  Breadcrumb,
  Icon,
  ui,
  type BreadcrumbItem,
  type BadgeProps,
  type FluentBuilder,
} from '~/builder';

// ============================================================================
// 1. Page Header Composite Component
// ============================================================================

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  badges?: ({ label: string; variant?: BadgeProps['variant'] } | BadgeProps)[];
  actions?: (ReactNode | FluentBuilder<any>)[];
}

export function PageHeader(props: PageHeaderProps): React.ReactElement {
  const { title, subtitle, breadcrumbs, badges = [], actions = [] } = props;

  return ui('div')
    .between()
    .wrap()
    .gap(4)
    .childrenOf(
      Col(
        { className: 'gap-1' },
        breadcrumbs && breadcrumbs.length > 0 ? Breadcrumb({ items: breadcrumbs }) : null,
        Row(
          { className: 'gap-2.5 flex-wrap items-center' },
          H1({ className: 'text-xl font-black text-[#111827] tracking-tight' }, title),
          ...badges.map((b, i) => Badge({ key: `badge-${i}`, label: b.label, variant: b.variant }))
        ),
        subtitle ? P({ className: 'text-xs text-[#6B7280]' }, subtitle) : null
      ),
      actions && actions.length > 0
        ? Row({ className: 'flex-wrap gap-2 items-center' }, ...actions)
        : null
    )
    .build();
}

// ============================================================================
// 2. Stats Grid Composite Component
// ============================================================================

export interface StatItem {
  label: string;
  value: string | number | undefined;
  icon: string;
  color?: 'cyan' | 'green' | 'amber' | 'purple' | 'blue' | 'red';
  subtext?: string;
}

export function StatsGrid(items: StatItem[]): React.ReactElement {
  const colorClassMap: Record<string, string> = {
    cyan: 'text-blue-600 bg-blue-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-emerald-600 bg-emerald-50',
    amber: 'text-[#854D0E] bg-[#FEF9C3]',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-rose-600 bg-rose-50',
  };

  return ui('div')
    .grid(items.length >= 4 ? 4 : items.length, 'gap-4')
    .childrenOf(
      ...items.map((stat, idx) =>
        Card(
          {
            key: `stat-${idx}`,
            className:
              'p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-[#D1D5DB] transition-all',
          },
          ui('div')
            .between()
            .childrenOf(
              Col(
                { className: 'gap-1' },
                P({ className: 'text-xs text-[#6B7280] font-semibold' }, stat.label),
                P(
                  { className: 'text-2xl font-black text-[#111827] tracking-tight mt-0.5' },
                  String(stat.value ?? '—')
                ),
                stat.subtext ? P({ className: 'text-[11px] text-[#6B7280]' }, stat.subtext) : null
              ),
              ui('div')
                .class(
                  `p-3 rounded-2xl flex items-center justify-center shrink-0 ${colorClassMap[stat.color || 'blue'] || colorClassMap.blue}`
                )
                .childrenOf(Icon(stat.icon, { size: 20 }))
            )
        )
      )
    )
    .build();
}

// ============================================================================
// 3. Filter Toolbar Component
// ============================================================================

export interface FilterBarProps {
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: (ReactNode | FluentBuilder<any>)[];
  onReset?: () => void;
  showReset?: boolean;
  statsText?: string;
  className?: string;
}

export function FilterBar(props: FilterBarProps): React.ReactElement {
  const {
    search = '',
    onSearchChange,
    searchPlaceholder = 'Cari...',
    filters = [],
    onReset,
    showReset = false,
    statsText,
    className = '',
  } = props;

  return ui('div')
    .class(
      className ||
        'p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]'
    )
    .childrenOf(
      Row(
        { className: 'flex-wrap gap-2.5 w-full md:w-auto items-center' },
        onSearchChange
          ? ui('div')
              .class('relative min-w-[240px]')
              .childrenOf(
                Input({
                  name: 'search',
                  value: search,
                  placeholder: searchPlaceholder,
                  onChange: (e) => onSearchChange(e.target.value),
                  className: 'w-full',
                  inputClassName:
                    'pl-8 pr-3 py-1.5 text-xs bg-[#F9FAFB] text-[#111827] placeholder-[#9CA3AF] rounded-xl border border-[#E5E7EB] focus:bg-white focus:border-[#103557]',
                }),
                ui('div')
                  .class(
                    'absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none'
                  )
                  .childrenOf(Icon('Search', { size: 13 }))
              )
          : null,
        ...filters,
        showReset && onReset
          ? Button({
              label: 'Reset Filter',
              variant: 'ghost',
              size: 'xs',
              icon: 'RotateCcw',
              onClick: onReset,
              className: 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-xl',
            })
          : null
      ),
      statsText
        ? Div(
            {
              className: 'text-[11px] text-[#6B7280] font-medium self-end md:self-center',
            },
            statsText
          )
        : null
    )
    .build();
}

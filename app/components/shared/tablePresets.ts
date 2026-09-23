import React, { createElement } from 'react';
import type { ReactNode } from 'react';
import { Row, Col, Span, Badge, Button, Icon, type BadgeProps } from '~/builder';
import type { TableColumn } from '~/builder/types';
import { getResourceUrl } from '~/utils/resource';

// ============================================================================
// 1. User Avatar + Name + Email Column Preset
// ============================================================================

export interface UserAvatarColumnOptions<T = any> {
  header?: string;
  nameKey?: keyof T | string;
  emailKey?: keyof T | string;
  avatarKey?: keyof T | string;
  width?: string;
}

export function UserAvatarColumn<T = any>(
  options: UserAvatarColumnOptions<T> = {}
): TableColumn<T> {
  const {
    header = 'Pengguna',
    nameKey = 'name',
    emailKey = 'email',
    avatarKey = 'avatar',
    width = '240px',
  } = options;

  return {
    header,
    width,
    accessor: (row: any) => {
      const name = String(row[nameKey] || '—');
      const email = row[emailKey] ? String(row[emailKey]) : null;
      const avatar = row[avatarKey];
      const initials = name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      return Row(
        { className: 'gap-3 items-center' },
        avatar
          ? createElement('img', {
              src: getResourceUrl(avatar),
              alt: name,
              className: 'w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-[var(--border)]',
            })
          : createElement(
              'div',
              {
                className:
                  'w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0 ring-1 ring-cyan-500/30',
              },
              initials || 'U'
            ),
        Col(
          { className: 'gap-0.5 min-w-0' },
          Span({ className: 'font-medium text-[var(--foreground)] truncate block text-xs' }, name),
          email
            ? Span(
                { className: 'text-[11px] text-[var(--muted-foreground)] truncate block' },
                email
              )
            : null
        )
      );
    },
  };
}

// ============================================================================
// 2. Badge Enum Column Preset
// ============================================================================

export interface BadgeColumnOptions<T = any> {
  key?: keyof T | string;
  header?: string;
  width?: string;
  map: Record<string, { label: string; variant?: BadgeProps['variant'] }>;
  fallbackVariant?: BadgeProps['variant'];
  accessor?: (row: T) => string;
}

export function BadgeColumn<T = any>(options: BadgeColumnOptions<T>): TableColumn<T> {
  const { key, header, width = '120px', map, fallbackVariant = 'secondary', accessor } = options;
  const colHeader = header || (key ? String(key).charAt(0).toUpperCase() + String(key).slice(1) : 'Status');

  return {
    header: colHeader,
    width,
    accessor: (row: any) => {
      const val = accessor ? accessor(row) : String(key ? row[key] : '');
      const config = map[val] || { label: val || '—', variant: fallbackVariant };
      return Badge({ label: config.label, variant: config.variant });
    },
  };
}

// ============================================================================
// 3. Simple Text Column Preset
// ============================================================================

export interface TextColumnOptions<T = any> {
  key?: keyof T | string;
  header: string;
  width?: string;
  className?: string;
  formatter?: (val: any, row: T) => string;
  accessor?: (row: T) => any;
}

export function TextColumn<T = any>(options: TextColumnOptions<T>): TableColumn<T> {
  const {
    key,
    header,
    width,
    className = 'text-xs text-[var(--muted-foreground)]',
    formatter,
    accessor,
  } = options;

  return {
    header,
    width,
    accessor: (row: any) => {
      if (accessor) {
        const res = accessor(row);
        return typeof res === 'string' || typeof res === 'number' ? Span({ className }, String(res)) : res;
      }
      const rawVal = key ? row[key] : undefined;
      const displayVal = formatter ? formatter(rawVal, row) : String(rawVal ?? '—');
      return Span({ className }, displayVal);
    },
  };
}

// ============================================================================
// 4. Order / Code Link Column Preset (#103557 Modern Link)
// ============================================================================

export interface OrderCodeColumnOptions<T = any> {
  key?: keyof T | string;
  header?: string;
  width?: string;
  hrefPrefix?: string;
  onClick?: (row: T) => void;
}

export function OrderCodeColumn<T = any>(
  options: OrderCodeColumnOptions<T> = {}
): TableColumn<T> {
  const {
    key = 'order_number',
    header = 'No. Order',
    width = '160px',
    hrefPrefix = '/app/order-edit/',
    onClick,
  } = options;

  return {
    header,
    width,
    accessor: (row: any) => {
      const val = String(row[key] || row.code || row.id || '—');
      if (onClick) {
        return createElement(
          'button',
          {
            type: 'button',
            onClick: (e: any) => {
              e.stopPropagation();
              onClick(row);
            },
            className:
              'text-xs font-bold text-[#103557] hover:text-[#2874E2] hover:underline cursor-pointer font-mono bg-transparent border-0 p-0',
          },
          val
        );
      }
      return createElement(
        'span',
        {
          className: 'text-xs font-bold text-[#103557] font-mono',
        },
        val
      );
    },
  };
}

// ============================================================================
// 5. Action Row Button Presets
// ============================================================================

export interface ActionItem<T = any> {
  icon: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  guard?: string | string[];
  guardMode?: 'hide' | 'disable';
  tooltip?: string;
  onClick: (row: T) => void;
}

export function TableActions<T = any>(actions: ActionItem<T>[]): TableColumn<T> {
  return {
    header: 'Aksi',
    align: 'right',
    width: '100px',
    accessor: (row: T) =>
      Row(
        { className: 'justify-end gap-1 items-center' },
        ...actions.map((act, i) =>
          Button({
            key: `act-${i}`,
            icon: act.icon,
            label: act.label,
            variant: act.variant || 'ghost',
            size: 'xs',
            guard: act.guard,
            guardMode: act.guardMode,
            title: act.tooltip,
            onClick: () => act.onClick(row),
          })
        )
      ),
  };
}

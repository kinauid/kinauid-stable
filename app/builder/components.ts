import React, { createElement, Fragment } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink, Form as RouterForm, Await as RouterAwait } from 'react-router';
import * as LucideIcons from 'lucide-react';
import { cn } from '~/lib/utils';
import { useHydrated, useNetworkStatus } from './hooks';
import type {
  BreadcrumbItem,
  CardProps,
  BadgeProps,
  ButtonProps,
  SubmitButtonProps,
  TableProps,
  InputProps,
  SelectProps,
  TextareaProps,
  ModalProps,
  FormProps,
  ClientOnlyProps,
  ChartProps,
  PrintButtonProps,
  OfflineBannerProps,
} from './types';
import { baseUI, PermissionGuard, FluentBuilder, sanitizeChild } from './proxy';

import {
  DataTableCard,
  TableCard,
  type DataTableCardProps,
  type DataTableCardColumn,
  type TableStatItem,
  type TableMainAction,
  type TableTabItem,
  type TableActionItem,
  type ActiveFilterItem,
  type TableBannerConfig,
} from '~/components/shared/components/DataTableCard';
import {
  TableActionGroup,
  TableActionButton,
  ActionBadgeGroup,
  ActionBadgeButton,
  type TableActionGroupProps,
  type TableActionButtonProps,
} from '~/components/core/TableActionGroup';

export {
  DataTableCard,
  TableCard,
  TableActionGroup,
  TableActionButton,
  ActionBadgeGroup,
  ActionBadgeButton,
  type DataTableCardProps,
  type DataTableCardColumn,
  type TableStatItem,
  type TableMainAction,
  type TableTabItem,
  type TableActionItem,
  type ActiveFilterItem,
  type TableBannerConfig,
  type TableActionGroupProps,
  type TableActionButtonProps,
};

export function renderDataTableCard<T = any>(props: DataTableCardProps<T>): React.ReactElement {
  return createElement(DataTableCard as React.ComponentType<any>, props as any);
}

export function renderTableActionGroup(props: TableActionGroupProps): React.ReactElement {
  return createElement(TableActionGroup, props);
}

export function renderTableActionButton(props: TableActionButtonProps): React.ReactElement {
  return createElement(TableActionButton, props);
}


/**
 * Dynamic Lucide Icon Helper
 */
export function renderIcon(
  iconName: string,
  options: { size?: number; className?: string; color?: string } = {}
): React.ReactElement {
  const { size = 16, className = '', color } = options;
  const IconComponent = (LucideIcons as Record<string, any>)[iconName] || LucideIcons.HelpCircle;
  return createElement(IconComponent, {
    size,
    className: cn('shrink-0', className),
    color,
  });
}

/**
 * Breadcrumbs DSL Component
 */
export function renderBreadcrumb(props: {
  items: BreadcrumbItem[];
  className?: string;
}): React.ReactElement {
  const { items, className = '' } = props;
  if (!items || items.length === 0) return createElement('div');

  const elements: ReactNode[] = [];
  items.forEach((item, idx) => {
    const isLast = idx === items.length - 1;
    if (idx > 0) {
      elements.push(
        createElement(
          'span',
          {
            key: `sep-${idx}`,
            className: 'text-[var(--muted-foreground)] opacity-50 select-none',
          },
          renderIcon('ChevronRight', { size: 12 })
        )
      );
    }

    if (isLast || !item.href) {
      elements.push(
        createElement(
          'span',
          {
            key: `item-${idx}`,
            className: 'text-xs font-semibold text-[var(--foreground)] truncate',
          },
          item.label
        )
      );
    } else {
      elements.push(
        createElement(
          RouterLink,
          {
            key: `item-${idx}`,
            to: item.href,
            className:
              'text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors truncate',
          },
          item.label
        )
      );
    }
  });

  return createElement(
    'nav',
    {
      'aria-label': 'Breadcrumb',
      className: cn('flex items-center gap-1.5 py-1 text-xs', className),
    },
    ...elements
  );
}

/**
 * Badge / Pill Component (BudgetBuddy Soft Architecture)
 */
export function renderBadge(props: BadgeProps): React.ReactElement {
  const { label, variant = 'primary', className = '', guard, guardRole, guardMode } = props;

  const variantStyles: Record<string, string> = {
    primary: 'bg-blue-50 text-blue-700 border-blue-100 font-medium',
    secondary: 'bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A] font-medium',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100 font-medium',
    warning: 'bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A] font-medium',
    danger: 'bg-rose-50 text-rose-700 border-rose-100 font-medium',
    info: 'bg-blue-50 text-blue-700 border-blue-100 font-medium',
    outline: 'border-[#E5E7EB] text-[#6B7280] bg-white font-medium',
  };

  const badgeElement = createElement(
    'span',
    {
      className: cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-tight',
        variantStyles[variant] || variantStyles.primary,
        className
      ),
    },
    label
  );

  if (guard || guardRole) {
    return createElement(PermissionGuard, {
      guard,
      guardRole,
      guardMode,
      children: badgeElement,
    }) as React.ReactElement;
  }

  return badgeElement;
}

/**
 * Card Component
 */
export function renderCard(
  props: CardProps,
  ...children: (ReactNode | FluentBuilder<any>)[]
): React.ReactElement {
  const { title, subtitle, badge, action, className = '', guard, guardRole, guardMode } = props;
  const hasHeader = title || subtitle || badge || action;

  const cardChildren: ReactNode[] = [];

  if (hasHeader) {
    const headerContent = createElement(
      'div',
      { className: 'flex items-start justify-between gap-3 p-4 border-b border-[var(--border)]' },
      createElement(
        'div',
        { className: 'space-y-0.5' },
        title &&
          createElement(
            'div',
            { className: 'flex items-center gap-2' },
            createElement(
              'h3',
              { className: 'text-sm font-semibold text-[var(--foreground)]' },
              title
            ),
            badge
          ),
        subtitle &&
          createElement('p', { className: 'text-xs text-[var(--muted-foreground)]' }, subtitle)
      ),
      action && createElement('div', { className: 'flex items-center gap-2' }, action)
    );
    cardChildren.push(headerContent);
  }

  for (const child of children) {
    const sanitized = sanitizeChild(child);
    if (sanitized !== null) {
      cardChildren.push(sanitized);
    }
  }

  const cardElement = createElement(
    'div',
    {
      className: cn(
        'bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-card-sm)] shadow-[var(--shadow-sm)] overflow-hidden',
        className
      ),
    },
    ...cardChildren
  );

  if (guard || guardRole) {
    return createElement(PermissionGuard, {
      guard,
      guardRole,
      guardMode,
      children: cardElement,
    }) as React.ReactElement;
  }

  return cardElement;
}

/**
 * Button Component
 */
export function renderButton(props: ButtonProps): React.ReactElement {
  const {
    label,
    children,
    variant = 'primary',
    size = 'sm',
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    className = '',
    type = 'button',
    guard,
    guardRole,
    guardMode,
    ...rest
  } = props;

  const variantStyles: Record<string, string> = {
    primary: 'bg-[var(--primary)] hover:opacity-90 text-white font-medium shadow-sm transition-all',
    secondary:
      'bg-[var(--surface-subtle)] hover:bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] font-medium',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-all',
    ghost: 'bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--foreground)] font-medium',
    outline:
      'bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--foreground)] border border-[var(--border)] font-medium',
    subtle:
      'bg-[var(--surface-subtle)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
  };

  const sizeStyles: Record<string, string> = {
    xs: 'px-2 py-1 text-[11px] rounded-[var(--radius)] gap-1',
    sm: 'px-3 py-1.5 text-xs rounded-[var(--radius)] gap-1.5',
    md: 'px-4 py-2 text-sm rounded-[var(--radius)] gap-2',
    lg: 'px-5 py-2.5 text-base rounded-[var(--radius)] gap-2.5',
  };

  const content: ReactNode[] = [];

  if (loading) {
    content.push(
      createElement(LucideIcons.Loader2, {
        key: 'loader',
        size: size === 'xs' ? 12 : 14,
        className: 'animate-spin shrink-0',
      })
    );
  } else if (icon && iconPosition === 'left') {
    content.push(renderIcon(icon, { size: size === 'xs' ? 12 : 14 }));
  }

  content.push(label || children);

  if (!loading && icon && iconPosition === 'right') {
    content.push(renderIcon(icon, { size: size === 'xs' ? 12 : 14 }));
  }

  const buttonElement = createElement(
    'button',
    {
      type,
      disabled: disabled || loading,
      className: cn(
        'inline-flex items-center justify-center transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.sm,
        className
      ),
      ...rest,
    },
    ...content
  );

  if (guard || guardRole) {
    return createElement(PermissionGuard, {
      guard,
      guardRole,
      guardMode,
      children: buttonElement,
    }) as React.ReactElement;
  }

  return buttonElement;
}

/**
 * Submit Button with Automatic Spinner & Double-Submit Protection
 */
export function renderSubmitButton(props: SubmitButtonProps): React.ReactElement {
  const {
    label = 'Simpan',
    loadingLabel = 'Menyimpan...',
    isSubmitting = false,
    className = '',
    variant = 'primary',
    size = 'sm',
    icon = 'Save',
    disabled = false,
    guard,
    guardRole,
    guardMode,
  } = props;

  return renderButton({
    type: 'submit',
    label: isSubmitting ? loadingLabel : label,
    loading: isSubmitting,
    disabled: disabled || isSubmitting,
    icon: isSubmitting ? undefined : icon,
    variant,
    size,
    className,
    guard,
    guardRole,
    guardMode,
  });
}

/**
 * High Density Data Table Component
 */
export function renderTable<T = any>(props: TableProps<T>): React.ReactElement {
  const {
    columns,
    data,
    keyField = 'id' as any,
    onRowClick,
    emptyText = 'Belum ada data tersedia',
    className = '',
    compact = true,
  } = props;

  if (!data || data.length === 0) {
    return createElement(
      'div',
      {
        className: cn(
          'flex flex-col items-center justify-center p-8 border border-[var(--border)] rounded-[var(--radius-card-sm)] bg-[var(--card)] text-center text-xs text-[var(--muted-foreground)]',
          className
        ),
      },
      renderIcon('Inbox', { size: 28, className: 'mb-2 opacity-40' }),
      createElement('p', null, emptyText)
    );
  }

  const thead = createElement(
    'thead',
    {
      className:
        'bg-[#F9FAFB] border-b border-[#E5E7EB] text-xs font-medium text-[#6B7280] uppercase tracking-wider',
    },
    createElement(
      'tr',
      null,
      columns.map((col, colIdx) =>
        createElement(
          'th',
          {
            key: col.key || `col-${colIdx}`,
            style: col.width ? { width: col.width } : undefined,
            className: cn(
              'px-6 py-3.5 text-left font-medium select-none text-[#6B7280]',
              col.align === 'center' && 'text-center',
              col.align === 'right' && 'text-right'
            ),
          },
          col.header
        )
      )
    )
  );

  const tbody = createElement(
    'tbody',
    { className: 'divide-y divide-[#F3F4F6] text-sm text-[#111827] bg-[#FFFFFF]' },
    data.map((row, rowIdx) => {
      const key =
        typeof keyField === 'function'
          ? keyField(row)
          : ((row as any)[keyField] ?? `row-${rowIdx}`);

      return createElement(
        'tr',
        {
          key,
          onClick: onRowClick ? () => onRowClick(row) : undefined,
          className: cn(
            'transition-colors hover:bg-[#F8FAFC]',
            onRowClick && 'cursor-pointer'
          ),
        },
        columns.map((col, colIdx) => {
          const cellValue = col.key ? (row as any)[col.key] : undefined;
          const renderedCell = col.render
            ? col.render(row, rowIdx)
            : col.accessor
              ? col.accessor(row, rowIdx)
              : cellValue;

          return createElement(
            'td',
            {
              key: `${key}-${col.key || colIdx}`,
              className: cn(
                compact ? 'px-6 py-3.5' : 'px-6 py-4',
                col.align === 'center' && 'text-center',
                col.align === 'right' && 'text-right',
                'align-middle'
              ),
            },
            renderedCell as React.ReactNode
          );
        })
      );
    })
  );

  return createElement(
    'div',
    {
      className: cn(
        'w-full overflow-x-auto border border-[#E5E7EB] rounded-2xl bg-[#FFFFFF] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]',
        className
      ),
    },
    createElement('table', { className: 'w-full text-left border-collapse' }, thead, tbody)
  );
}

/**
 * Input Field DSL Component
 */
export function renderInput(props: InputProps): React.ReactElement {
  const {
    name,
    label,
    error,
    hint,
    className = '',
    inputClassName = '',
    required,
    ...rest
  } = props;

  return createElement(
    'div',
    { className: cn('space-y-1 text-xs', className) },
    label &&
      createElement(
        'label',
        { htmlFor: name, className: 'block font-medium text-[var(--foreground)]' },
        label,
        required && createElement('span', { className: 'text-red-500 ml-0.5' }, '*')
      ),
    createElement('input', {
      id: name,
      name,
      required,
      className: cn(
        'w-full px-3 py-1.5 rounded-[var(--radius)] bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all',
        error && 'border-red-500 focus:ring-red-500',
        inputClassName
      ),
      ...rest,
    }),
    error && createElement('p', { className: 'text-[11px] text-red-500' }, error),
    !error &&
      hint &&
      createElement('p', { className: 'text-[11px] text-[var(--muted-foreground)]' }, hint)
  );
}

/**
 * Select Field DSL Component
 */
export function renderSelect(props: SelectProps): React.ReactElement {
  const {
    name,
    label,
    options,
    error,
    hint,
    className = '',
    selectClassName = '',
    required,
    ...rest
  } = props;

  return createElement(
    'div',
    { className: cn('space-y-1 text-xs', className) },
    label &&
      createElement(
        'label',
        { htmlFor: name, className: 'block font-medium text-[var(--foreground)]' },
        label,
        required && createElement('span', { className: 'text-red-500 ml-0.5' }, '*')
      ),
    createElement(
      'select',
      {
        id: name,
        name,
        required,
        className: cn(
          'w-full px-3 py-1.5 rounded-[var(--radius)] bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all cursor-pointer',
          error && 'border-red-500 focus:ring-red-500',
          selectClassName
        ),
        ...rest,
      },
      options.map((opt) => createElement('option', { key: opt.value, value: opt.value }, opt.label))
    ),
    error && createElement('p', { className: 'text-[11px] text-red-500' }, error),
    !error &&
      hint &&
      createElement('p', { className: 'text-[11px] text-[var(--muted-foreground)]' }, hint)
  );
}

/**
 * Textarea Field DSL Component
 */
export function renderTextarea(props: TextareaProps): React.ReactElement {
  const {
    name,
    label,
    error,
    hint,
    className = '',
    textareaClassName = '',
    required,
    rows = 3,
    ...rest
  } = props;

  return createElement(
    'div',
    { className: cn('space-y-1 text-xs', className) },
    label &&
      createElement(
        'label',
        { htmlFor: name, className: 'block font-medium text-[var(--foreground)]' },
        label,
        required && createElement('span', { className: 'text-red-500 ml-0.5' }, '*')
      ),
    createElement('textarea', {
      id: name,
      name,
      rows,
      required,
      className: cn(
        'w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all',
        error && 'border-red-500 focus:ring-red-500',
        textareaClassName
      ),
      ...rest,
    }),
    error && createElement('p', { className: 'text-[11px] text-red-500' }, error),
    !error &&
      hint &&
      createElement('p', { className: 'text-[11px] text-[var(--muted-foreground)]' }, hint)
  );
}

/**
 * Modal Dialog DSL Component
 */
export function renderModal(
  props: ModalProps,
  ...children: (ReactNode | FluentBuilder<any>)[]
): React.ReactElement | null {
  const {
    open,
    onClose,
    title,
    description,
    size = 'md',
    className = '',
    bodyClassName = '',
    children: propChildren,
  } = props as any;
  if (!open) return null;

  const sizeStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full m-4',
  };

  const rawChildren = children.length > 0 ? children : propChildren ? (Array.isArray(propChildren) ? propChildren : [propChildren]) : [];
  const safeChildren: ReactNode[] = [];
  for (const child of rawChildren) {
    const sanitized = sanitizeChild(child);
    if (sanitized !== null) safeChildren.push(sanitized);
  }

  const hasHeader = Boolean(title || description);

  return createElement(
    'div',
    {
      className:
        'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto',
      onClick: (e: any) => {
        if (e.target === e.currentTarget) onClose();
      },
    },
    createElement(
      'div',
      {
        className: cn(
          'w-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] md:max-h-[calc(100vh-4rem)] flex flex-col bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)] overflow-hidden animate-in zoom-in-95 duration-150 my-auto',
          sizeStyles[size] || sizeStyles.md,
          className
        ),
      },
      hasHeader
        ? createElement(
            'div',
            {
              className:
                'flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface-subtle)] shrink-0',
            },
            createElement(
              'div',
              { className: 'min-w-0 pr-2' },
              title &&
                createElement('h3', { className: 'text-sm font-bold text-[var(--foreground)] truncate' }, title),
              description &&
                createElement(
                  'p',
                  { className: 'text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2' },
                  description
                )
            ),
            createElement(
              'button',
              {
                type: 'button',
                onClick: onClose,
                className:
                  'p-1.5 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors cursor-pointer shrink-0 ml-auto',
                'aria-label': 'Tutup modal',
              },
              renderIcon('X', { size: 16 })
            )
          )
        : null,
      createElement(
        'div',
        {
          className: cn('flex-1 overflow-y-auto min-h-0 p-4 space-y-4', bodyClassName),
        },
        ...safeChildren
      )
    )
  );
}

/**
 * React Router Form DSL Component (Supports both <Form>, <fetcher.Form>, and auto-extracted Form(onSubmit) binding)
 */
export function renderForm(
  propsOrOnSubmit:
    FormProps | ((values: Record<string, any>, e: React.FormEvent<HTMLFormElement>) => void) = {},
  ...children: (ReactNode | FluentBuilder<any>)[]
): React.ReactElement {
  const props: FormProps =
    typeof propsOrOnSubmit === 'function' ? { onSubmit: propsOrOnSubmit } : propsOrOnSubmit;
  const { method = 'post', action, replace = true, fetcher, onSubmit, className = '' } = props;

  const safeChildren: ReactNode[] = [];
  for (const child of children) {
    const sanitized = sanitizeChild(child);
    if (sanitized !== null) safeChildren.push(sanitized);
  }

  const handleSubmit = onSubmit
    ? (e: React.FormEvent<HTMLFormElement>) => {
        const form = e.currentTarget;
        const formData = new FormData(form);
        const data: Record<string, any> = {};
        formData.forEach((val, key) => {
          if (data[key] !== undefined) {
            if (Array.isArray(data[key])) {
              data[key].push(val);
            } else {
              data[key] = [data[key], val];
            }
          } else {
            data[key] = val;
          }
        });

        // Pass both extracted data and original form event
        (onSubmit as any)(data, e);
      }
    : undefined;

  if (fetcher) {
    return createElement(
      fetcher.Form,
      {
        method,
        action,
        onSubmit: handleSubmit,
        className,
      },
      ...safeChildren
    );
  }

  return createElement(
    RouterForm,
    {
      method,
      action,
      replace,
      onSubmit: handleSubmit,
      className,
    },
    ...safeChildren
  );
}

/**
 * React Router Link DSL Component
 */
export function renderLink(
  props: {
    to: string;
    key?: React.Key;
    className?: string;
    replace?: boolean;
    prefetch?: 'none' | 'intent' | 'render';
  },
  ...children: (ReactNode | FluentBuilder<any>)[]
): React.ReactElement {
  const { to, key, className = '', replace = false, prefetch = 'intent' } = props;
  const safeChildren: ReactNode[] = [];
  for (const child of children) {
    const sanitized = sanitizeChild(child);
    if (sanitized !== null) safeChildren.push(sanitized);
  }
  return createElement(
    RouterLink,
    {
      to,
      key,
      replace,
      prefetch,
      className: className ? cn(className) : 'hover:underline text-[var(--primary)] transition-colors',
    },
    ...safeChildren
  );
}

/**
 * Skeleton Loader DSL Component
 */
export function renderSkeleton(
  props: { className?: string; count?: number } = {}
): React.ReactElement {
  const { className = '', count = 1 } = props;
  if (count > 1) {
    return createElement(
      'div',
      { className: 'space-y-2 w-full' },
      ...Array.from({ length: count }).map((_, i) =>
        createElement('div', {
          key: `skeleton-${i}`,
          className: cn(
            'h-4 rounded-[var(--radius-card-sm)] bg-[var(--surface-subtle)] animate-pulse',
            className
          ),
        })
      )
    );
  }
  return createElement('div', {
    className: cn(
      'h-4 rounded-[var(--radius-card-sm)] bg-[var(--surface-subtle)] animate-pulse',
      className
    ),
  });
}

/**
 * React Suspense DSL Wrapper
 */
export function renderSuspense(
  props: { fallback?: ReactNode } = {},
  ...children: (ReactNode | FluentBuilder<any>)[]
): React.ReactElement {
  const { fallback = renderSkeleton({ className: 'h-20 w-full' }) } = props;
  const safeChildren: ReactNode[] = [];
  for (const child of children) {
    const sanitized = sanitizeChild(child);
    if (sanitized !== null) safeChildren.push(sanitized);
  }
  return createElement(React.Suspense, { fallback }, ...safeChildren);
}

/**
 * React Router Await Streaming DSL Component
 */
export function renderAwait<T = any>(props: {
  resolve: Promise<T> | T;
  fallback?: ReactNode;
  errorElement?: ReactNode | ((error: any) => ReactNode);
  children: (data: T) => ReactNode;
}): React.ReactElement {
  const {
    resolve,
    fallback = renderSkeleton({ className: 'h-20 w-full' }),
    errorElement,
    children,
  } = props;

  const awaitElement = createElement(RouterAwait as any, {
    resolve,
    errorElement:
      typeof errorElement === 'function'
        ? createElement((errorProps: any) => errorElement(errorProps))
        : errorElement,
    children: (resolvedData: T) => children(resolvedData),
  });

  return createElement(React.Suspense, { fallback }, awaitElement);
}

/**
 * Internal React component that evaluates useHydrated() and renders safely.
 */
function ClientOnlyInternal(props: {
  fallback?: ReactNode;
  children: () => ReactNode;
}): React.ReactElement | null {
  const hydrated = useHydrated();
  if (!hydrated) {
    return props.fallback ? createElement(Fragment, null, props.fallback) : null;
  }
  return createElement(Fragment, null, props.children());
}

/**
 * ClientOnly DSL Component
 * Safely renders browser-only content (window, localStorage, dynamic dates)
 * strictly after client-side hydration is complete, preventing hydration mismatches.
 *
 * Supported Signatures:
 * 1. ClientOnly(() => Div(...))
 * 2. ClientOnly({ fallback: Skeleton(...) }, () => Div(...))
 * 3. ClientOnly(() => Div(...), fallback)
 */
export function renderClientOnly(
  propsOrRender: ClientOnlyProps | (() => ReactNode),
  maybeRenderOrFallback?: (() => ReactNode) | ReactNode
): React.ReactElement {
  if (typeof propsOrRender === 'function') {
    const fallbackNode =
      typeof maybeRenderOrFallback === 'function' ? null : (maybeRenderOrFallback as ReactNode);
    return createElement(ClientOnlyInternal, {
      fallback: fallbackNode,
      children: propsOrRender,
    });
  }

  const renderFn =
    typeof maybeRenderOrFallback === 'function'
      ? maybeRenderOrFallback
      : propsOrRender.children || (() => null);

  return createElement(ClientOnlyInternal, {
    fallback: propsOrRender.fallback,
    children: renderFn,
  });
}

const LazyApexChart = React.lazy(async () => {
  const mod = await import('react-apexcharts');
  return { default: (mod.default || mod) as any };
});

/**
 * Chart DSL Component (Client-Only Dynamic ApexCharts Wrapper)
 * Safely loads react-apexcharts asynchronously in the browser with automatic Skeleton Loading.
 * Prevents "window is not defined" SSR errors.
 */
export function renderChart(props: ChartProps): React.ReactElement {
  const {
    type = 'line',
    series,
    options = {},
    width = '100%',
    height = 320,
    className = '',
    fallback = renderSkeleton({ className: 'h-80 w-full rounded-[var(--radius-card)]' }),
  } = props;

  return renderClientOnly({
    fallback,
    children: () =>
      createElement(
        React.Suspense,
        { fallback },
        createElement(
          'div',
          { className: cn('w-full overflow-hidden', className) },
          createElement(
            LazyApexChart as any,
            {
              type,
              series,
              options: {
                chart: {
                  background: 'transparent',
                  toolbar: { show: false },
                  fontFamily: 'inherit',
                  ...options.chart,
                },
                theme: {
                  mode:
                    typeof document !== 'undefined' &&
                    document.documentElement.classList.contains('dark')
                      ? 'dark'
                      : 'light',
                  ...options.theme,
                },
                ...options,
              },
              width,
              height,
            } as any
          )
        )
      ),
  });
}

/**
 * Print Button Component (Asynchronous React-to-Print / Window Print Trigger)
 */
export function renderPrintButton(props: PrintButtonProps): React.ReactElement {
  const {
    targetRef,
    contentRef,
    documentTitle,
    label = 'Cetak Dokumen',
    className = '',
    variant = 'secondary',
    size = 'sm',
    icon = 'Printer',
    disabled = false,
    onBeforePrint,
    onAfterPrint,
  } = props;

  const handlePrint = async () => {
    try {
      if (onBeforePrint) {
        await onBeforePrint();
      }

      const elementToPrint = targetRef?.current || contentRef?.current;
      if (elementToPrint && typeof window !== 'undefined') {
        const printModule = await import('react-to-print').catch(() => null);
        if (printModule && (printModule as any).useReactToPrint) {
          const printFn = (printModule as any).useReactToPrint({
            contentRef: targetRef || contentRef,
            documentTitle: documentTitle || document.title,
            onAfterPrint,
          });
          if (typeof printFn === 'function') {
            printFn();
            return;
          }
        }
      }

      if (typeof window !== 'undefined') {
        window.print();
        if (onAfterPrint) onAfterPrint();
      }
    } catch (err) {
      console.error('[Print] Print failed:', err);
      if (typeof window !== 'undefined') {
        window.print();
      }
    }
  };

  return renderButton({
    label,
    icon,
    variant,
    size,
    className,
    disabled,
    onClick: handlePrint,
  });
}

/**
 * Offline Banner Component (Displays floating amber bar when internet connection is lost)
 */
export function renderOfflineBanner(props: OfflineBannerProps = {}): React.ReactElement | null {
  const {
    message = 'Koneksi internet terputus. Menjalankan dalam mode offline aman.',
    className = '',
  } = props;

  return renderClientOnly(() => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline) return null;

    return createElement(
      'div',
      {
        className: cn(
          'sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/90 text-amber-950 font-medium text-xs backdrop-blur-xs border-b border-amber-600 shadow-sm animate-in slide-in-from-top duration-200',
          className
        ),
      },
      renderIcon('WifiOff', { size: 14, className: 'shrink-0' }),
      createElement('span', null, message)
    );
  });
}

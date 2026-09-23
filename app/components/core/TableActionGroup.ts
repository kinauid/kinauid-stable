import React, { createElement } from 'react';
import { renderIcon as Icon } from '~/builder/components';
import { cn } from '~/lib/utils';

export interface TableActionButtonProps {
  icon: string;
  title?: string;
  tooltip?: string;
  label?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'amber' | 'blue';
  className?: string;
  href?: string;
  target?: string;
}

export interface TableActionGroupProps {
  children?: React.ReactNode;
  items?: TableActionButtonProps[];
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

const variantStyles: Record<string, string> = {
  default: 'text-slate-500 hover:text-slate-900 hover:bg-white',
  primary: 'text-slate-500 hover:text-[#103557] hover:bg-white',
  blue: 'text-slate-500 hover:text-blue-600 hover:bg-white',
  success: 'text-slate-500 hover:text-emerald-600 hover:bg-white',
  warning: 'text-slate-500 hover:text-amber-600 hover:bg-white',
  amber: 'text-slate-500 hover:text-amber-600 hover:bg-white',
  danger: 'text-slate-500 hover:text-rose-600 hover:bg-white',
  info: 'text-slate-500 hover:text-cyan-600 hover:bg-white',
};

export function TableActionButton(props: TableActionButtonProps): React.ReactElement {
  const {
    icon,
    title,
    tooltip,
    label,
    onClick,
    disabled = false,
    variant = 'default',
    className = '',
    href,
    target,
  } = props;

  const resolvedTooltip = tooltip || title;
  const styleVariant = variantStyles[variant] || variantStyles.default;

  const commonClasses = cn(
    'p-1.5 rounded-md transition-all duration-150 inline-flex items-center justify-center gap-1 text-xs cursor-pointer select-none',
    styleVariant,
    disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
    className
  );

  if (href) {
    return createElement(
      'a',
      {
        href,
        target,
        rel: target === '_blank' ? 'noopener noreferrer' : undefined,
        title: resolvedTooltip,
        className: commonClasses,
        onClick,
      },
      Icon(icon, { className: 'w-3.5 h-3.5' }),
      label ? createElement('span', { className: 'font-medium' }, label) : null
    );
  }

  return createElement(
    'button',
    {
      type: 'button',
      title: resolvedTooltip,
      disabled,
      className: commonClasses,
      onClick,
    },
    Icon(icon, { className: 'w-3.5 h-3.5' }),
    label ? createElement('span', { className: 'font-medium' }, label) : null
  );
}

/**
 * TableActionGroup
 * Enclosed badge-style container for table row actions (WR1 SIAKAD / BAAK & Kinau standard).
 */
export function TableActionGroup(props: TableActionGroupProps): React.ReactElement {
  const { children, items, className = '', size = 'sm' } = props;

  const sizeClasses = {
    xs: 'p-0.5 gap-1',
    sm: 'p-1 gap-1.5',
    md: 'p-1.5 gap-2',
  }[size];

  return createElement(
    'div',
    {
      className: cn(
        'inline-flex items-center justify-center bg-[#F1F5F9] rounded-lg border border-slate-200/80 shadow-2xs',
        sizeClasses,
        className
      ),
    },
    items ? items.map((item, idx) => createElement(TableActionButton, { key: idx, ...item })) : children
  );
}

export const ActionBadgeGroup = TableActionGroup;
export const ActionBadgeButton = TableActionButton;

import React, {
  createContext,
  useContext,
  createElement,
  Fragment,
  isValidElement,
  cloneElement,
} from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { cn } from '~/lib/utils';
import {
  type AuthUser,
  type Role,
  type Permission,
  hasPermission,
  hasRole,
} from '~/constants/permissions';

export type LayoutPreset =
  | 'flex'
  | 'col'
  | 'row'
  | 'between'
  | 'center'
  | 'start'
  | 'end'
  | 'wrap'
  | 'col-center'
  | 'row-center';

// ==========================================
// 1. RBAC Context & Permission Provider
// ==========================================
export interface PermissionContextValue {
  user: AuthUser | null;
  can: (permission: Permission | string | (Permission | string)[], requireAll?: boolean) => boolean;
  hasRole: (role: Role | string | (Role | string)[]) => boolean;
}

export const PermissionContext = createContext<PermissionContextValue>({
  user: null,
  can: () => false,
  hasRole: () => false,
});

export function useAuthPermission(): PermissionContextValue {
  return useContext(PermissionContext);
}

export function PermissionProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children?: ReactNode;
}): React.ReactElement {
  const value: PermissionContextValue = {
    user,
    can: (perm, requireAll = false) => hasPermission(user, perm, requireAll),
    hasRole: (role) => hasRole(user, role),
  };

  return createElement(PermissionContext.Provider, { value }, children);
}

export interface PermissionGuardProps {
  guard?: Permission | string | (Permission | string)[];
  guardRole?: Role | string | (Role | string)[];
  guardMode?: 'hide' | 'disable';
  requireAll?: boolean;
  fallback?: ReactNode;
  children?: ReactNode;
}

/**
 * Declarative Permission Guard Component.
 * Hides or disables wrapped children based on user permissions or roles.
 */
export function PermissionGuard({
  guard,
  guardRole,
  guardMode = 'hide',
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps): React.ReactElement | null {
  const { can, hasRole: checkRole } = useAuthPermission();

  let hasAccess = true;

  if (guardRole) {
    hasAccess = checkRole(guardRole);
  }

  if (hasAccess && guard) {
    hasAccess = can(guard, requireAll);
  }

  if (hasAccess) {
    return createElement(Fragment, null, children);
  }

  if (guardMode === 'hide') {
    return fallback ? createElement(Fragment, null, fallback) : null;
  }

  // mode === 'disable'
  if (isValidElement(children)) {
    const childProps = (children as React.ReactElement<any>).props || {};
    return cloneElement(children as React.ReactElement<any>, {
      ...childProps,
      disabled: true,
      'aria-disabled': 'true',
      title: childProps.title || 'Akses terbatas: Anda tidak memiliki izin untuk aksi ini',
      className: cn(
        childProps.className,
        'opacity-50 cursor-not-allowed pointer-events-none select-none'
      ),
    });
  }

  return createElement(
    'span',
    {
      className: 'opacity-50 cursor-not-allowed select-none',
      title: 'Akses terbatas: Anda tidak memiliki izin untuk aksi ini',
      'aria-disabled': 'true',
    },
    children
  );
}

// ==========================================
// 2. High-Performance Micro-Renderer Engine
// ==========================================

export function isPropsObject(val: unknown): val is Record<string, any> {
  if (val === null || typeof val !== 'object') return false;
  if (Array.isArray(val)) return false;
  if (isValidElement(val)) return false;
  if (val instanceof FluentBuilder) return false;
  return true;
}

export function isSafeChild(val: unknown): val is ReactNode {
  return val !== undefined && val !== null && typeof val !== 'boolean';
}

export function sanitizeChild(child: unknown): ReactNode | null {
  if (!isSafeChild(child)) return null;
  if (child instanceof FluentBuilder) {
    return child.build();
  }
  return child as ReactNode;
}

/**
 * Fast-path iterative children flattening into a pre-allocated target array
 */
function collectChildrenInto(target: ReactNode[], items: any[]) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item === undefined || item === null || typeof item === 'boolean') {
      continue;
    }
    if (Array.isArray(item)) {
      collectChildrenInto(target, item);
    } else if (item instanceof FluentBuilder) {
      target.push(item.build());
    } else {
      target.push(item as ReactNode);
    }
  }
}

/**
 * Parses CSS inline style string safely into React CSSProperties object
 */
export function parseStyleString(styleStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!styleStr || typeof styleStr !== 'string') return result;
  const declarations = styleStr.split(';');
  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const key = decl.slice(0, colonIdx).trim();
    const value = decl.slice(colonIdx + 1).trim();
    if (!key || !value) continue;
    const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * Optimized argument normalization to minimize GC pressure
 */
export function normalizeArgs(args: any[]): { props: Record<string, any>; children: ReactNode[] } {
  const len = args.length;
  if (len === 0) {
    return { props: {}, children: [] };
  }

  const first = args[0];

  if (isPropsObject(first)) {
    const { children: propsChildren, style: rawStyle, ...cleanProps } = first;
    const children: ReactNode[] = [];

    // Sanitize string style prop
    if (typeof rawStyle === 'string') {
      cleanProps.style = parseStyleString(rawStyle);
    } else if (rawStyle !== undefined) {
      cleanProps.style = rawStyle;
    }

    if (propsChildren !== undefined && propsChildren !== null) {
      if (Array.isArray(propsChildren)) {
        collectChildrenInto(children, propsChildren);
      } else if (propsChildren instanceof FluentBuilder) {
        children.push(propsChildren.build());
      } else if (isSafeChild(propsChildren)) {
        children.push(propsChildren);
      }
    }

    if (len > 1) {
      for (let i = 1; i < len; i++) {
        const arg = args[i];
        if (Array.isArray(arg)) {
          collectChildrenInto(children, arg);
        } else if (arg instanceof FluentBuilder) {
          children.push(arg.build());
        } else if (isSafeChild(arg)) {
          children.push(arg);
        }
      }
    }

    return { props: cleanProps, children };
  }

  const children: ReactNode[] = [];
  collectChildrenInto(children, args);
  return { props: {}, children };
}

/**
 * Functional Element Creator & Hydration Safeguard
 */
export function createElementDSL(type: any, ...args: any[]): React.ReactElement | null {
  if (!type || typeof type === 'boolean') {
    return null;
  }

  // Ultra-fast path for zero-args or single text/child
  const len = args.length;
  if (len === 0) {
    return createElement(type, null);
  }
  if (len === 1 && !isPropsObject(args[0])) {
    const sanitized = sanitizeChild(args[0]);
    return createElement(type, null, sanitized);
  }

  const { props, children } = normalizeArgs(args);
  return createElement(type, props, ...children);
}

export const renderElement = createElementDSL;

// ==========================================
// 3. Ultra-Concise Fluent Builder & Shorthands
// ==========================================

export class FluentBuilder<T extends keyof HTMLElementTagNameMap | any = any> {
  private tag: T;
  private props: Record<string, any> = {};
  private childNodes: ReactNode[] = [];
  private guardConfig?: {
    guard?: Permission | string | (Permission | string)[];
    guardRole?: Role | string | (Role | string)[];
    guardMode: 'hide' | 'disable';
    requireAll?: boolean;
    fallback?: ReactNode;
  };

  constructor(tag: T) {
    this.tag = tag;
  }

  class(className: string | undefined | null | false): this {
    if (className) {
      this.props.className = cn(this.props.className, className);
    }
    return this;
  }

  // --- Layout & Flex Shorthands ---
  layout(preset: LayoutPreset): this {
    const layoutMap: Record<LayoutPreset, string> = {
      flex: 'flex',
      col: 'flex flex-col',
      row: 'flex flex-row',
      between: 'flex items-center justify-between',
      center: 'flex items-center justify-center',
      start: 'flex items-start justify-start',
      end: 'flex items-end justify-end',
      wrap: 'flex flex-wrap items-center',
      'col-center': 'flex flex-col items-center justify-center',
      'row-center': 'flex items-center',
    };
    return this.class(layoutMap[preset] || 'flex');
  }

  row(): this {
    return this.class('flex flex-row items-center');
  }

  col(): this {
    return this.class('flex flex-col');
  }

  between(): this {
    return this.class('flex items-center justify-between');
  }

  center(): this {
    return this.class('flex items-center justify-center');
  }

  start(): this {
    return this.class('flex items-start justify-start');
  }

  end(): this {
    return this.class('flex items-end justify-end');
  }

  wrap(): this {
    return this.class('flex flex-wrap items-center');
  }

  grid(cols: number | string = 2, gap: string = '3'): this {
    const colClass = typeof cols === 'number' ? `grid-cols-${cols}` : cols;
    const gapClass = gap.startsWith('gap-') ? gap : `gap-${gap}`;
    return this.class(cn('grid', colClass, gapClass));
  }

  // --- Spacing & Dimension Shorthands ---
  p(val: number | string): this {
    const cls =
      typeof val === 'number' || !isNaN(Number(val))
        ? `p-${val}`
        : val.startsWith('p-')
          ? val
          : `p-[${val}]`;
    return this.class(cls);
  }

  px(val: number | string): this {
    const cls =
      typeof val === 'number' || !isNaN(Number(val))
        ? `px-${val}`
        : val.startsWith('px-')
          ? val
          : `px-[${val}]`;
    return this.class(cls);
  }

  py(val: number | string): this {
    const cls =
      typeof val === 'number' || !isNaN(Number(val))
        ? `py-${val}`
        : val.startsWith('py-')
          ? val
          : `py-[${val}]`;
    return this.class(cls);
  }

  pt(val: number | string): this {
    return this.class(`pt-${val}`);
  }

  pb(val: number | string): this {
    return this.class(`pb-${val}`);
  }

  m(val: number | string): this {
    return this.class(`m-${val}`);
  }

  mx(val: number | string): this {
    return this.class(`mx-${val}`);
  }

  my(val: number | string): this {
    return this.class(`my-${val}`);
  }

  mt(val: number | string): this {
    return this.class(`mt-${val}`);
  }

  mb(val: number | string): this {
    return this.class(`mb-${val}`);
  }

  gap(val: number | string): this {
    const cls =
      typeof val === 'number' || !isNaN(Number(val))
        ? `gap-${val}`
        : val.startsWith('gap-')
          ? val
          : `gap-[${val}]`;
    return this.class(cls);
  }

  w(val: string | number): this {
    const cls = typeof val === 'number' ? `w-${val}` : val.startsWith('w-') ? val : `w-${val}`;
    return this.class(cls);
  }

  h(val: string | number): this {
    const cls = typeof val === 'number' ? `h-${val}` : val.startsWith('h-') ? val : `h-${val}`;
    return this.class(cls);
  }

  maxW(val: string): this {
    return this.class(`max-w-${val}`);
  }

  minH(val: string): this {
    return this.class(`min-h-${val}`);
  }

  // --- Visual & Typography Shorthands ---
  bg(colorClass: string): this {
    const cls =
      colorClass.startsWith('bg-') || colorClass.includes('/') || colorClass.includes('var(')
        ? colorClass
        : `bg-${colorClass}`;
    return this.class(cls);
  }

  text(colorOrSize: string): this {
    const cls =
      colorOrSize.startsWith('text-') || colorOrSize.includes('/') || colorOrSize.includes('var(')
        ? colorOrSize
        : `text-${colorOrSize}`;
    return this.class(cls);
  }

  rounded(val: string = 'lg'): this {
    const cls = val.startsWith('rounded') ? val : `rounded-${val}`;
    return this.class(cls);
  }

  border(colorClass?: string): this {
    if (!colorClass) {
      return this.class('border border-[var(--border)]');
    }
    const cls = colorClass.startsWith('border') ? colorClass : `border border-${colorClass}`;
    return this.class(cls);
  }

  shadow(val: string = 'sm'): this {
    const cls = val.startsWith('shadow') ? val : `shadow-${val}`;
    return this.class(cls);
  }

  font(weight: string = 'medium'): this {
    return this.class(`font-${weight}`);
  }

  opacity(val: string | number): this {
    return this.class(`opacity-${val}`);
  }

  truncate(): this {
    return this.class('truncate');
  }

  pointer(): this {
    return this.class('cursor-pointer');
  }

  selectNone(): this {
    return this.class('select-none');
  }

  hover(hoverClass: string): this {
    const cls = hoverClass.startsWith('hover:') ? hoverClass : `hover:${hoverClass}`;
    return this.class(cls);
  }

  // --- Semantic Color Presets ---
  green(): this {
    return this.class('text-emerald-500 bg-emerald-500/10 border border-emerald-500/20');
  }

  red(): this {
    return this.class('text-red-500 bg-red-500/10 border border-red-500/20');
  }

  blue(): this {
    return this.class('text-blue-500 bg-blue-500/10 border border-blue-500/20');
  }

  amber(): this {
    return this.class('text-amber-500 bg-amber-500/10 border border-amber-500/20');
  }

  cyan(): this {
    return this.class('text-cyan-500 bg-cyan-500/10 border border-cyan-500/20');
  }

  purple(): this {
    return this.class('text-purple-500 bg-purple-500/10 border border-purple-500/20');
  }

  gray(): this {
    return this.class(
      'text-[var(--muted-foreground)] bg-[var(--surface-subtle)] border border-[var(--border)]'
    );
  }

  style(styleObj: CSSProperties): this {
    this.props.style = { ...this.props.style, ...styleObj };
    return this;
  }

  attr(key: string, value: any): this {
    if (key === 'style' && typeof value === 'string') {
      this.props.style = { ...this.props.style, ...parseStyleString(value) };
    } else {
      this.props[key] = value;
    }
    return this;
  }

  on(event: string, handler: (...args: any[]) => void): this {
    const eventName = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
    this.props[eventName] = handler;
    return this;
  }

  guard(
    permission: Permission | string | (Permission | string)[],
    mode: 'hide' | 'disable' = 'hide',
    fallback?: ReactNode,
    requireAll: boolean = false
  ): this {
    this.guardConfig = {
      ...this.guardConfig,
      guard: permission,
      guardMode: mode,
      requireAll,
      fallback,
    };
    return this;
  }

  guardRole(
    role: Role | string | (Role | string)[],
    mode: 'hide' | 'disable' = 'hide',
    fallback?: ReactNode
  ): this {
    this.guardConfig = {
      ...this.guardConfig,
      guardRole: role,
      guardMode: mode,
      fallback,
    };
    return this;
  }

  custom(rawJsxOrNode: ReactNode | ((...args: any[]) => ReactNode)): this {
    if (typeof rawJsxOrNode === 'function') {
      this.childNodes.push(createElement(rawJsxOrNode as any));
    } else {
      const sanitized = sanitizeChild(rawJsxOrNode);
      if (sanitized !== null) {
        this.childNodes.push(sanitized);
      }
    }
    return this;
  }

  childrenOf(...children: (ReactNode | ReactNode[] | FluentBuilder<any>)[]): this {
    collectChildrenInto(this.childNodes, children);
    return this;
  }

  children(...children: (ReactNode | ReactNode[] | FluentBuilder<any>)[]): this {
    return this.childrenOf(...children);
  }

  build(): React.ReactElement {
    const element = createElement(this.tag as any, this.props, ...this.childNodes);
    if (this.guardConfig) {
      return createElement(PermissionGuard, { ...this.guardConfig }, element);
    }
    return element;
  }
}

/**
 * Fluent chaining entry function: ui('div').p(4).row().between().childrenOf(...)
 */
export function ui<T extends keyof HTMLElementTagNameMap | any>(tag: T): FluentBuilder<T> {
  return new FluentBuilder(tag);
}

export function Custom(rawElement: ReactNode): React.ReactElement {
  return createElement(Fragment, null, rawElement);
}

/**
 * Base Proxy UI Factory
 */
export const baseUI = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (prop === 'create' || prop === 'renderElement') {
        return (type: any, ...args: any[]) => createElementDSL(type, ...args);
      }
      if (prop === 'custom' || prop === 'Custom') {
        return (raw: ReactNode) => Custom(raw);
      }
      if (prop === 'guard' || prop === 'PermissionGuard') {
        return (props: PermissionGuardProps) => createElement(PermissionGuard, props);
      }
      if (prop === 'Fragment') {
        return (...children: ReactNode[]) => {
          const target: ReactNode[] = [];
          collectChildrenInto(target, children);
          return createElement(Fragment, null, ...target);
        };
      }
      const tag = typeof prop === 'string' ? prop.toLowerCase() : prop;
      return (...args: any[]) => createElementDSL(tag, ...args);
    },
  }
) as Record<string, (...args: any[]) => React.ReactElement> & {
  create: (type: any, ...args: any[]) => React.ReactElement;
  renderElement: (type: any, ...args: any[]) => React.ReactElement;
  custom: (raw: ReactNode) => React.ReactElement;
  Custom: (raw: ReactNode) => React.ReactElement;
  guard: (props: PermissionGuardProps) => React.ReactElement;
  PermissionGuard: (props: PermissionGuardProps) => React.ReactElement;
  Fragment: (...children: ReactNode[]) => React.ReactElement;
};

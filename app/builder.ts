import React, { useMemo, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  useLoaderData,
  useActionData,
  useFetcher,
  useNavigate,
  useLocation,
  useParams,
  useMatches,
  useNavigation,
  useRouteLoaderData,
} from 'react-router';
import { cn } from '~/lib/utils';
import {
  baseUI,
  ui,
  createElementDSL,
  renderElement,
  FluentBuilder,
  Custom,
  PermissionProvider,
  PermissionGuard,
  useAuthPermission,
  isSafeChild,
  sanitizeChild,
  isPropsObject,
} from './builder/proxy';
import {
  renderBreadcrumb,
  renderCard,
  renderBadge,
  renderButton,
  renderSubmitButton,
  renderTable,
  renderInput,
  renderSelect,
  renderTextarea,
  renderModal,
  renderForm,
  renderLink,
  renderIcon,
  renderSuspense,
  renderAwait,
  renderSkeleton,
  renderClientOnly,
  renderChart,
  renderPrintButton,
  renderOfflineBanner,
  renderDataTableCard,
  renderTableActionGroup,
  renderTableActionButton,
  DataTableCard as SharedDataTableCard,
  TableActionGroup as SharedTableActionGroup,
  TableActionButton as SharedTableActionButton,
  ActionBadgeGroup as SharedActionBadgeGroup,
  ActionBadgeButton as SharedActionBadgeButton,
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
} from './builder/components';
export type {
  DataTableCardProps,
  DataTableCardColumn,
  TableStatItem,
  TableMainAction,
  TableTabItem,
  TableActionItem,
  ActiveFilterItem,
  TableBannerConfig,
  TableActionGroupProps,
  TableActionButtonProps,
};
import { useEncryptedState, useHydrated, useNetworkStatus, useIsMobile } from './builder/hooks';
export { useEncryptedState, useHydrated, useNetworkStatus, useIsMobile };
import { generateBreadcrumbs } from './builder/breadcrumbs';
import { GlobalModalRenderer } from '~/providers/modal';
import { createMeta, type CreateMetaOptions } from '~/lib/seo';
import {
  cacheHeaders,
  applyCacheHeaders,
  type CachePreset,
  type CacheControlOptions,
} from '~/lib/cache';
import {
  type AuthUser,
  type Role,
  type Permission,
  type MetaAccessConfig,
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasRole,
  hasPermission,
  getUserPermissions,
  checkMetaAccess,
} from '~/constants/permissions';
import { routes } from '~/utils/routes';
import { logger } from '~/utils/logger';
import {
  t,
  getLanguageFromRequest,
  setLanguageCookieHeader,
  formatNumber,
  type SupportedLanguage,
  type I18nKey,
} from '~/utils/i18n';
import { type Theme, DEFAULT_THEME } from '~/utils/theme';
import type {
  MiddlewareFunction,
  MiddlewareContext,
  MiddlewareArgs,
  RouteHandler,
} from '~/lib/middleware.server';
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
  SuspenseProps,
  AwaitProps,
  SkeletonProps,
  ClientOnlyProps,
  ChartProps,
  PrintButtonProps,
  OfflineBannerProps,
  FeatureViewContext,
  FeatureViewRenderer,
  PageDefinition,
  DefineRouteConfig,
  InferLoader,
  InferAction,
} from './builder/types';

export * from './builder/types';
export * from './builder/proxy';
export * from './builder/hooks';
export * from './builder/breadcrumbs';
export * from '~/constants/permissions';
export * from '~/utils/cryptoState';
export * from '~/utils/cache';
export * from '~/utils/routes';
export * from '~/utils/logger';
export * from '~/utils/i18n';
export * from '~/utils/theme';
export * from '~/lib/seo';
export * from '~/lib/cache';
export * from '~/utils/apiResponse';
export * from '~/utils/dialog';
export * from '~/utils/resource';
export * from '~/providers/modal';
export * from '~/components/core';
export * from '~/components/shared';
export * from '~/components/feature';
export type { MiddlewareFunction, MiddlewareContext, MiddlewareArgs, RouteHandler };

/**
 * createPage
 * Defines a Hybrid Feature Page Presentation using Pure .ts Functional DSL.
 * Passes { data, result, send, urlState, updateUrlState, user, can, hasRole, ... } to the render view.
 * Supports chaining `.meta(...)`, `.headers(...)`, and `.access(...)` for dynamic SEO, HTTP caching, and RBAC.
 */
export function createPage<
  TLoader = any,
  TAction = any,
  TState extends Record<string, any> = Record<string, any>,
>(
  render: FeatureViewRenderer<TLoader, TAction, TState>,
  options?: { defaultState?: TState; key?: string }
): PageDefinition<TLoader, TAction, TState> & (() => React.ReactElement) {
  // 1. Page Component Wrapper (Callable directly if used as route default)
  const PageComponent = function RoutePageComponent() {
    const rawLoaderData = useLoaderData<TLoader>();
    const actionData = useActionData<TAction>();
    const [state, setState] = useEncryptedState<TState>(options?.defaultState || ({} as TState));
    const fetcher = useFetcher<any>();
    const navigate = useNavigate();
    const navigation = useNavigation();
    const location = useLocation();
    const params = useParams();
    const matches = useMatches();

    const isNavigating = navigation.state !== 'idle';
    const navigationState = navigation.state;
    const isSubmitting = navigation.state === 'submitting';
    const isLoading = navigation.state === 'loading';

    const currentMatch = matches[matches.length - 1];
    const key =
      options?.key ||
      currentMatch?.id?.replace(/^routes\//, '').replace(/\.ts$/, '') ||
      location.pathname.replace(/^\//, '').replace(/\//g, '.') ||
      '_index';

    const breadcrumbs = useMemo(() => generateBreadcrumbs(key), [key]);

    const flash = (rawLoaderData as any)?.flash ?? null;
    const data =
      (rawLoaderData as any)?.data !== undefined ? (rawLoaderData as any).data : rawLoaderData;

    const rootData = useRouteLoaderData<any>('root');
    const isOnline = useNetworkStatus();

    // User & RBAC Context Resolution
    const user: AuthUser | null =
      (rawLoaderData as any)?.user ?? (rawLoaderData as any)?.data?.user ?? rootData?.user ?? null;

    const can = useCallback(
      (permission: Permission | string | (Permission | string)[], requireAll = false) =>
        hasPermission(user, permission, requireAll),
      [user]
    );

    const checkRole = useCallback(
      (role: Role | string | (Role | string)[]) => hasRole(user, role),
      [user]
    );

    // Theme Management (Reads Cookie/Root, Syncs DOM and localStorage)
    const initialTheme: Theme =
      rootData?.theme ||
      (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'dark');
    const [theme, setThemeState] = useState<Theme>(initialTheme);

    const setTheme = useCallback((nextTheme: Theme) => {
      setThemeState(nextTheme);
      if (typeof document !== 'undefined') {
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
        }
        document.cookie = `theme=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
        try {
          localStorage.setItem('theme', nextTheme);
        } catch (e) {}
      }
    }, []);

    const toggleTheme = useCallback(() => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    // Dual Language i18n Management (ID & EN)
    const initialLang: SupportedLanguage = rootData?.lang || 'id';
    const [currentLang, setLangState] = useState<SupportedLanguage>(initialLang);

    const setLang = useCallback((nextLang: SupportedLanguage) => {
      setLangState(nextLang);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('lang', nextLang);
        document.cookie = `lang=${nextLang}; Path=/; Max-Age=31536000; SameSite=Lax`;
        try {
          localStorage.setItem('lang', nextLang);
        } catch (e) {}
      }
    }, []);

    const toggleLang = useCallback(() => {
      setLang(currentLang === 'id' ? 'en' : 'id');
    }, [currentLang, setLang]);

    const translate = useCallback(
      (key: string, params?: Record<string, string | number>) => t(key, params, currentLang),
      [currentLang]
    );

    const ctx: FeatureViewContext<TLoader, TAction, TState> = {
      // Primary Aliases
      data,
      result: actionData,
      send: fetcher,
      urlState: state,
      updateUrlState: setState,

      // RBAC & Permission Guards
      user,
      can,
      hasRole: checkRole,

      // Hydration & Navigation State Guards
      isNavigating,
      navigationState,
      isSubmitting,
      isLoading,
      navigation,

      // Enterprise Theme & Dual Language (i18n)
      theme,
      toggleTheme,
      setTheme,
      t: translate,
      currentLang,
      setLang,
      toggleLang,

      // Network Offline / Resilience Guard
      isOnline,

      // Ecosystem Aliases
      actionData,
      state,
      setState,
      fetcher,
      navigate,
      location,
      params,
      breadcrumbs,
      flash,
    };

    const rendered = render(ctx);
    const childNode = (
      rendered instanceof FluentBuilder ? rendered.build() : rendered
    ) as ReactNode;
    return React.createElement(
      PermissionProvider,
      { user },
      React.createElement(
        React.Fragment,
        null,
        childNode,
        React.createElement(GlobalModalRenderer, null)
      )
    );
  };

  PageComponent.displayName = 'HybridFeaturePage';

  // Attach definition properties so global-handler / scanners can inspect metadata
  (PageComponent as any).render = render;
  (PageComponent as any).defaultState = options?.defaultState;
  (PageComponent as any).key = options?.key;

  // Fluent .meta() chaining
  (PageComponent as any).meta = function withMeta(metaConfig: any) {
    (PageComponent as any)._meta = createMeta(metaConfig);
    return PageComponent;
  };

  // Fluent .headers() chaining
  (PageComponent as any).headers = function withHeaders(headersConfig: any) {
    (PageComponent as any)._headers =
      typeof headersConfig === 'function' ? headersConfig : cacheHeaders(headersConfig);
    return PageComponent;
  };

  // Fluent .access() chaining
  (PageComponent as any).access = function withAccess(accessConfig: MetaAccessConfig) {
    (PageComponent as any).metaAccess = accessConfig;
    return PageComponent;
  };

  return PageComponent as unknown as PageDefinition<TLoader, TAction, TState> &
    (() => React.ReactElement);
}

/**
 * defineRoute
 * Single-file route definition helper providing end-to-end automatic type inference
 * across loader, action, meta, headers, and UI render callback.
 */
export function defineRoute<
  TLoaderFn extends ((...args: any[]) => any) | undefined = undefined,
  TActionFn extends ((...args: any[]) => any) | undefined = undefined,
  TState extends Record<string, any> = Record<string, any>,
>(config: DefineRouteConfig<TLoaderFn, TActionFn, TState>) {
  const page = createPage<InferLoader<TLoaderFn>, InferAction<TActionFn>, TState>(config.render, {
    defaultState: config.defaultState,
    key: config.key,
  });

  if (config.metaAccess) {
    (page as any).metaAccess = config.metaAccess;
  }

  let metaFn = undefined;
  if (config.meta) {
    metaFn =
      typeof config.meta === 'function' && !(config.meta as any)._isMetaConfig
        ? config.meta
        : createMeta(config.meta as any);
  }

  let headersFn = undefined;
  if (config.headers) {
    headersFn =
      typeof config.headers === 'function' ? config.headers : cacheHeaders(config.headers);
  }

  return {
    loader: config.loader,
    action: config.action,
    metaAccess: config.metaAccess,
    meta: metaFn,
    headers: headersFn,
    default: page,
  };
}

// Shorthand Functional DSL helpers
export const Div = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.div(props, ...children);
export const Row = (
  propsOrFirstChild: any = {},
  ...restChildren: (ReactNode | FluentBuilder<any>)[]
) => {
  if (isPropsObject(propsOrFirstChild)) {
    const { className, ...cleanProps } = propsOrFirstChild;
    return baseUI.div(
      { ...cleanProps, className: cn('flex flex-row items-center gap-2', className) },
      ...restChildren
    );
  }
  return baseUI.div(
    { className: 'flex flex-row items-center gap-2' },
    propsOrFirstChild,
    ...restChildren
  );
};
export const Col = (
  propsOrFirstChild: any = {},
  ...restChildren: (ReactNode | FluentBuilder<any>)[]
) => {
  if (isPropsObject(propsOrFirstChild)) {
    const { className, ...cleanProps } = propsOrFirstChild;
    return baseUI.div(
      { ...cleanProps, className: cn('flex flex-col gap-2', className) },
      ...restChildren
    );
  }
  return baseUI.div({ className: 'flex flex-col gap-2' }, propsOrFirstChild, ...restChildren);
};
export const Span = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.span(props, ...children);
export const P = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.p(props, ...children);
export const H1 = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.h1(props, ...children);
export const H2 = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.h2(props, ...children);
export const H3 = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.h3(props, ...children);
export const Section = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.section(props, ...children);
export const Main = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.main(props, ...children);
export const Header = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.header(props, ...children);
export const Aside = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.aside(props, ...children);
export const Nav = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.nav(props, ...children);
export const Ul = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.ul(props, ...children);
export const Li = (props: any = {}, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  baseUI.li(props, ...children);

export const Card = (props: CardProps, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  renderCard(props, ...children);
export const Badge = (props: BadgeProps) => renderBadge(props);
export const Button = (props: ButtonProps) => renderButton(props);
export const SubmitButton = (props: SubmitButtonProps) => renderSubmitButton(props);
export const Table = <T = any>(props: TableProps<T>) => renderTable<T>(props);
export const DataTableCard = <T = any>(props: DataTableCardProps<T>) => renderDataTableCard<T>(props);
export const TableCard = <T = any>(props: DataTableCardProps<T>) => renderDataTableCard<T>(props);
export const TableActionGroup = (props: TableActionGroupProps) => renderTableActionGroup(props);
export const TableActionButton = (props: TableActionButtonProps) => renderTableActionButton(props);
export const ActionBadgeGroup = (props: TableActionGroupProps) => renderTableActionGroup(props);
export const ActionBadgeButton = (props: TableActionButtonProps) => renderTableActionButton(props);

export const Input = (props: InputProps) => renderInput(props);
export const Select = (props: SelectProps) => renderSelect(props);
export const Textarea = (props: TextareaProps) => renderTextarea(props);
export const Modal = (props: ModalProps, ...children: (ReactNode | FluentBuilder<any>)[]) =>
  renderModal(props, ...children);
export const Form = (
  propsOrOnSubmit:
    FormProps | ((values: Record<string, any>, e: React.FormEvent<HTMLFormElement>) => void) = {},
  ...children: (ReactNode | FluentBuilder<any>)[]
) => renderForm(propsOrOnSubmit, ...children);
export const Breadcrumb = (props: { items: BreadcrumbItem[]; className?: string }) =>
  renderBreadcrumb(props);
export const Link = (
  props: {
    to: string;
    key?: React.Key;
    className?: string;
    replace?: boolean;
    prefetch?: 'none' | 'intent' | 'render';
  },
  ...children: (ReactNode | FluentBuilder<any>)[]
) => renderLink(props, ...children);
export const Icon = (
  name: string,
  options?: { size?: number; className?: string; color?: string }
) => renderIcon(name, options);
export const Suspense = (
  props: SuspenseProps = {},
  ...children: (ReactNode | FluentBuilder<any>)[]
) => renderSuspense(props, ...children);
export const Await = <T = any>(props: AwaitProps<T>) => renderAwait<T>(props);
export const Skeleton = (props: SkeletonProps = {}) => renderSkeleton(props);
export const ClientOnly = (
  propsOrRender: ClientOnlyProps | (() => ReactNode),
  maybeRenderOrFallback?: (() => ReactNode) | ReactNode
) => renderClientOnly(propsOrRender, maybeRenderOrFallback);
export const Chart = (props: ChartProps) => renderChart(props);
export const PrintButton = (props: PrintButtonProps) => renderPrintButton(props);
export const OfflineBanner = (props: OfflineBannerProps = {}) => renderOfflineBanner(props);

export {
  Custom,
  renderElement,
  renderChart,
  renderPrintButton,
  renderOfflineBanner,
  isSafeChild,
  sanitizeChild,
};

/**
 * Enhanced UI DSL Proxy Factory
 */
export const UI = new Proxy(baseUI, {
  get(target, prop: string) {
    switch (prop) {
      case 'Row':
      case 'row':
        return Row;
      case 'Col':
      case 'col':
        return Col;
      case 'Div':
      case 'div':
        return Div;
      case 'P':
      case 'p':
        return P;
      case 'Span':
      case 'span':
        return Span;
      case 'H1':
      case 'h1':
        return H1;
      case 'H2':
      case 'h2':
        return H2;
      case 'H3':
      case 'h3':
        return H3;
      case 'Section':
      case 'section':
        return Section;
      case 'Main':
      case 'main':
        return Main;
      case 'Header':
      case 'header':
        return Header;
      case 'Aside':
      case 'aside':
        return Aside;
      case 'Nav':
      case 'nav':
        return Nav;
      case 'Ul':
      case 'ul':
        return Ul;
      case 'Li':
      case 'li':
        return Li;
      case 'Breadcrumb':
        return Breadcrumb;
      case 'Card':
        return Card;
      case 'Badge':
        return Badge;
      case 'Button':
        return Button;
      case 'SubmitButton':
        return SubmitButton;
      case 'Table':
        return Table;
      case 'DataTableCard':
      case 'dataTableCard':
        return DataTableCard;
      case 'TableCard':
      case 'tableCard':
        return TableCard;
      case 'Input':
        return Input;
      case 'Select':
        return Select;
      case 'Textarea':
        return Textarea;
      case 'Modal':
        return Modal;
      case 'Form':
        return Form;
      case 'Link':
        return Link;
      case 'Icon':
        return Icon;
      case 'Suspense':
        return Suspense;
      case 'Await':
        return Await;
      case 'Skeleton':
        return Skeleton;
      case 'ClientOnly':
      case 'clientOnly':
        return ClientOnly;
      case 'Chart':
      case 'chart':
        return Chart;
      case 'Print':
      case 'print':
      case 'PrintButton':
      case 'printButton':
        return PrintButton;
      case 'OfflineBanner':
      case 'offlineBanner':
        return OfflineBanner;
      case 'Custom':
      case 'custom':
        return Custom;
      case 'renderElement':
      case 'create':
        return renderElement;
      default:
        return (target as any)[prop];
    }
  },
}) as typeof baseUI & {
  Breadcrumb: typeof Breadcrumb;
  Card: typeof Card;
  Badge: typeof Badge;
  Button: typeof Button;
  SubmitButton: typeof SubmitButton;
  Table: typeof Table;
  DataTableCard: typeof DataTableCard;
  TableCard: typeof TableCard;
  Input: typeof Input;
  Select: typeof Select;
  Textarea: typeof Textarea;
  Modal: typeof Modal;
  Form: typeof Form;
  Link: typeof Link;
  Icon: typeof Icon;
  Suspense: typeof Suspense;
  Await: typeof Await;
  Skeleton: typeof Skeleton;
  ClientOnly: typeof ClientOnly;
  Chart: typeof Chart;
  Print: typeof PrintButton;
  PrintButton: typeof PrintButton;
  OfflineBanner: typeof OfflineBanner;
  Custom: typeof Custom;
  custom: typeof Custom;
  renderElement: typeof renderElement;
};

export default UI;

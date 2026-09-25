import type { ReactNode, ComponentPropsWithoutRef, FormEvent } from 'react';
import type {
  FetcherWithComponents,
  NavigateFunction,
  Location,
  Params,
  useNavigation,
  LoaderFunctionArgs,
  ActionFunctionArgs,
  MetaFunction,
  HeadersFunction,
} from 'react-router';
import type { FlashMessage } from '~/lib/flash.server';
import type { CreateMetaOptions } from '~/lib/seo';
import type { CachePreset, CacheControlOptions } from '~/lib/cache';
import type { AuthUser, Role, Permission, MetaAccessConfig } from '~/constants/permissions';

export interface BreadcrumbItem {
  label: string;
  href: string;
  active?: boolean;
}

/**
 * Automatically infers the unwrapped return data type of a loader function.
 */
export type InferLoader<T> = T extends (...args: any[]) => Promise<infer R>
  ? R extends Response
    ? any
    : R extends { data: infer D }
      ? D
      : R
  : T extends (...args: any[]) => infer R
    ? R extends Response
      ? any
      : R extends { data: infer D }
        ? D
        : R
    : unknown;

/**
 * Automatically infers the unwrapped return data type of an action function.
 */
export type InferAction<T> = T extends (...args: any[]) => Promise<infer R>
  ? R extends Response
    ? any
    : R
  : T extends (...args: any[]) => infer R
    ? R extends Response
      ? any
      : R
    : unknown;

export interface FeatureViewContext<
  TLoader = any,
  TAction = any,
  TState extends Record<string, any> = Record<string, any>,
> {
  // Primary Aliases (as specified in system prompt)
  data: TLoader;
  result?: TAction | any;
  send: FetcherWithComponents<any>;
  urlState: TState;
  updateUrlState: (updater: Partial<TState> | ((prev: TState) => Partial<TState>)) => void;

  // RBAC & Permission Guards
  user: AuthUser | null;
  can: (permission: Permission | string | (Permission | string)[], requireAll?: boolean) => boolean;
  hasRole: (role: Role | string | (Role | string)[]) => boolean;

  // Hydration & Navigation State Guards
  isNavigating: boolean;
  navigationState: 'idle' | 'submitting' | 'loading';
  isSubmitting: boolean;
  isLoading: boolean;
  navigation: ReturnType<typeof useNavigation>;

  // Enterprise Theme & Dual Language (i18n)
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  currentLang: 'id' | 'en';
  setLang: (lang: 'id' | 'en') => void;
  toggleLang: () => void;

  // Network Offline / Resilience Guard
  isOnline: boolean;

  // Standard React Router / Ecosystem Aliases
  actionData?: TAction | any;
  state: TState;
  setState: (updater: Partial<TState> | ((prev: TState) => Partial<TState>)) => void;
  fetcher: FetcherWithComponents<any>;
  navigate: NavigateFunction;
  location: Location;
  params: Params;
  breadcrumbs: BreadcrumbItem[];
  flash?: FlashMessage | null;
}

import type { FluentBuilder } from './proxy';

export type FeatureViewRenderer<
  TLoader = any,
  TAction = any,
  TState extends Record<string, any> = Record<string, any>,
> = (ctx: FeatureViewContext<TLoader, TAction, TState>) => ReactNode | FluentBuilder<any>;

export interface PageDefinition<
  TLoader = any,
  TAction = any,
  TState extends Record<string, any> = Record<string, any>,
> {
  render: FeatureViewRenderer<TLoader, TAction, TState>;
  defaultState?: TState;
  key?: string;
  metaAccess?: MetaAccessConfig;
  meta?: (
    options:
      | CreateMetaOptions
      | ((args: { data: TLoader; params: any; location: any }) => CreateMetaOptions)
  ) => PageDefinition<TLoader, TAction, TState>;
  headers?: (
    options: CachePreset | CacheControlOptions | HeadersFunction
  ) => PageDefinition<TLoader, TAction, TState>;
  access?: (config: MetaAccessConfig) => PageDefinition<TLoader, TAction, TState>;
}

export interface DefineRouteConfig<
  TLoaderFn extends ((...args: any[]) => any) | undefined = any,
  TActionFn extends ((...args: any[]) => any) | undefined = any,
  TState extends Record<string, any> = Record<string, any>,
> {
  loader?: TLoaderFn;
  action?: TActionFn;
  metaAccess?: MetaAccessConfig;
  meta?:
    | MetaFunction
    | CreateMetaOptions
    | ((args: { data: InferLoader<TLoaderFn>; params: any; location: any }) => CreateMetaOptions);
  headers?: HeadersFunction | CachePreset | CacheControlOptions;
  defaultState?: TState;
  key?: string;
  render: FeatureViewRenderer<InferLoader<TLoaderFn>, InferAction<TActionFn>, TState>;
}

export interface CardProps {
  key?: React.Key;
  title?: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
  className?: string;
  guard?: Permission | string | (Permission | string)[];
  guardMode?: 'hide' | 'disable';
  guardRole?: Role | string | (Role | string)[];
}

export interface BadgeProps {
  key?: React.Key;
  label: string | ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
  guard?: Permission | string | (Permission | string)[];
  guardMode?: 'hide' | 'disable';
  guardRole?: Role | string | (Role | string)[];
}

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'children'> {
  label?: string | ReactNode;
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  guard?: Permission | string | (Permission | string)[];
  guardMode?: 'hide' | 'disable';
  guardRole?: Role | string | (Role | string)[];
}

export interface SubmitButtonProps {
  label?: string;
  loadingLabel?: string;
  isSubmitting?: boolean;
  className?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  icon?: string;
  disabled?: boolean;
  guard?: Permission | string | (Permission | string)[];
  guardMode?: 'hide' | 'disable';
  guardRole?: Role | string | (Role | string)[];
}

export interface TableColumn<T = any> {
  key?: string;
  header: string | ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => ReactNode;
  accessor?: (row: T, index?: number) => ReactNode;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  keyField?: keyof T | ((row: T) => string | number);
  onRowClick?: (row: T) => void;
  emptyText?: string;
  className?: string;
  compact?: boolean;
}

export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'size'> {
  name?: string;
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  inputClassName?: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends ComponentPropsWithoutRef<'select'> {
  name?: string;
  label?: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  className?: string;
  selectClassName?: string;
}

export interface TextareaProps extends ComponentPropsWithoutRef<'textarea'> {
  name: string;
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  textareaClassName?: string;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  bodyClassName?: string;
}

export type FormSubmitHandler<T = Record<string, any>> = (
  values: T,
  e: FormEvent<HTMLFormElement>
) => void | Promise<void>;

export interface FormProps {
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  action?: string;
  replace?: boolean;
  fetcher?: FetcherWithComponents<any>;
  onSubmit?: ((e: FormEvent<HTMLFormElement>) => void) | FormSubmitHandler<any>;
  className?: string;
}

export interface SuspenseProps {
  fallback?: ReactNode;
  children?: ReactNode;
}

export interface AwaitProps<T = any> {
  resolve: Promise<T> | T;
  fallback?: ReactNode;
  errorElement?: ReactNode | ((error: any) => ReactNode);
  children: (data: T) => ReactNode;
}

export interface SkeletonProps {
  className?: string;
  count?: number;
}

export interface ClientOnlyProps {
  fallback?: ReactNode;
  children?: () => ReactNode;
}

export interface ChartProps {
  type?:
    | 'line'
    | 'area'
    | 'bar'
    | 'pie'
    | 'donut'
    | 'radialBar'
    | 'scatter'
    | 'bubble'
    | 'heatmap'
    | 'candlestick';
  series: any[];
  options?: any;
  width?: string | number;
  height?: string | number;
  className?: string;
  fallback?: ReactNode;
}

export interface PrintButtonProps {
  targetRef?: React.RefObject<any>;
  contentRef?: React.RefObject<any>;
  documentTitle?: string;
  label?: string;
  className?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  icon?: string;
  disabled?: boolean;
  onBeforePrint?: () => Promise<void> | void;
  onAfterPrint?: () => void;
}

export interface OfflineBannerProps {
  message?: string;
  className?: string;
}

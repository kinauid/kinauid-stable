import React, { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router';
import { encryptCompactState, decryptCompactState } from '~/utils/cryptoState';

export interface UseEncryptedStateOptions {
  paramKey?: string; // Default: 'q'
  replace?: boolean; // Default: true (prevents history pollution)
  preventScrollReset?: boolean; // Default: true
}

/**
 * useEncryptedState
 * Reactive URL-as-State Hook for React Router v7.
 * Transparently encrypts state to ?q=... without page reload.
 */
export function useEncryptedState<T extends Record<string, any>>(
  defaultState: T,
  options?: UseEncryptedStateOptions
): [T, (updater: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const paramKey = options?.paramKey || 'q';
  const shouldReplace = options?.replace ?? true;
  const preventScroll = options?.preventScrollReset ?? true;

  const [searchParams, setSearchParams] = useSearchParams();
  const rawCipher = searchParams.get(paramKey);

  // 1. Decrypted state memo
  const state: T = useMemo(() => {
    if (!rawCipher) return defaultState;
    const decrypted = decryptCompactState<T>(rawCipher, defaultState);
    return decrypted ? { ...defaultState, ...decrypted } : defaultState;
  }, [rawCipher, defaultState]);

  // 2. State updater syncing URL query
  const setState = useCallback(
    (updater: Partial<T> | ((prev: T) => Partial<T>)) => {
      setSearchParams(
        (prevParams) => {
          const nextParams = new URLSearchParams(prevParams);
          const current = rawCipher
            ? decryptCompactState<T>(rawCipher, defaultState) || defaultState
            : defaultState;

          const updates = typeof updater === 'function' ? updater(current) : updater;
          const nextState = { ...current, ...updates };

          const cipher = encryptCompactState(nextState);
          if (cipher) {
            nextParams.set(paramKey, cipher);
          } else {
            nextParams.delete(paramKey);
          }

          return nextParams;
        },
        { replace: shouldReplace, preventScrollReset: preventScroll }
      );
    },
    [rawCipher, defaultState, paramKey, shouldReplace, preventScroll, setSearchParams]
  );

  return [state, setState];
}

const emptySubscribe = () => () => {};

/**
 * useHydrated
 * Returns true only after hydration has completed on the client.
 * Server snapshot: false
 * Client snapshot: true
 * Prevents hydration mismatches in SSR environments.
 */
export function useHydrated(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).document !== 'undefined'
    ? // React 18+ useSyncExternalStore for tear-free hydration detection
      ReactUseHydrated()
    : false;
}

function ReactUseHydrated(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function networkSubscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/**
 * useNetworkStatus
 * Reactive network connection hook for online/offline resilience detection.
 * Returns true if navigator.onLine is true or on SSR.
 */
export function useNetworkStatus(): boolean {
  return useSyncExternalStore(
    networkSubscribe,
    () => (typeof navigator !== 'undefined' ? navigator.onLine : true),
    () => true
  );
}

/**
 * useIsMobile
 * Reactive screen breakpoint hook for mobile/responsive rendering.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const isHydrated = useHydrated();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [isHydrated, breakpoint]);

  return isMobile;
}

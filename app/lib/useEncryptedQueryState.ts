import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { encryptCompactParams, decryptCompactParams } from './crypto-params';

export interface UseEncryptedQueryOptions {
  paramKey?: string; // Default: 'q'
  replace?: boolean; // Default: true (prevents polluting browser history)
}

/**
 * useEncryptedQueryState
 * Single-hook reactive URL-as-State pattern.
 * Synchronizes typed component state with encrypted URL query (?q=...) without reload.
 *
 * @example
 * const [state, setState] = useEncryptedQueryState({
 *   tab: "all",
 *   search: "",
 *   page: 1,
 *   selectedModal: null as string | null,
 * });
 *
 * // Update single field (automatically merges & encrypts to URL):
 * setState({ tab: "active" });
 *
 * // Functional updater:
 * setState(prev => ({ page: prev.page + 1 }));
 */
export function useEncryptedQueryState<T extends Record<string, any>>(
  defaultState: T,
  options?: UseEncryptedQueryOptions
) {
  const paramKey = options?.paramKey || 'q';
  const shouldReplace = options?.replace ?? true;
  const [searchParams, setSearchParams] = useSearchParams();

  const rawCipher = searchParams.get(paramKey);

  // 1. Memoized decrypted state with default fallback
  const state: T = useMemo(() => {
    if (!rawCipher) return defaultState;
    const decrypted = decryptCompactParams<T>(rawCipher);
    return decrypted ? { ...defaultState, ...decrypted } : defaultState;
  }, [rawCipher, defaultState]);

  // 2. Reactive updater: seamlessly merges state, encrypts, and mutates URL
  const setState = useCallback(
    (updater: Partial<T> | ((prev: T) => Partial<T>)) => {
      setSearchParams(
        (prevParams) => {
          const nextParams = new URLSearchParams(prevParams);
          const current = rawCipher
            ? decryptCompactParams<T>(rawCipher) || defaultState
            : defaultState;

          const updates = typeof updater === 'function' ? updater(current) : updater;
          const nextState = { ...current, ...updates };

          const cipher = encryptCompactParams(nextState);
          if (cipher) {
            nextParams.set(paramKey, cipher);
          } else {
            nextParams.delete(paramKey);
          }

          return nextParams;
        },
        { replace: shouldReplace, preventScrollReset: true }
      );
    },
    [rawCipher, defaultState, paramKey, shouldReplace, setSearchParams]
  );

  return [state, setState] as const;
}

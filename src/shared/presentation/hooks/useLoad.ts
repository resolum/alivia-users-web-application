import { useCallback, useEffect, useState } from 'react';

export type LoadState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly data: T };

/**
 * Runs a loader when its dependencies change and exposes retry and a local
 * setter, so a screen can apply the result of a save without refetching.
 */
export function useLoad<T>(load: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    load().then(
      (data) => active && setState({ status: 'ready', data }),
      () => active && setState({ status: 'error' }),
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((count) => count + 1);
  }, []);

  const setData = useCallback((data: T) => setState({ status: 'ready', data }), []);

  return { state, retry, setData, reload: () => setAttempt((count) => count + 1) } as const;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AccessLevel } from '@/shared/presentation/session/session.types.ts';
import { getHomeDataSource } from './home.data-source.ts';
import type {
  GuestHomeSummary,
  HomeSummary,
  PrincipalHomeSummary,
} from './home.view-model.ts';

export type HomeSummaryStatus = 'loading' | 'ready' | 'error';

export interface HomeSummaryResult<T> {
  readonly status: HomeSummaryStatus;
  readonly data: T | null;
  readonly retry: (personId?: number) => void;
}

interface HomeSummaryState {
  readonly status: HomeSummaryStatus;
  readonly data: HomeSummary | null;
}

const REFRESH_INTERVAL_MS = 60_000;

/**
 * Loads the Home read model and refreshes it on focus and every minute
 * while the tab is visible.
 */
export function useHomeSummary(
  accessLevel: 'principal',
  personId?: number,
): HomeSummaryResult<PrincipalHomeSummary>;
export function useHomeSummary(
  accessLevel: 'invitado',
  personId?: number,
): HomeSummaryResult<GuestHomeSummary>;
export function useHomeSummary(
  accessLevel: AccessLevel,
  personId?: number,
): HomeSummaryResult<HomeSummary> {
  const [state, setState] = useState<HomeSummaryState>({
    status: 'loading',
    data: null,
  });
  const requestId = useRef(0);
  const selectedPersonId = useRef<number | undefined>(personId);

  const fetchSummary = useCallback(
    async (personIdToLoad?: number): Promise<HomeSummary> => {
      const source = await getHomeDataSource();
      return accessLevel === 'principal'
        ? await source.getPrincipalSummary(personIdToLoad)
        : await source.getGuestSummary(personIdToLoad);
    },
    [accessLevel],
  );

  const applyReady = useCallback(
    (currentRequest: number, data: HomeSummary) => {
      if (requestId.current !== currentRequest) return;
      setState({ status: 'ready', data });
    },
    [],
  );

  const applyError = useCallback((currentRequest: number) => {
    if (requestId.current !== currentRequest) return;
    setState({ status: 'error', data: null });
  }, []);

  const load = useCallback(() => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    void fetchSummary(selectedPersonId.current)
      .then((data) => applyReady(currentRequest, data))
      .catch(() => applyError(currentRequest));
  }, [applyError, applyReady, fetchSummary]);

  useEffect(() => {
    selectedPersonId.current = personId;
    load();
  }, [load, personId]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void load();
      }
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const intervalId = window.setInterval(
      refreshWhenVisible,
      REFRESH_INTERVAL_MS,
    );
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.clearInterval(intervalId);
    };
  }, [load]);

  const retry = useCallback(
    (personIdToLoad?: number) => {
      if (personIdToLoad !== undefined) {
        selectedPersonId.current = personIdToLoad;
      }
      setState((previous) =>
        previous.data === null
          ? { status: 'loading', data: null }
          : previous,
      );
      load();
    },
    [load],
  );

  return { status: state.status, data: state.data, retry };
}

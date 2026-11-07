import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reads the data again without blanking the screen: on demand ("Actualizar estado") and whenever the family
 * comes back to the tab, so a step the technician recorded from the app shows up without a manual reload.
 */
export function useLiveRefresh<T>(load: () => Promise<T>, apply: (data: T) => void) {
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);
  const latest = useRef({ load, apply });
  useEffect(() => {
    latest.current = { load, apply };
  });

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setRefreshing(true);
    try {
      latest.current.apply(await latest.current.load());
    } catch {
      // The data on screen stays; the next refresh tries again.
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  return { refresh, refreshing };
}

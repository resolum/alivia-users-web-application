import { useCallback, useEffect, useState } from 'react';

const NOTICE_MS = 3500;

/** Short confirmation shown after a save; returns the message and its setter. */
export function useToast(): readonly [string | null, (message: string) => void] {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  return [notice, useCallback((message: string) => setNotice(message), [])];
}

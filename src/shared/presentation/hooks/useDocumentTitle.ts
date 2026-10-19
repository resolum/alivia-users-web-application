import { useEffect } from 'react';

/**
 * Sets the document title, appending the app name as suffix.
 * Restores the default title on unmount.
 *
 * @param title - Page-specific title segment.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — Alivia` : 'Alivia';
    return () => {
      document.title = previous;
    };
  }, [title]);
}

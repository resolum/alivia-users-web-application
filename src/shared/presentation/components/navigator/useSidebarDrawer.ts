import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { useLocation } from 'react-router';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

function trapFocus(event: KeyboardEvent, panel: HTMLElement): void {
  if (event.key !== 'Tab') return;

  const elements = getFocusableElements(panel);
  if (elements.length === 0) {
    event.preventDefault();
    return;
  }

  const first = elements[0];
  const last = elements[elements.length - 1];
  const active = document.activeElement;
  const isInside = elements.some((element) => element === active);

  if (!isInside) {
    event.preventDefault();
    first.focus();
    return;
  }
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }
  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/** Mobile drawer state: focus trap, focus return, scroll lock and route close. */
export function useSidebarDrawer(
  panelRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLButtonElement | null>,
) {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [triggerRef]);

  const closeWithoutFocus = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    if (!isOpen) return;
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [pathname, isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    if (!panel) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    getFocusableElements(panel)[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      trapFocus(event, panel);
    };

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) closeWithoutFocus();
    };

    document.addEventListener('keydown', handleKeyDown);
    mediaQuery.addEventListener('change', handleDesktop);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      mediaQuery.removeEventListener('change', handleDesktop);
    };
  }, [isOpen, panelRef, close, closeWithoutFocus]);

  return { isOpen, open, close };
}

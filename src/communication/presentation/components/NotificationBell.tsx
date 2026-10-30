import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { X } from 'lucide-react';
import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
import { useNotifications } from '../useNotifications.ts';
import { NotificationList } from './NotificationList.tsx';

interface NotificationBellProps {
  /** Guests only see that something is new, not how many. */
  readonly showCount: boolean;
}

/** Bell in the top bar that opens the notifications panel anchored under it. */
export function NotificationBell({ showCount }: NotificationBellProps) {
  const { items, status, retry, unread } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label =
    unread === 0 ? 'Notificaciones' : showCount ? `Notificaciones, ${unread} sin leer` : 'Notificaciones, hay sin leer';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={`relative flex size-11 shrink-0 items-center justify-center rounded-lg text-alivia-text-muted transition-colors hover:bg-alivia-primary-mist ${open ? 'bg-alivia-primary-mist' : ''}`}
      >
        <Icon name="notifications" />
        {unread > 0 &&
          (showCount ? (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-alivia-danger px-1 text-[10px] leading-4 font-bold text-white"
            >
              {unread > 9 ? '9+' : unread}
            </span>
          ) : (
            <span aria-hidden="true" className="absolute top-2 right-2 size-2 rounded-full bg-alivia-secondary ring-2 ring-white" />
          ))}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          className={[
            'fixed inset-x-2 top-16 z-40 flex max-h-[calc(100dvh-5rem)] flex-col rounded-2xl border border-alivia-primary-mist bg-white shadow-xl',
            'sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[400px] sm:origin-top-right',
            // Opened a few times a day from the bell; grows from it and settles fast.
            'transition-[opacity,scale] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] starting:scale-95 starting:opacity-0',
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
            <h2 id={titleId} className="flex items-center gap-2 text-xl font-bold text-alivia-primary-dark">
              Notificaciones
              {unread > 0 && showCount && (
                <span className="rounded-full bg-alivia-secondary-light px-2 py-0.5 text-xs font-bold text-alivia-primary-dark">
                  {unread} {unread === 1 ? 'nueva' : 'nuevas'}
                </span>
              )}
            </h2>
            <div className="flex items-center">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-alivia-secondary-deep hover:underline"
              >
                Ver todas
              </Link>
              <button
                type="button"
                aria-label="Cerrar notificaciones"
                onClick={() => setOpen(false)}
                className="grid size-11 place-items-center rounded-full text-alivia-text-muted hover:bg-alivia-page"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <NotificationList items={items} status={status} onRetry={retry} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

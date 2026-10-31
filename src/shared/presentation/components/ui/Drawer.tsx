import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  readonly open: boolean;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly closeLabel?: string;
  readonly onClose: () => void;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
  /** Replaces the default title row, for headers that carry their own layout. */
  readonly header?: ReactNode;
  readonly className?: string;
}

/**
 * Side sheet on a native modal dialog: showModal() gives the focus trap,
 * Escape to close and focus return to the trigger.
 */
export function Drawer({
  open,
  title,
  description,
  closeLabel = 'Cerrar',
  onClose,
  footer,
  children,
  header,
  className = 'max-w-md',
}: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className={[
        'fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full overflow-hidden bg-white p-0 text-alivia-text shadow-2xl',
        'backdrop:bg-alivia-primary-dark/40 backdrop:backdrop-blur-[2px]',
        // Opened a few times per session: slides from the edge it lives on, iOS drawer curve.
        'transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        'starting:open:translate-x-full motion-reduce:starting:open:translate-x-0 motion-reduce:starting:open:opacity-0',
        className,
      ].join(' ')}
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-alivia-primary-mist px-5 py-4 sm:px-6">
            <div id={titleId} className="min-w-0">
              {header ?? (
                <>
                  <h2 className="text-xl font-bold text-alivia-primary-dark">{title}</h2>
                  {description && (
                    <p className="mt-1 text-sm text-alivia-text-muted">{description}</p>
                  )}
                </>
              )}
            </div>
            <button
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              className="-mt-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-alivia-text-muted transition-colors hover:bg-alivia-primary-mist"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            {children}
          </div>
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-alivia-primary-mist bg-alivia-page/60 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button.tsx';

interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly children?: ReactNode;
  readonly confirmLabel: string;
  readonly danger?: boolean;
  readonly busy?: boolean;
  /** Keeps the dialog informative when the action is not possible yet. */
  readonly confirmDisabled?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/** Asks before an action that cannot be undone from the screen. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  danger = false,
  busy = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
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
      onClose={onCancel}
      onClick={(event) => event.target === event.currentTarget && onCancel()}
      className={[
        'm-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 text-alivia-text shadow-xl',
        'backdrop:bg-alivia-primary-dark/45',
        'transition-[opacity,scale] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
        'starting:open:scale-96 starting:open:opacity-0',
      ].join(' ')}
    >
      {open && (
        <div className="flex flex-col gap-4 p-6">
          <h2 id={titleId} className="text-lg font-bold text-alivia-primary-dark">
            {title}
          </h2>
          {children && <div className="text-sm text-alivia-text-muted">{children}</div>}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onCancel}>
              Volver
            </Button>
            <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy} disabled={confirmDisabled || busy}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}

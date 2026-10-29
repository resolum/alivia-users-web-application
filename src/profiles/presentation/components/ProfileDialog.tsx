import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ProfileDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly closeLabel: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

/**
 * Native modal dialog: showModal() gives the focus trap, Escape to close and
 * focus return to the trigger without a dialog library.
 */
export function ProfileDialog({ open, title, closeLabel, onClose, children }: ProfileDialogProps) {
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
      // A click on the dialog box itself, outside the padded panel, is a backdrop click.
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className={[
        'm-auto w-[calc(100%-2rem)] max-w-sm overflow-visible rounded-2xl bg-white p-0 text-alivia-text shadow-xl',
        'backdrop:bg-alivia-primary-dark/45 backdrop:backdrop-blur-sm',
        // Opened occasionally: a short scale-in from 0.96 keeps it anchored to the page centre.
        'transition-[opacity,scale] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
        'starting:open:scale-96 starting:open:opacity-0',
      ].join(' ')}
    >
      {open && (
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="text-lg font-bold text-alivia-primary">
              {title}
            </h2>
            <button
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              className="-mr-2 grid size-11 place-items-center rounded-full text-alivia-text-muted transition-colors hover:bg-alivia-primary-mist"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

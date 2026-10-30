import { useEffect, useId, useRef, useState } from 'react';
import { EllipsisVertical } from 'lucide-react';

export interface ActionMenuItem {
  readonly label: string;
  readonly onSelect: () => void;
  readonly danger?: boolean;
}

interface ActionMenuProps {
  readonly label: string;
  readonly items: readonly ActionMenuItem[];
}

/** Overflow menu for secondary row actions. Closes on Escape, outside click or selection. */
export function ActionMenu({ label, items }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

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
    rootRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="grid size-11 place-items-center rounded-lg text-alivia-text-muted transition-colors hover:bg-alivia-primary-mist"
      >
        <EllipsisVertical className="size-5" aria-hidden="true" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className={[
            'absolute top-full right-0 z-20 mt-1 min-w-52 origin-top-right rounded-xl border border-alivia-primary-mist bg-white p-1 shadow-lg',
            // Grows out of the trigger it belongs to; quick because it is opened often.
            'transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] starting:scale-95 starting:opacity-0',
          ].join(' ')}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={[
                'flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-semibold transition-colors',
                item.danger ? 'text-alivia-danger hover:bg-alivia-danger/10' : 'text-alivia-primary-dark hover:bg-alivia-page',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

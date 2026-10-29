import type { ReactNode } from 'react';

interface ProfileFieldProps {
  readonly id: string;
  readonly label: ReactNode;
  readonly required?: boolean;
  readonly hint?: string;
  readonly error?: string;
  /** Shown at the right of the label, such as a lock state or an action. */
  readonly aside?: ReactNode;
  readonly children: ReactNode;
}

export function ProfileField({ id, label, required, hint, error, aside, children }: ProfileFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex min-h-6 items-center justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-semibold text-alivia-text">
          {label}
          {required && (
            <span aria-hidden="true" className="text-alivia-danger">
              *
            </span>
          )}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="animate-notice-in text-xs font-medium text-alivia-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-alivia-hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

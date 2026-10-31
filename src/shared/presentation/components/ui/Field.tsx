import type { ReactNode } from 'react';

interface FieldProps {
  readonly id: string;
  readonly label: string;
  readonly required?: boolean;
  readonly hint?: string;
  readonly error?: string | null;
  /** Shown at the right of the label, e.g. a character counter. */
  readonly aside?: ReactNode;
  /** Receives the ids the control must reference in aria-describedby. */
  readonly children: (describedBy: string | undefined) => ReactNode;
}

/** Label, control, hint and error wired together for screen readers. */
export function Field({ id, label, required, hint, error, aside, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-alivia-primary-dark">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-alivia-danger">
              *
            </span>
          )}
        </label>
        {aside}
      </div>
      {children(describedBy)}
      {error && (
        <p id={errorId} className="text-xs font-semibold text-alivia-danger">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-xs text-alivia-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

import type { ReactNode } from 'react';

interface AuthFieldProps {
  readonly id: string;
  readonly label: string;
  readonly requiredLabel: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly children: ReactNode;
}

export function AuthField({
  id,
  label,
  requiredLabel,
  required = false,
  error,
  children,
}: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-alivia-text">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-alivia-danger">
              *
            </span>
          )}
        </label>
        {required && (
          <span className="shrink-0 text-[10px] font-semibold tracking-[0.08em] text-alivia-text-muted uppercase">
            {requiredLabel}
          </span>
        )}
      </div>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs font-medium text-alivia-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

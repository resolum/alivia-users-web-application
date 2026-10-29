import type { ReactNode } from 'react';

interface AuthFieldProps {
  readonly id: string;
  readonly label: string;
  readonly requiredLabel: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly hint?: string;
  /**
   * For forms where every field is required (sign-in, recovery): no required
   * markers, and 14px messages instead of 12px.
   */
  readonly quiet?: boolean;
  /** Link shown at the right of the label, such as "Forgot your password?". */
  readonly action?: ReactNode;
  readonly children: ReactNode;
}

export function AuthField({
  id,
  label,
  requiredLabel,
  required = false,
  error,
  hint,
  quiet = false,
  action,
  children,
}: AuthFieldProps) {
  const showMarkers = required && !quiet;
  const messageSize = quiet ? 'text-sm' : 'text-xs';

  return (
    <div className={`flex flex-col ${quiet ? 'gap-2' : 'gap-1.5'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className={`text-sm text-alivia-text ${quiet ? 'font-medium' : 'font-semibold'}`}
        >
          {label}
          {showMarkers && (
            <span aria-hidden="true" className="ml-0.5 text-alivia-danger">
              *
            </span>
          )}
        </label>
        {showMarkers && (
          <span className="shrink-0 text-[10px] font-semibold tracking-[0.08em] text-alivia-text-muted uppercase">
            {requiredLabel}
          </span>
        )}
        {action}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className={`${messageSize} text-alivia-text-muted`}>
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className={`${messageSize} font-medium text-alivia-danger`}
        >
          {error}
        </p>
      )}
    </div>
  );
}

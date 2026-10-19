import type { ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({
  id,
  label,
  helpText,
  error,
  required,
  children,
}: FormFieldProps) {
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-alivia-text-muted"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-alivia-secondary-dark">
            *
          </span>
        )}
      </label>
      <div
        aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
      >
        {children}
      </div>
      {helpText && !error && (
        <p id={helpId} className="text-xs text-alivia-text-soft">
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-alivia-secondary-dark">
          {error}
        </p>
      )}
    </div>
  );
}

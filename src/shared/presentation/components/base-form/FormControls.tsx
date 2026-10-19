import type { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/** Accessible checkbox with inline label. */
export function Checkbox({ label, id, ...rest }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="inline-flex items-center gap-2 cursor-pointer select-none"
    >
      <input
        id={id}
        type="checkbox"
        className={[
          'size-4 rounded border-alivia-primary-light',
          'accent-alivia-primary',
          'cursor-pointer',
        ].join(' ')}
        {...rest}
      />
      <span className="text-sm text-alivia-text">{label}</span>
    </label>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-alivia-secondary-dark bg-alivia-mint px-4 py-3 text-sm text-alivia-text"
    >
      {message}
    </p>
  );
}

interface SubmitButtonProps {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
}

export function SubmitButton({
  label = 'Guardar',
  loading = false,
  disabled = false,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2',
        'bg-alivia-primary text-white font-display text-sm font-semibold',
        'transition-colors duration-150',
        'hover:bg-alivia-primary-mid active:bg-alivia-primary-dark',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      ].join(' ')}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin"
        />
      )}
      {label}
    </button>
  );
}

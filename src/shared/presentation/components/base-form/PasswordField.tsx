import { useState, type InputHTMLAttributes } from 'react';
import { inputBase } from './Inputs.tsx';

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  readonly showPasswordLabel: string;
  readonly hidePasswordLabel: string;
}

interface EyeIconProps {
  readonly crossed: boolean;
}

function EyeIcon({ crossed }: EyeIconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M4 4l16 16" />}
    </svg>
  );
}

/**
 * Password input with an accessible show/hide toggle.
 *
 * Labels are supplied by the consuming context so shared code owns no copy.
 */
export function PasswordField({
  showPasswordLabel,
  hidePasswordLabel,
  className = '',
  ...rest
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? hidePasswordLabel : showPasswordLabel;

  return (
    <div className="relative">
      <input
        {...rest}
        type={visible ? 'text' : 'password'}
        className={[inputBase, 'min-h-12 pr-12', className].join(' ')}
      />
      <button
        type="button"
        aria-label={toggleLabel}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute top-1/2 right-1 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg text-alivia-text-soft transition-colors duration-150 hover:text-alivia-primary"
      >
        <EyeIcon crossed={visible} />
      </button>
    </div>
  );
}

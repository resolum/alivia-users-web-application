import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'outline' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant;
  readonly loading?: boolean;
  readonly children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-alivia-primary text-white hover:bg-alivia-primary-mid active:bg-alivia-primary-dark',
  secondary:
    'bg-alivia-mint text-alivia-primary border border-alivia-primary hover:bg-alivia-primary-mist',
  ghost:
    'text-alivia-primary-mid hover:bg-alivia-primary-mist',
  soft: 'bg-alivia-primary-mist text-alivia-primary-dark hover:bg-alivia-primary-light/50',
  outline:
    'border border-alivia-primary-light/70 bg-white text-alivia-primary-dark hover:bg-alivia-primary-mist/60',
  danger: 'bg-alivia-danger text-white hover:bg-alivia-danger/90',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled ?? loading;
  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2',
        'min-h-11 font-display text-sm font-semibold',
        // Pressed buttons sink slightly so the tap is acknowledged before the result arrives.
        'transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.97]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      )}
      {children}
    </button>
  );
}

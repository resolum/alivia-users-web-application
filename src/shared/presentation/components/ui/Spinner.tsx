interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = { sm: 'size-4', md: 'size-8', lg: 'size-12' };

/** Full-line loading indicator with accessible label. */
export function Spinner({ label = 'Cargando…', size = 'md' }: SpinnerProps) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-8">
      <span
        aria-hidden="true"
        className={[
          sizeClasses[size],
          'rounded-full border-4 border-alivia-primary-mist border-t-alivia-primary animate-spin',
        ].join(' ')}
      />
      <span className="text-sm text-alivia-text-soft">{label}</span>
    </div>
  );
}

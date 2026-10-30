import type { ReactNode } from 'react';

export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-alivia-mint text-alivia-secondary-deep',
  info: 'bg-alivia-primary-mist text-alivia-primary',
  warning: 'bg-alivia-warning-soft text-alivia-warning',
  danger: 'bg-alivia-danger/10 text-alivia-danger',
  neutral: 'bg-alivia-page text-alivia-text-muted',
};

interface StatusDotProps {
  readonly tone: StatusTone;
  readonly children: ReactNode;
  readonly className?: string;
}

/** Status label with a leading dot; the text carries the meaning, the color only reinforces it. */
export function StatusDot({ tone, children, className = '' }: StatusDotProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

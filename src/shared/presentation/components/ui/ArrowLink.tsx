import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '../navigator/Icon.tsx';

interface ArrowLinkProps {
  readonly to: string;
  readonly children: ReactNode;
  readonly tone?: 'accent' | 'muted';
  readonly className?: string;
}

const toneClasses = {
  accent:
    'text-alivia-secondary-deep hover:text-alivia-secondary-dark',
  muted: 'text-alivia-text-soft hover:text-alivia-text-muted',
} as const;

/** Navigation link with a trailing arrow. */
export function ArrowLink({
  to,
  children,
  tone = 'accent',
  className = '',
}: ArrowLinkProps) {
  return (
    <Link
      to={to}
      className={[
        'inline-flex min-h-11 items-center gap-2 text-sm font-semibold',
        toneClasses[tone],
        'transition-colors',
        className,
      ].join(' ')}
    >
      <span>{children}</span>
      <Icon name="arrow-right" className="size-4 shrink-0" />
    </Link>
  );
}

import type { ReactNode } from 'react';
import { Icon } from '../navigator/Icon.tsx';
import type { NavIconName } from '../navigator/icon-paths.ts';

type ChipTone = 'neutral' | 'accent' | 'success' | 'danger';

interface ChipProps {
  readonly children: ReactNode;
  readonly tone?: ChipTone;
  readonly icon?: NavIconName;
  readonly className?: string;
}

const toneClasses: Record<ChipTone, string> = {
  neutral: 'bg-alivia-primary-mist text-alivia-text-muted',
  accent: 'bg-alivia-mint text-alivia-secondary-deep',
  success: 'bg-alivia-mint text-alivia-secondary-deep',
  danger: 'bg-alivia-danger/10 text-alivia-danger',
};

/** Compact status label that always includes readable text. */
export function Chip({
  children,
  tone = 'neutral',
  icon,
  className = '',
}: ChipProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {icon && <Icon name={icon} className="size-4 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}

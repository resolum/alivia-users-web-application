import type { ReactNode } from 'react';

type SectionLabelTone = 'accent' | 'muted';

interface SectionLabelProps {
  readonly children: ReactNode;
  readonly tone?: SectionLabelTone;
  readonly className?: string;
}

const toneClasses: Record<SectionLabelTone, string> = {
  accent: 'text-alivia-secondary-deep',
  muted: 'text-alivia-text-soft',
};

/** Small uppercase label that introduces a section. */
export function SectionLabel({
  children,
  tone = 'accent',
  className = '',
}: SectionLabelProps) {
  return (
    <p
      className={[
        'text-[11px] font-semibold uppercase tracking-[0.16em]',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {children}
    </p>
  );
}

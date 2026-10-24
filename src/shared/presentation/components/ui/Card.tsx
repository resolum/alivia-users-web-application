import type { ReactNode } from 'react';

type CardTone = 'white' | 'lavender';

interface CardProps {
  readonly children: ReactNode;
  readonly tone?: CardTone;
  readonly className?: string;
}

const toneClasses: Record<CardTone, string> = {
  white: 'bg-white border-alivia-primary-mist',
  lavender: 'bg-alivia-primary-mist border-alivia-primary-mist',
};

/** Rounded surface used to group related content. */
export function Card({
  children,
  tone = 'white',
  className = '',
}: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl border shadow-sm',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';

type AuthCardTone = 'white' | 'lavender';

interface AuthCardProps {
  readonly children: ReactNode;
  readonly tone?: AuthCardTone;
  readonly className?: string;
}

const toneClasses: Readonly<Record<AuthCardTone, string>> = {
  white: 'bg-white',
  lavender: 'bg-alivia-primary-mist',
};

export function AuthCard({
  children,
  tone = 'white',
  className = '',
}: AuthCardProps) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-3xl shadow-[0_24px_60px_-24px_rgba(15,42,107,0.28)]',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {tone === 'white' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 size-48 rounded-full bg-alivia-secondary-light/40 blur-2xl"
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

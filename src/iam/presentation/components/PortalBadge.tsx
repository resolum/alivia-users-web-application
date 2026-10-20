type PortalBadgeTone = 'light' | 'white';

interface PortalBadgeProps {
  readonly label: string;
  readonly tone?: PortalBadgeTone;
  readonly withDot?: boolean;
  readonly withLeaf?: boolean;
  readonly className?: string;
}

const toneClasses: Readonly<Record<PortalBadgeTone, string>> = {
  light: 'bg-alivia-primary-mist text-alivia-primary',
  white: 'bg-white text-alivia-primary shadow-sm',
};

function LeafMark() {
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
      className="size-4"
    >
      <path d="M5 19c0-8 5-13 14-14 0 9-5 14-14 14Z" />
      <path d="M9 15c2-3 5-5 8-6" />
    </svg>
  );
}

export function PortalBadge({
  label,
  tone = 'light',
  withDot = false,
  withLeaf = false,
  className = '',
}: PortalBadgeProps) {
  return (
    <span
      className={[
        'inline-flex min-h-8 items-center gap-2 rounded-full px-3 text-[11px] font-bold tracking-[0.12em] uppercase',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {withDot && (
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-alivia-secondary"
        />
      )}
      {withLeaf && <LeafMark />}
      {label}
    </span>
  );
}

import type { ReactNode } from 'react';

/** One placeholder shape. Size and radius come from the caller so it mirrors the real element. */
export function Bone({ className = '' }: { readonly className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={[
        // Default radius only when the caller sets none, so two radius utilities never compete.
        'relative block overflow-hidden bg-alivia-primary-mist/70',
        className.includes('rounded') ? '' : 'rounded-md',
        "after:absolute after:inset-0 after:animate-skeleton-sweep after:bg-linear-to-r after:from-transparent after:via-white/60 after:to-transparent after:content-['']",
        className,
      ].join(' ')}
    />
  );
}

interface SkeletonProps {
  /** Announced to screen readers instead of the shapes. */
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/** Loading region: assistive tech hears the label, sighted users see the layout that is coming. */
export function Skeleton({ label, children, className = '' }: SkeletonProps) {
  return (
    <div role="status" aria-busy="true" className={`animate-skeleton-in ${className}`}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

const repeat = (count: number) => Array.from({ length: count }, (_, index) => index);

/** Rows with a leading avatar or icon, two lines of text and a trailing action: lists of people, incidents, notices. */
export function SkeletonRows({ label, rows = 3, round = false }: { readonly label: string; readonly rows?: number; readonly round?: boolean }) {
  return (
    <Skeleton label={label} className="divide-y divide-alivia-primary-mist overflow-hidden rounded-2xl border border-alivia-primary-mist bg-white">
      {repeat(rows).map((row) => (
        <div key={row} className="flex items-center gap-4 p-4 sm:p-5">
          <Bone className={`size-10 shrink-0 ${round ? 'rounded-full' : 'rounded-xl'}`} />
          <div className="flex-1 space-y-2">
            {/* Uneven widths read as text, equal ones as a table. */}
            <Bone className={`h-4 ${row % 2 ? 'w-2/5' : 'w-1/2'}`} />
            <Bone className={`h-3 ${row % 2 ? 'w-3/5' : 'w-1/3'}`} />
          </div>
          <Bone className="hidden h-8 w-24 rounded-lg sm:block" />
        </div>
      ))}
    </Skeleton>
  );
}

/** A profile-style card: avatar header, then label/value lines. */
export function SkeletonDetail({ label, rows = 5, avatar = true }: { readonly label: string; readonly rows?: number; readonly avatar?: boolean }) {
  return (
    <Skeleton label={label} className="rounded-3xl border border-alivia-primary-mist bg-white p-5 sm:p-8">
      <div className="flex items-center gap-4 border-b border-alivia-primary-mist pb-6">
        {avatar && <Bone className="size-12 shrink-0 rounded-full" />}
        <div className="flex-1 space-y-2">
          <Bone className="h-6 w-1/2 max-w-xs" />
          <Bone className="h-3 w-1/3 max-w-52" />
        </div>
        <Bone className="hidden h-11 w-40 rounded-lg sm:block" />
      </div>
      <div className="mt-4">
        {repeat(rows).map((row) => (
          <div key={row} className="grid gap-2 border-b border-alivia-primary-mist py-4 last:border-0 sm:grid-cols-[200px_1fr] sm:gap-4">
            <Bone className="h-3.5 w-28" />
            <Bone className={`h-3.5 ${['w-40', 'w-56', 'w-32', 'w-48'][row % 4]}`} />
          </div>
        ))}
      </div>
    </Skeleton>
  );
}

/** Grid of cards with a title, two lines and a footer button: devices, plans. */
export function SkeletonCards({ label, count = 3 }: { readonly label: string; readonly count?: number }) {
  return (
    <Skeleton label={label} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {repeat(count).map((card) => (
        <div key={card} className="flex flex-col gap-4 rounded-2xl border border-alivia-primary-mist bg-white p-5">
          <div className="flex items-start gap-3">
            <Bone className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Bone className="h-5 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
          </div>
          <Bone className="h-1.5 w-full rounded-full" />
          <div className="space-y-2">
            <Bone className="h-3 w-2/3" />
            <Bone className="h-3 w-1/3" />
          </div>
          <Bone className="h-11 w-full rounded-lg" />
        </div>
      ))}
    </Skeleton>
  );
}

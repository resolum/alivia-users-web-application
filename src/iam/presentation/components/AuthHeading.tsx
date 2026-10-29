import type { ReactNode } from 'react';

interface AuthHeadingProps {
  readonly title: string;
  readonly description?: ReactNode;
  /** Shown above the title, for result screens (sent, updated). */
  readonly icon?: ReactNode;
}

/** Title block of an auth screen; its single h1. */
export function AuthHeading({ title, description, icon }: AuthHeadingProps) {
  return (
    <div className="animate-step-in">
      {icon && <div className="mb-6">{icon}</div>}
      <h1 className="text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-balance text-alivia-primary sm:text-[2rem]">
        {title}
      </h1>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-pretty text-alivia-text-muted">
          {description}
        </p>
      )}
    </div>
  );
}

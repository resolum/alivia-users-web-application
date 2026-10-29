import type { ReactNode } from 'react';

interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}

/** Shown when a list or section has no data yet. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div
        aria-hidden="true"
        className="size-16 rounded-full bg-alivia-primary-mist flex items-center justify-center"
      >
        <span className="text-3xl text-alivia-primary-light">○</span>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-alivia-text">{title}</p>
        {description && (
          <p className="text-sm text-alivia-text-soft">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

import type { ReactNode } from 'react';

interface TopBarProps {
  readonly leading: ReactNode;
  readonly notification: ReactNode;
  readonly user: ReactNode;
}

/**
 * Presentational top bar with three composition slots:
 * page context, notifications and account controls.
 */
export function TopBar({ leading, notification, user }: TopBarProps) {
  return (
    <header className="flex min-h-14 items-center gap-2 border-b border-alivia-primary-mist bg-white px-4 py-2 lg:gap-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">{leading}</div>
      <div className="flex shrink-0 items-center gap-1">
        {notification}
        {user}
      </div>
    </header>
  );
}

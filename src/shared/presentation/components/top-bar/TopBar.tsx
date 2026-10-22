import type { RefObject } from 'react';
import { Link } from 'react-router';
import { useTranslations } from '../../i18n/index.ts';
import { LanguageSwitcher } from '../language-switcher/LanguageSwitcher.tsx';
import { Icon } from '../navigator/Icon.tsx';

const NOTIFICATION_COUNT: number = 0;
interface TopBarProps {
  readonly title: string;
  readonly menuOpen: boolean;
  readonly onMenuOpen: () => void;
  readonly menuButtonRef: RefObject<HTMLButtonElement | null>;
}

/**
 * Application top bar: mobile menu, section title, notifications,
 * language switcher and user menu placeholder.
 */
export function TopBar({
  title,
  menuOpen,
  onMenuOpen,
  menuButtonRef,
}: TopBarProps) {
  const t = useTranslations();
  const hasNotifications = NOTIFICATION_COUNT > 0;
  const notificationsLabel = t.nav.notificationsUnread.replace(
    '{count}',
    String(NOTIFICATION_COUNT),
  );

  return (
    <header className="flex items-center justify-between gap-2 border-b border-alivia-primary-mist bg-white px-4 py-2 lg:gap-4 lg:px-6">
      <button
        ref={menuButtonRef}
        type="button"
        id="open-menu-btn"
        aria-label={t.layout.openMenu}
        aria-expanded={menuOpen}
        aria-controls="sidebar"
        onClick={onMenuOpen}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-alivia-primary transition-colors hover:bg-alivia-primary-mist lg:hidden"
      >
        <Icon name="menu" className="size-6" />
      </button>

      <p className="min-w-0 flex-1 truncate text-base font-semibold text-alivia-text">
        {title}
      </p>

      <div className="flex shrink-0 items-center gap-1">
        <Link
          to="/notifications"
          aria-label={notificationsLabel}
          className="relative flex size-11 items-center justify-center rounded-lg text-alivia-text-muted transition-colors hover:bg-alivia-primary-mist"
        >
          <Icon name="notifications" className="size-5" />
          {hasNotifications && (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 min-w-4 rounded-full bg-alivia-danger px-1 text-center text-[10px] font-semibold leading-4 text-white"
            >
              {NOTIFICATION_COUNT}
            </span>
          )}
        </Link>
        <LanguageSwitcher />
        <button
          type="button"
          aria-label={t.layout.userMenu}
          className="flex size-11 items-center justify-center rounded-full bg-alivia-primary-mist text-alivia-primary transition-colors hover:bg-alivia-primary-light/40"
        >
          <Icon name="profile" className="size-5" />
        </button>
      </div>
    </header>
  );
}

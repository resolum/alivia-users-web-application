import { useTranslations } from '../../i18n/index.ts';
import { LanguageSwitcher } from '../language-switcher/LanguageSwitcher.tsx';

interface TopBarProps {
  title: string;
  onMenuOpen?: () => void;
}

/**
 * Application top bar: hamburger (mobile), section title,
 * notification bell placeholder, user menu placeholder, and language switcher.
 */
export function TopBar({ title, onMenuOpen }: TopBarProps) {
  const t = useTranslations();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-alivia-primary-mist bg-white px-4 py-3 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        type="button"
        id="open-menu-btn"
        aria-label={t.layout.openMenu}
        onClick={onMenuOpen}
        className="rounded-lg p-2 text-alivia-primary hover:bg-alivia-primary-mist transition-colors lg:hidden"
      >
        <span aria-hidden="true" className="block text-xl leading-none">☰</span>
      </button>

      {/* Section title */}
      <p className="flex-1 text-base font-semibold text-alivia-text truncate">
        {title}
      </p>

      <div className="flex items-center gap-2">
        {/* Notification bell placeholder */}
        <button
          type="button"
          id="notifications-btn"
          aria-label={t.layout.notifications}
          className="rounded-lg p-2 text-alivia-text-muted hover:bg-alivia-primary-mist transition-colors"
        >
          <span aria-hidden="true" className="text-xl leading-none">🔔</span>
        </button>

        {/* User menu placeholder */}
        <button
          type="button"
          id="user-menu-btn"
          aria-label={t.layout.userMenu}
          className="size-9 rounded-full bg-alivia-primary-mist text-alivia-primary font-semibold text-sm"
        >
          U
        </button>

        <LanguageSwitcher />
      </div>
    </header>
  );
}

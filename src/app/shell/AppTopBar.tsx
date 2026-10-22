import { Link } from 'react-router';
import { LanguageSwitcher } from '@/shared/presentation/components/language-switcher/LanguageSwitcher.tsx';
import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
import { getNavItem } from '@/shared/presentation/components/navigator/nav-selectors.ts';
import { TopBar } from '@/shared/presentation/components/top-bar/TopBar.tsx';
import { useAppLayoutControls } from '@/shared/presentation/components/layout/app-layout-controls.ts';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';
import { useTranslations } from '@/shared/presentation/i18n/index.ts';
import { PrincipalUser } from './PrincipalUser.tsx';
import { TopBarLeading } from './TopBarLeading.tsx';
import { useShellData } from './useShellData.ts';
import { UserMenu } from './UserMenu.tsx';

/** App-owned top bar: session-aware context, notifications and account menu. */
export function AppTopBar() {
  const { menuOpen, onMenuOpen, menuButtonRef } = useAppLayoutControls();
  const t = useTranslations();
  const { accessLevel } = useSession();
  const shell = useShellData();
  const isGuest = accessLevel === 'invitado';
  const notifications = getNavItem('notifications');
  const unread = shell.unreadNotifications;
  const notificationLabel =
    unread > 0
      ? isGuest
        ? t.nav.notificationsUnreadNoCount
        : t.nav.notificationsUnread.replace('{count}', String(unread))
      : t.nav.items.notifications;

  return (
    <TopBar
      leading={
        <>
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={menuOpen ? t.layout.closeMenu : t.layout.openMenu}
            aria-expanded={menuOpen}
            aria-controls="sidebar"
            onClick={onMenuOpen}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-alivia-text-muted transition-colors hover:bg-alivia-primary-mist lg:hidden"
          >
            <Icon name="menu" />
          </button>
          <TopBarLeading
            isGuest={isGuest}
            householdLabel={shell.householdLabel}
            assistedPersonName={shell.assistedPersonName}
          />
        </>
      }
      notification={
        <Link
          to={notifications.route}
          aria-label={notificationLabel}
          className="relative flex size-11 shrink-0 items-center justify-center rounded-lg text-alivia-text-muted transition-colors hover:bg-alivia-primary-mist"
        >
          <Icon name="notifications" />
          {unread > 0 &&
            (isGuest ? (
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 size-2 rounded-full bg-alivia-secondary ring-2 ring-white"
              />
            ) : (
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-alivia-danger px-1 text-[10px] font-bold leading-4 text-white"
              >
                {unread > 9 ? '9+' : unread}
              </span>
            ))}
        </Link>
      }
      user={
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <span
            aria-hidden="true"
            className="mx-1 hidden h-8 w-px bg-alivia-primary-mist sm:block"
          />
          {isGuest ? (
            <UserMenu displayName={shell.displayName} />
          ) : (
            <PrincipalUser displayName={shell.displayName} />
          )}
        </div>
      }
    />
  );
}

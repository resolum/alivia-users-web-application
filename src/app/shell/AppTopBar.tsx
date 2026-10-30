import { NotificationBell } from '@/communication/index.ts';
import { LanguageSwitcher } from '@/shared/presentation/components/language-switcher/LanguageSwitcher.tsx';
import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
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
      notification={<NotificationBell showCount={!isGuest} />}
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

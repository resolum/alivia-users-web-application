import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { getNavItem } from '@/shared/presentation/components/navigator/nav-selectors.ts';
import { Avatar } from '@/shared/presentation/components/ui/index.ts';
import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';
import { useTranslations } from '@/shared/presentation/i18n/index.ts';

interface UserMenuProps {
  readonly displayName: string;
}

const menuItemClasses = [
  'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left',
  'text-sm font-semibold text-alivia-text transition-colors hover:bg-alivia-primary-mist',
].join(' ');

/** Account disclosure with profile and sign-out actions. */
export function UserMenu({ displayName }: UserMenuProps) {
  const t = useTranslations();
  const { signOut } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const profileRoute = getNavItem('profile').route;

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t.layout.userMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-11 items-center gap-2 rounded-full px-1 text-left transition-colors hover:bg-alivia-primary-mist"
      >
        <Avatar
          name={displayName}
          size="sm"
          className="border-2 border-alivia-secondary"
        />
        <span className="hidden text-left sm:block">
          <span className="block max-w-40 truncate text-sm font-bold text-alivia-text">
            {displayName || '—'}
          </span>
          <span className="block text-xs font-semibold text-alivia-secondary-deep">
            {t.nav.roles.guest}
          </span>
        </span>
        <Icon
          name="chevron-down"
          className="hidden size-4 text-alivia-text-soft sm:block"
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={t.layout.userMenu}
          className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-alivia-primary-mist bg-white p-1 shadow-lg"
        >
          <Link
            to={profileRoute}
            role="menuitem"
            onClick={closeMenu}
            className={menuItemClasses}
          >
            <Icon name="profile" className="size-4 shrink-0" />
            {t.nav.items.profile}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              signOut();
            }}
            className={`${menuItemClasses} text-alivia-danger`}
          >
            <Icon name="signOut" className="size-4 shrink-0" />
            {t.nav.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

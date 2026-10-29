import { useTranslations } from '../../i18n/index.ts';
import { useSession } from '../../hooks/useSession.ts';
import type { NavItem } from './navigation.catalog.ts';
import type { ActiveIndicator } from './navigation.layouts.ts';
import { isNavPathActive } from './nav-selectors.ts';
import { Icon } from './Icon.tsx';
import { SidebarLink } from './SidebarLink.tsx';

interface SidebarFooterProps {
  readonly items: readonly NavItem[];
  readonly indicator: ActiveIndicator;
  readonly pathname: string;
}

export function SidebarFooter({
  items,
  indicator,
  pathname,
}: SidebarFooterProps) {
  const t = useTranslations();
  const { signOut } = useSession();

  return (
    <div className="mt-auto border-t border-alivia-primary-mist px-3 py-4">
      {items.length > 0 && (
        <ul className="mb-2 space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <SidebarLink
                item={item}
                isActive={isNavPathActive(pathname, item.route)}
                indicator={indicator}
              />
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={signOut}
        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-alivia-danger transition-colors duration-150 hover:bg-alivia-primary-mist"
      >
        <Icon name="signOut" className="size-5 shrink-0" />
        <span>{t.nav.signOut}</span>
      </button>
    </div>
  );
}

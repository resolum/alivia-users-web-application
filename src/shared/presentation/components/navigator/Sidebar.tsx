import { NavLink } from 'react-router';
import { useSession } from '../../hooks/useSession.ts';
import { useTranslations } from '../../i18n/index.ts';
import { getNavigationGroups } from './navigation.config.ts';

interface SidebarProps {
  onClose?: () => void;
}

/**
 * Configuration-driven sidebar navigation.
 * Filters nav items by the current session's access level.
 * Highlights the active route with aria-current="page".
 */
export function Sidebar({ onClose }: SidebarProps) {
  const { accessLevel } = useSession();
  const t = useTranslations();
  const groups = getNavigationGroups();

  return (
    <nav
      aria-label="Navegación principal"
      className="flex h-full flex-col bg-alivia-primary text-white"
    >
      <div className="px-6 py-5 border-b border-alivia-primary-mid">
        <span className="text-xl font-semibold tracking-tight">Alivia</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {groups.map((group) => {
          const visibleItems = group.items.filter(
            (item) =>
              !item.accessLevels || item.accessLevels.includes(accessLevel),
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.key}>
              <p className="mb-1 px-6 text-xs font-semibold uppercase tracking-widest text-alivia-primary-light">
                {group.key}
              </p>
              <ul role="list">
                {visibleItems.map((item) => (
                  <li key={item.key}>
                    <NavLink
                      to={item.route}
                      onClick={onClose}
                      className={({ isActive }: { isActive: boolean }) =>
                        [
                          'flex items-center px-6 py-2.5 text-sm transition-colors duration-150',
                          isActive
                            ? 'bg-alivia-primary-mid font-semibold'
                            : 'text-alivia-primary-mist hover:bg-alivia-primary-mid/60',
                        ].join(' ')
                      }
                    >
                      {({ isActive }: { isActive: boolean }) => (
                        <span aria-current={isActive ? 'page' : undefined}>
                          {t.nav[item.labelKey]}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {/* Sign out */}
      <div className="border-t border-alivia-primary-mid p-4">
        <button
          type="button"
          className="w-full rounded-lg px-4 py-2 text-sm text-alivia-primary-light hover:bg-alivia-primary-mid transition-colors duration-150"
        >
          {t.nav.signOut}
        </button>
      </div>
    </nav>
  );
}

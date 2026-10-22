import { useLocation } from 'react-router';
import { useTranslations } from '../../i18n/index.ts';
import { useSession } from '../../hooks/useSession.ts';
import { NAV_LAYOUTS } from './navigation.layouts.ts';
import { getNavItems } from './nav-selectors.ts';
import { SidebarFooter } from './SidebarFooter.tsx';
import { SidebarGroup } from './SidebarGroup.tsx';
import { SidebarHeader } from './SidebarHeader.tsx';

/** Access-level driven sidebar that composes the catalog-based layout. */
export function Sidebar() {
  const { accessLevel } = useSession();
  const { pathname } = useLocation();
  const t = useTranslations();
  const layout = NAV_LAYOUTS[accessLevel];

  return (
    <nav
      aria-label={t.nav[layout.navLabel]}
      className="flex h-full w-64 flex-col border-r border-alivia-primary-mist bg-white"
    >
      <SidebarHeader header={layout.header} />
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {layout.groups.map((group) => (
            <SidebarGroup
              key={group.labelKey}
              group={group}
              indicator={layout.activeIndicator}
              labelVariant={layout.groupLabelVariant}
              pathname={pathname}
            />
          ))}
        </div>
      </div>
      <SidebarFooter
        items={getNavItems(layout.footerItems)}
        indicator={layout.activeIndicator}
        pathname={pathname}
      />
    </nav>
  );
}

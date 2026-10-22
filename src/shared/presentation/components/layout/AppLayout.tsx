import { useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from '../navigator/Sidebar.tsx';
import { TopBar } from '../top-bar/TopBar.tsx';
import { useTranslations } from '../../i18n/index.ts';
import { getNavItemByPath } from '../navigator/nav-selectors.ts';
import { useSidebarDrawer } from '../navigator/useSidebarDrawer.ts';

function useSectionTitle(): string {
  const { pathname } = useLocation();
  const t = useTranslations();
  const item = getNavItemByPath(pathname);
  return item ? t.nav.items[item.labelKey] : t.nav.header.appName;
}

/**
 * Main authenticated layout: fixed sidebar on desktop and
 * an accessible drawer on mobile.
 */
export function AppLayout() {
  const t = useTranslations();
  const title = useSectionTitle();
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { isOpen, open, close } = useSidebarDrawer(sidebarRef, menuButtonRef);

  return (
    <div className="flex h-screen overflow-hidden">
      {isOpen && (
        <button
          type="button"
          aria-label={t.layout.closeMenu}
          className="fixed inset-0 z-20 bg-alivia-primary/40 motion-reduce:transition-none lg:hidden"
          onClick={close}
        />
      )}
      <aside
        ref={sidebarRef}
        id="sidebar"
        className={[
          'fixed inset-y-0 left-0 z-30 w-64 motion-safe:transition-transform motion-safe:duration-300 lg:static lg:visible lg:translate-x-0',
          isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full',
        ].join(' ')}
      >
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          title={title}
          menuOpen={isOpen}
          onMenuOpen={open}
          menuButtonRef={menuButtonRef}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-alivia-primary focus:shadow"
        >
          {t.layout.skipToContent}
        </a>
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 lg:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

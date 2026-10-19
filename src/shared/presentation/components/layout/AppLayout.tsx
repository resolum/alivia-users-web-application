import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from '../navigator/Sidebar.tsx';
import { TopBar } from '../top-bar/TopBar.tsx';
import { useTranslations } from '../../i18n/index.ts';
import { getNavigationGroups } from '../navigator/navigation.config.ts';

function useSectionTitle(): string {
  const { pathname } = useLocation();
  const t = useTranslations();
  const groups = getNavigationGroups();
  for (const group of groups) {
    const item = group.items.find((i) => i.route === pathname);
    if (item) return t.nav[item.labelKey];
  }
  return 'Alivia';
}

/**
 * Main authenticated layout: collapsible sidebar + top bar + content area.
 * Sidebar acts as a drawer on mobile (controlled by local state).
 */
export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations();
  const title = useSectionTitle();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label={t.layout.closeMenu}
          className="fixed inset-0 z-20 bg-alivia-primary/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar — fixed on desktop, drawer on mobile */}
      <aside
        id="sidebar"
        aria-label="Menú lateral"
        className={[
          'fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>
      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} onMenuOpen={() => setSidebarOpen(true)} />
        {/* Skip link target */}
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

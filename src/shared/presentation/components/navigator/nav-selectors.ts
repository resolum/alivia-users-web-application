import { NAV_ITEMS, type NavItem, type NavItemId } from './navigation.catalog.ts';

/** Resolves a catalog item by id. */
export function getNavItem(id: NavItemId): NavItem {
  const item = NAV_ITEMS.find((candidate) => candidate.id === id);
  if (!item) {
    throw new Error(`Unknown navigation item "${id}".`);
  }
  return item;
}

/** Resolves a list of catalog items preserving the requested order. */
export function getNavItems(ids: readonly NavItemId[]): readonly NavItem[] {
  return ids.map(getNavItem);
}

/** True when the current path is the route or a descendant (case-insensitive). */
export function isNavPathActive(pathname: string, route: string): boolean {
  const normalizedPathname = pathname.toLowerCase();
  const normalizedRoute = route.toLowerCase();
  return (
    normalizedPathname === normalizedRoute ||
    normalizedPathname.startsWith(`${normalizedRoute}/`)
  );
}

/** Finds the catalog item that owns the current path. */
export function getNavItemByPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => isNavPathActive(pathname, item.route));
}

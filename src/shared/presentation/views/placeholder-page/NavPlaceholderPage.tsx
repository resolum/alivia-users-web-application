import { useTranslations } from '../../i18n/index.ts';
import { getNavItem } from '../../components/navigator/nav-selectors.ts';
import type { NavItemId } from '../../components/navigator/navigation.catalog.ts';
import { PlaceholderPage } from './PlaceholderPage.tsx';

interface NavPlaceholderPageProps {
  readonly itemId: NavItemId;
}

/** Placeholder page whose title comes from the navigation catalog and i18n. */
export function NavPlaceholderPage({ itemId }: NavPlaceholderPageProps) {
  const t = useTranslations();
  const item = getNavItem(itemId);

  return <PlaceholderPage title={t.nav.items[item.labelKey]} />;
}

import { useTranslations } from '../../i18n/index.ts';
import type {
  ActiveIndicator,
  GroupLabelVariant,
  NavLayoutGroup,
} from './navigation.layouts.ts';
import { getNavItems, isNavPathActive } from './nav-selectors.ts';
import { SidebarLink } from './SidebarLink.tsx';

interface SidebarGroupProps {
  readonly group: NavLayoutGroup;
  readonly indicator: ActiveIndicator;
  readonly labelVariant: GroupLabelVariant;
  readonly pathname: string;
}

/** A labelled group of sidebar destinations. */
export function SidebarGroup({
  group,
  indicator,
  labelVariant,
  pathname,
}: SidebarGroupProps) {
  const t = useTranslations();
  const headingId = `sidebar-group-${group.labelKey}`;
  const items = getNavItems(group.itemIds);
  const labelSize =
    labelVariant === 'wide'
      ? 'text-xs tracking-[0.2em]'
      : 'text-[11px] tracking-[0.14em]';
  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className={[
          'px-3 font-semibold uppercase text-alivia-text-soft',
          labelSize,
        ].join(' ')}
      >
        {t.nav.groups[group.labelKey]}
      </h2>
      <ul aria-labelledby={headingId} className="mt-2 space-y-1">
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
    </section>
  );
}

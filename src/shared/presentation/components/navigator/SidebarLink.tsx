import { Link } from 'react-router';
import { useTranslations } from '../../i18n/index.ts';
import type { NavItem } from './navigation.catalog.ts';
import type { ActiveIndicator } from './navigation.layouts.ts';
import { Icon } from './Icon.tsx';

interface SidebarLinkProps {
  readonly item: NavItem;
  readonly isActive: boolean;
  readonly indicator: ActiveIndicator;
}

/** One sidebar destination with its icon, label and active treatment. */
export function SidebarLink({ item, isActive, indicator }: SidebarLinkProps) {
  const t = useTranslations();

  return (
    <Link
      to={item.route}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm',
        'transition-colors duration-150 hover:bg-alivia-primary-mist',
        isActive
          ? 'bg-alivia-primary-mist font-semibold text-alivia-primary'
          : 'text-alivia-text-muted',
      ].join(' ')}
    >
      {isActive && indicator === 'barra' && (
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-alivia-primary"
        />
      )}
      <Icon name={item.icon} className="size-5 shrink-0" />
      <span>{t.nav.items[item.labelKey]}</span>
    </Link>
  );
}

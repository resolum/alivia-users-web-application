import { useTranslations } from '../../i18n/index.ts';
import type { NavLayoutHeader } from './navigation.layouts.ts';

interface SidebarHeaderProps {
  readonly header: NavLayoutHeader;
}

/** Brand header for the caregiver and guest sidebars. */
export function SidebarHeader({ header }: SidebarHeaderProps) {
  const t = useTranslations();
  const title = t.nav.header[header.titleKey];
  const subtitle = t.nav.header[header.subtitleKey];
  const badge = header.badgeKey ? t.nav.header[header.badgeKey] : null;

  return (
    <div className="flex items-center gap-3 border-b border-alivia-primary-mist px-4 py-5">
      {/* Decorative: the product name is already written next to it. */}
      <img
        src="/logo.webp"
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-lg border border-alivia-primary-mist bg-white object-contain"
      />
      <div className="min-w-0">
        {badge ? (
          <>
            <p className="text-base leading-tight">
              <span className="font-bold text-alivia-text">{title}</span>{' '}
              <span className="font-normal text-alivia-text-muted">{subtitle}</span>
            </p>
            <span className="mt-1 inline-flex rounded-full bg-alivia-secondary-light px-2 py-0.5 text-[11px] font-semibold tracking-wider text-alivia-secondary-dark">
              {badge}
            </span>
          </>
        ) : (
          <>
            <p className="text-base font-bold leading-tight text-alivia-text">
              {title}
            </p>
            <p className="text-xs font-bold text-alivia-text-soft">{subtitle}</p>
          </>
        )}
      </div>
    </div>
  );
}

import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
import { useTranslations } from '@/shared/presentation/i18n/index.ts';

interface TopBarLeadingProps {
  readonly isGuest: boolean;
  readonly householdLabel: string | null;
  readonly assistedPersonName: string | null;
}

function getGuestPlaceLabel(
  householdLabel: string | null,
  assistedPersonName: string | null,
  fallback: string,
): string {
  if (householdLabel && assistedPersonName) {
    return `${householdLabel} · ${assistedPersonName}`;
  }
  return assistedPersonName ?? householdLabel ?? fallback;
}

/** Page context shown at the start of the top bar. */
export function TopBarLeading({
  isGuest,
  householdLabel,
  assistedPersonName,
}: TopBarLeadingProps) {
  const t = useTranslations();

  if (!isGuest) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-base font-bold text-alivia-primary">
          {t.nav.header.appName}
        </span>
        <span
          aria-hidden="true"
          className="text-sm font-medium text-alivia-text-soft"
        >
          ›
        </span>
        <span className="truncate text-sm font-medium text-alivia-text-soft">
          {t.nav.header.principalSubtitle}
        </span>
      </div>
    );
  }

  const placeLabel = getGuestPlaceLabel(
    householdLabel,
    assistedPersonName,
    t.nav.header.appName,
  );

  return (
    <div className="inline-flex min-h-9 min-w-0 max-w-full items-center gap-2 rounded-full bg-alivia-primary-mist px-3">
      <Icon
        name="map-pin"
        className="size-4 shrink-0 text-alivia-secondary-deep"
      />
      <span className="truncate text-sm">
        <span className="font-semibold text-alivia-primary">{placeLabel}</span>{' '}
        <span className="font-normal text-alivia-text-soft">
          ({t.nav.roles.support})
        </span>
      </span>
    </div>
  );
}

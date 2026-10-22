import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
import { getNavItem } from '@/shared/presentation/components/navigator/nav-selectors.ts';
import {
  ArrowLink,
  Card,
  Chip,
} from '@/shared/presentation/components/ui/index.ts';
import type { HomeDeviceAlert } from '../home.view-model.ts';
import { useTranslations } from '../../../i18n/index.ts';

interface DeviceAlertBannerProps {
  readonly alert: HomeDeviceAlert;
}

/** Warning banner for a device that needs attention. */
export function DeviceAlertBanner({ alert }: DeviceAlertBannerProps) {
  const t = useTranslations();
  const devicesRoute = getNavItem('devices').route;
  const extraLabel =
    alert.extraSituations === 1
      ? t.home.alert.extraSituation
      : t.home.alert.extraSituations;

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-alivia-primary-mist text-alivia-primary">
        <Icon name="battery" className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-alivia-text">{alert.title}</p>
          {alert.extraSituations > 0 && (
            <Chip>
              {extraLabel.replace('{count}', String(alert.extraSituations))}
            </Chip>
          )}
        </div>
        <p className="mt-0.5 text-sm text-alivia-text-soft">{alert.detail}</p>
      </div>
      <ArrowLink to={devicesRoute} className="shrink-0">
        {t.home.alert.viewDevice}
      </ArrowLink>
    </Card>
  );
}

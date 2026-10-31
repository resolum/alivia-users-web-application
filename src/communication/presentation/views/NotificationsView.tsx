import { PageHeader, SampleDataNotice } from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { isNotificationsSample } from '../../application/notifications.store.ts';
import { NotificationList } from '../components/NotificationList.tsx';
import { useNotifications } from '../useNotifications.ts';

export function NotificationsView() {
  useDocumentTitle('Notificaciones');
  const { items, status, retry } = useNotifications();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader crumb="Notificaciones" title="Notificaciones" subtitle="Avisos del hogar, de los dispositivos y de las actividades." />
      {isNotificationsSample() && <SampleDataNotice />}
      <div className="overflow-hidden rounded-2xl border border-alivia-primary-mist bg-white pt-4">
        <NotificationList items={items} status={status} onRetry={retry} />
      </div>
    </div>
  );
}

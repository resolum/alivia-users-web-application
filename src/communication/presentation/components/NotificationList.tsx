import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Asterisk, BatteryWarning, CalendarClock, ChevronRight, Wrench, type LucideIcon } from 'lucide-react';
import { formatRelative } from '@/shared/domain/model/valueobjects/relative-time.ts';
import {
  Bone,
  ErrorState,
  Skeleton,
} from '@/shared/presentation/components/ui/index.ts';
import { markNotificationsRead } from '../../application/notifications.store.ts';
import { isToday, isUrgent, type CaregiverNotification, type NotificationKind } from '../../domain/model/notification.entity.ts';

const KIND: Record<NotificationKind, { icon: LucideIcon; tone: string }> = {
  assistance_request: { icon: Asterisk, tone: 'bg-alivia-danger/10 text-alivia-danger' },
  low_battery: { icon: BatteryWarning, tone: 'bg-alivia-warning-soft text-alivia-warning' },
  upcoming_activity: { icon: CalendarClock, tone: 'bg-alivia-primary-mist text-alivia-primary' },
  incident_update: { icon: Wrench, tone: 'bg-alivia-mint text-alivia-secondary-deep' },
};

interface NotificationListProps {
  readonly items: readonly CaregiverNotification[];
  readonly status: 'loading' | 'ready' | 'error';
  readonly onRetry: () => void;
  /** Called after an action navigates away, e.g. to close the panel. */
  readonly onNavigate?: () => void;
}

function Item({ item, onOpen }: { readonly item: CaregiverNotification; readonly onOpen: () => void }) {
  const kind = KIND[item.kind];
  const urgent = isUrgent(item);
  return (
    <li className="flex gap-3 px-5 py-4">
      <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-full ${kind.tone}`}>
        <kind.icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="flex items-center gap-1.5 font-bold text-alivia-primary-dark">
            {!item.read && <span className="size-2 shrink-0 rounded-full bg-alivia-secondary-deep" />}
            {item.title}
            {!item.read && <span className="sr-only">(sin leer)</span>}
          </p>
          <time dateTime={item.createdAt} className="shrink-0 text-xs font-semibold text-alivia-text-muted">
            {formatRelative(item.createdAt)}
          </time>
        </div>
        <p className="mt-0.5 text-sm text-alivia-text">{item.body}</p>
        <button
          type="button"
          onClick={onOpen}
          className={
            urgent
              ? 'mt-3 inline-flex min-h-11 items-center rounded-lg bg-alivia-primary-dark px-4 text-sm font-semibold text-white transition-[background-color,scale] duration-150 hover:bg-alivia-primary active:scale-[0.97]'
              : 'mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-alivia-primary-dark hover:underline'
          }
        >
          {item.actionLabel}
          {!urgent && <ChevronRight className="size-4" aria-hidden="true" />}
        </button>
      </div>
    </li>
  );
}

export function NotificationList({ items, status, onRetry, onNavigate }: NotificationListProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const unread = items.filter((item) => !item.read);
  const shown = filter === 'all' ? items : unread;
  const today = shown.filter((item) => isToday(item));
  const earlier = shown.filter((item) => !isToday(item));

  const open = (item: CaregiverNotification) => {
    markNotificationsRead([item.id]).catch(() => undefined);
    onNavigate?.();
    void navigate(item.route);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3">
        <div role="group" aria-label="Filtrar notificaciones" className="flex rounded-lg bg-alivia-page p-1">
          {(['all', 'unread'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-9 rounded-md px-3 text-sm font-semibold transition-colors ${filter === value ? 'bg-white text-alivia-primary-dark shadow-xs' : 'text-alivia-text-muted'}`}
            >
              {value === 'all' ? 'Todas' : `Sin leer (${unread.length})`}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={unread.length === 0}
          onClick={() => markNotificationsRead(unread.map((item) => item.id)).catch(() => undefined)}
          className="min-h-11 text-sm font-bold text-alivia-primary-dark hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
        >
          Marcar todas como leídas
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {status === 'loading' && <Skeleton label="Cargando notificaciones…" className="divide-y divide-alivia-primary-mist">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex gap-3 px-5 py-4">
                <Bone className="size-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Bone className="h-4 w-2/5" />
                  <Bone className="h-3 w-4/5" />
                  <Bone className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </Skeleton>}
        {status === 'error' && <ErrorState title="No pudimos cargar tus notificaciones" onRetry={onRetry} />}
        {status === 'ready' && shown.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-alivia-text-muted">
            {filter === 'unread' ? 'Estás al día: no tienes notificaciones sin leer.' : 'Aún no tienes notificaciones.'}
          </p>
        )}
        {status === 'ready' &&
          [
            { label: 'Hoy', list: today },
            { label: 'Anteriores', list: earlier },
          ].map(
            (group) =>
              group.list.length > 0 && (
                <section key={group.label} aria-label={group.label}>
                  <h3 className="flex justify-between bg-alivia-page px-5 py-1.5 text-xs font-bold tracking-wide text-alivia-text-muted uppercase">
                    {group.label}
                    <span className="font-semibold normal-case">
                      {group.list.length} {group.list.length === 1 ? 'aviso' : 'avisos'}
                    </span>
                  </h3>
                  <ul className="divide-y divide-alivia-primary-mist">
                    {group.list.map((item) => (
                      <Item key={item.id} item={item} onOpen={() => open(item)} />
                    ))}
                  </ul>
                </section>
              ),
          )}
      </div>
    </div>
  );
}

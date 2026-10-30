import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowRight, BedDouble, Flag, Plug, RefreshCw, WifiOff } from 'lucide-react';
import { useCareActor } from '@/assistance/index.ts';
import { formatDateTime, formatRelative, formatTime } from '@/shared/domain/model/valueobjects/relative-time.ts';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SampleDataNotice,
  SkeletonCards,
  StatusDot,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';
import { isTrackingSample, loadSupervision } from '../../application/tracking.store.ts';
import { homeConnection, recentEvents, type Device, type DeviceHealth, type HomeEvent } from '../../domain/model/device.entity.ts';
import { HEALTH, KIND_ICON } from '../device-presentation.ts';
import { DeviceDetailDrawer } from '../components/DeviceDetailDrawer.tsx';

function DeviceCard({ device, onOpen }: { readonly device: Device; readonly onOpen: () => void }) {
  const Icon = KIND_ICON[device.kind];
  const health = HEALTH[device.health];
  const attention = device.health === 'attention';
  return (
    <article
      className={[
        'flex flex-col gap-4 rounded-2xl border bg-white p-5',
        attention ? 'border-alivia-warning/40 shadow-[0_0_0_4px_var(--color-alivia-warning-soft)]' : 'border-alivia-primary-mist',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-xl ${attention ? 'bg-alivia-warning-soft text-alivia-warning' : 'bg-alivia-page text-alivia-primary'}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-tight font-bold break-words text-alivia-primary-dark">{device.name}</h3>
          <p className="mt-0.5 text-sm text-alivia-text-muted">{device.description}</p>
        </div>
        <StatusDot tone={health.tone}>{health.label}</StatusDot>
      </div>

      {device.power.type === 'battery' ? (
        <div>
          <div className="flex justify-between text-xs font-semibold">
            <span className={attention ? 'text-alivia-warning' : 'text-alivia-secondary-deep'}>
              {device.power.level} % · {attention ? 'Batería baja' : 'Batería óptima'}
            </span>
            <span className="text-alivia-text-muted">{device.power.cell}</span>
          </div>
          <div
            role="meter"
            aria-label="Nivel de batería"
            aria-valuenow={device.power.level}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-alivia-primary-mist"
          >
            <div
              className={`h-full rounded-full ${attention ? 'bg-alivia-warning' : 'bg-alivia-secondary-deep'}`}
              style={{ width: `${device.power.level}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-alivia-text-muted">
          <Plug className="size-3.5" aria-hidden="true" />
          Alimentación eléctrica
        </p>
      )}

      <div className="space-y-0.5 text-sm">
        <p className="text-alivia-text">
          <span className="text-alivia-text-muted">Estado:</span> {device.stateLabel}
        </p>
        <p className="text-xs text-alivia-hint">Actualizado {formatRelative(device.lastSyncAt).toLowerCase()}</p>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className={[
          'mt-auto flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-[background-color,scale] duration-150 active:scale-[0.98]',
          attention ? 'bg-alivia-warning-soft text-alivia-warning hover:bg-alivia-warning/15' : 'bg-alivia-page text-alivia-primary-dark hover:bg-alivia-primary-mist',
        ].join(' ')}
      >
        {attention ? 'Ver detalle y recambio' : 'Ver detalle'}
        <ArrowRight className="size-4" aria-hidden="true" />
        <span className="sr-only">de {device.name}</span>
      </button>
    </article>
  );
}

const SUMMARY: readonly DeviceHealth[] = ['operational', 'attention', 'offline'];
const SUMMARY_LABEL: Record<DeviceHealth, (count: number) => string> = {
  operational: (count) => `${count} ${count === 1 ? 'operativo' : 'operativos'}`,
  attention: (count) => `${count} ${count === 1 ? 'requiere' : 'requieren'} atención`,
  offline: (count) => `${count} sin conexión`,
};

const EVENT_TONE: Record<HomeEvent['tone'], { label: string; tone: 'success' | 'info' | 'warning' }> = {
  ok: { label: 'Acción', tone: 'success' },
  info: { label: 'Acción', tone: 'info' },
  warning: { label: 'Alerta', tone: 'warning' },
};

/** What happened, when, and on which device: the timeline a caregiver checks from outside the home. */
function RecentEvents({ events, onOpen }: { readonly events: readonly HomeEvent[]; readonly onOpen: (deviceId: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? events : events.slice(0, 5);
  return (
    <section aria-labelledby="recent-events" className="rounded-2xl border border-alivia-primary-mist bg-white p-5">
      <h2 id="recent-events" className="text-lg font-bold text-alivia-primary-dark">
        Eventos recientes
      </h2>
      {events.length === 0 ? (
        <p className="mt-2 text-sm text-alivia-text-muted">Todavía no hay acciones ni alertas registradas.</p>
      ) : (
        <ol className="mt-3 divide-y divide-alivia-primary-mist">
          {shown.map((event) => (
            <li key={`${event.deviceId}-${event.at}`} className="flex flex-wrap items-start gap-x-4 gap-y-1 py-3">
              <time dateTime={event.at} title={formatDateTime(event.at)} className="w-20 shrink-0 text-sm font-semibold text-alivia-primary-dark tabular-nums">
                {formatTime(event.at)}
                <span className="block text-xs font-normal text-alivia-hint">{formatRelative(event.at)}</span>
              </time>
              <div className="min-w-0 flex-1 basis-48">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-alivia-text">
                  {event.title}
                  <StatusDot tone={EVENT_TONE[event.tone].tone}>{EVENT_TONE[event.tone].label}</StatusDot>
                </p>
                <p className="text-sm text-alivia-text-muted">{event.detail}</p>
              </div>
              <button
                type="button"
                onClick={() => onOpen(event.deviceId)}
                className="min-h-11 rounded-lg px-2 text-left text-sm font-semibold text-alivia-primary-mid hover:bg-alivia-primary-mist sm:text-right"
              >
                {event.deviceName}
                <span className="block text-xs font-normal text-alivia-hint">{event.roomName}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {events.length > 5 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 min-h-11 rounded-lg px-3 text-sm font-semibold text-alivia-primary-mid hover:bg-alivia-primary-mist"
        >
          {expanded ? 'Ver menos' : `Ver los ${events.length} eventos`}
        </button>
      )}
    </section>
  );
}

export function DevicesView() {
  useDocumentTitle('Dispositivos');
  const { accessLevel } = useSession();
  const { actor, status: actorStatus, retry: retryActor } = useCareActor();
  const allowed = actor?.can('view_devices') ?? false;
  // Waits for the caregiver; the load itself refuses anyone without the permission.
  const { state, retry } = useLoad(
    () => (actor && allowed ? loadSupervision(actor) : new Promise<never>(() => {})),
    [actor?.id, allowed],
  );
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('device');
  const home = state.status === 'ready' ? state.data : null;
  const selected = home?.devices.find((device) => device.id === selectedId) ?? null;
  const connection = home ? homeConnection(home) : null;
  const lastSync = connection?.lastUpdateAt;

  const select = (id: string | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (id) next.set('device', id);
        else next.delete('device');
        return next;
      },
      { replace: true },
    );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        crumb="Dispositivos"
        title="Dispositivos"
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            Consulta el estado de los dispositivos instalados en tu hogar.
            {lastSync && (
              <span className="inline-flex items-center gap-1 text-xs text-alivia-secondary-deep">
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Actualizado {formatRelative(lastSync).toLowerCase()}
              </span>
            )}
          </span>
        }
        actions={
          accessLevel === 'principal' && <Link
            to="/incidents?report=1"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-alivia-primary-light/70 bg-white px-4 text-sm font-semibold text-alivia-primary-dark transition-colors hover:bg-alivia-primary-mist/60"
          >
            <Flag className="size-4" aria-hidden="true" />
            Reportar un problema
          </Link>
        }
      />
      {isTrackingSample() && <SampleDataNotice />}

      {actorStatus === 'error' && (
        <ErrorState title="No pudimos comprobar tus permisos" message="Revisa tu conexión e inténtalo de nuevo." onRetry={retryActor} />
      )}
      {actor && !allowed && (
        <EmptyState
          title="No tienes acceso a la supervisión remota"
          description="Pide al cuidador principal que te asigne «Consultar dispositivos» en la red de cuidado."
        />
      )}

      {allowed && state.status === 'loading' && <SkeletonCards label="Consultando tus dispositivos…" count={5} />}
      {state.status === 'error' && (
        <ErrorState title="No pudimos consultar los dispositivos" message="Revisa tu conexión e inténtalo de nuevo." onRetry={retry} />
      )}

      {home && home.devices.length === 0 && (
        <EmptyState title="Aún no hay dispositivos instalados" description="Aparecerán aquí cuando el técnico termine la instalación." />
      )}

      {connection && !connection.online && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-alivia-warning/40 bg-alivia-warning-soft px-4 py-3 text-sm">
          <WifiOff className="mt-0.5 size-5 shrink-0 text-alivia-warning" aria-hidden="true" />
          <div>
            <p className="font-semibold text-alivia-text">La vivienda perdió la conexión</p>
            <p className="text-alivia-text-muted">
              {connection.lastUpdateAt
                ? `Lo que ves es la última actualización recibida (${formatDateTime(connection.lastUpdateAt)}).`
                : 'Aún no recibimos datos de la vivienda.'}{' '}
              Puede haber eventos pendientes que aparecerán cuando vuelva la conexión.
            </p>
          </div>
        </div>
      )}

      {home && home.devices.length > 0 && (
        <>
          <ul className="flex animate-reveal flex-wrap gap-2" aria-label="Resumen de estado">
            {SUMMARY.map((health) => (
              <li key={health}>
                <StatusDot tone={HEALTH[health].tone} className="px-3 py-1 text-sm">
                  {SUMMARY_LABEL[health](home.devices.filter((device) => device.health === health).length)}
                </StatusDot>
              </li>
            ))}
          </ul>

          <RecentEvents events={recentEvents(home.devices)} onOpen={select} />

          {home.rooms.map((room, index) => {
            const devices = home.devices.filter((device) => device.roomId === room.id);
            if (devices.length === 0) return null;
            return (
              <section
                key={room.id}
                aria-labelledby={`room-${room.id}`}
                className="flex animate-reveal flex-col gap-4"
                // Rooms follow the summary in reading order; capped so a large home never waits on its tail.
                style={{ animationDelay: `${Math.min(index + 1, 3) * 50}ms` }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id={`room-${room.id}`} className="flex items-center gap-2 text-xl font-bold text-alivia-primary-dark">
                    <BedDouble className="size-5 text-alivia-secondary-deep" aria-hidden="true" />
                    {room.name}
                  </h2>
                  <p className="text-sm text-alivia-text-muted">
                    {room.description} · {devices.length} {devices.length === 1 ? 'dispositivo' : 'dispositivos'}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {devices.map((device) => (
                    <DeviceCard key={device.id} device={device} onOpen={() => select(device.id)} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}

      <DeviceDetailDrawer device={selected} onClose={() => select(null)} />
    </div>
  );
}

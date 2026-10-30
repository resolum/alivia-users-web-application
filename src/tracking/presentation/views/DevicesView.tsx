import { Link, useSearchParams } from 'react-router';
import { ArrowRight, BedDouble, Flag, Plug, RefreshCw } from 'lucide-react';
import { formatRelative } from '@/shared/domain/model/valueobjects/relative-time.ts';
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
import { isTrackingSample, loadHomeDevices } from '../../application/tracking.store.ts';
import type { Device, DeviceHealth } from '../../domain/model/device.entity.ts';
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

export function DevicesView() {
  useDocumentTitle('Dispositivos');
  const { state, retry } = useLoad(loadHomeDevices, []);
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('device');
  const home = state.status === 'ready' ? state.data : null;
  const selected = home?.devices.find((device) => device.id === selectedId) ?? null;
  const lastSync = home?.devices.map((device) => device.lastSyncAt).sort().at(-1);

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
          <Link
            to="/incidents?report=1"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-alivia-primary-light/70 bg-white px-4 text-sm font-semibold text-alivia-primary-dark transition-colors hover:bg-alivia-primary-mist/60"
          >
            <Flag className="size-4" aria-hidden="true" />
            Reportar un problema
          </Link>
        }
      />
      {isTrackingSample() && <SampleDataNotice />}

      {state.status === 'loading' && <SkeletonCards label="Consultando tus dispositivos…" count={5} />}
      {state.status === 'error' && (
        <ErrorState title="No pudimos consultar los dispositivos" message="Revisa tu conexión e inténtalo de nuevo." onRetry={retry} />
      )}

      {home && home.devices.length === 0 && (
        <EmptyState title="Aún no hay dispositivos instalados" description="Aparecerán aquí cuando el técnico termine la instalación." />
      )}

      {home && home.devices.length > 0 && (
        <>
          <ul className="flex flex-wrap gap-2" aria-label="Resumen de estado">
            {SUMMARY.map((health) => (
              <li key={health}>
                <StatusDot tone={HEALTH[health].tone} className="px-3 py-1 text-sm">
                  {SUMMARY_LABEL[health](home.devices.filter((device) => device.health === health).length)}
                </StatusDot>
              </li>
            ))}
          </ul>

          {home.rooms.map((room) => {
            const devices = home.devices.filter((device) => device.roomId === room.id);
            if (devices.length === 0) return null;
            return (
              <section key={room.id} aria-labelledby={`room-${room.id}`} className="flex flex-col gap-4">
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

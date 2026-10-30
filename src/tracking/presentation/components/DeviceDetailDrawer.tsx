import { useNavigate } from 'react-router';
import { BatteryLow, Wifi, Wrench } from 'lucide-react';
import { formatRelative, formatTime } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { Button, Drawer, StatusDot } from '@/shared/presentation/components/ui/index.ts';
import type { Device } from '../../domain/model/device.entity.ts';
import { HEALTH, KIND_ICON } from '../device-presentation.ts';

const EVENT_DOT = { ok: 'bg-alivia-secondary-deep', info: 'bg-alivia-primary', warning: 'bg-alivia-warning' } as const;

function Row({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-alivia-primary-mist py-3 text-sm last:border-0">
      <dt className="text-alivia-text-muted">{label}</dt>
      <dd className="font-semibold text-alivia-primary-dark">{children}</dd>
    </div>
  );
}

export function DeviceDetailDrawer({ device, onClose }: { readonly device: Device | null; readonly onClose: () => void }) {
  const navigate = useNavigate();
  const Icon = device ? KIND_ICON[device.kind] : null;
  const report = (type?: string) => {
    if (!device) return;
    const params = new URLSearchParams({ report: '1', device: device.id });
    if (type) params.set('type', type);
    navigate(`/incidents?${params}`);
  };

  return (
    <Drawer
      open={device !== null}
      onClose={onClose}
      title={device?.name ?? ''}
      header={
        device &&
        Icon && (
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-alivia-warning-soft text-alivia-warning">
              <Icon className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-alivia-text-muted">
                {device.roomName}
                {device.placement && <span className="font-semibold text-alivia-secondary-deep"> · {device.placement}</span>}
              </p>
              <h2 className="text-xl font-bold text-alivia-primary-dark">{device.name}</h2>
            </div>
          </div>
        )
      }
      footer={
        device && (
          <div className="flex w-full flex-col gap-2">
            {device.hasLowBattery && (
              <Button onClick={() => report('battery')} className="w-full">
                <Wrench className="size-4" aria-hidden="true" />
                Solicitar recambio de batería
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant={device.hasLowBattery ? 'soft' : 'primary'} onClick={() => report()} className="flex-1">
                Reportar problema
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )
      }
    >
      {device && (
        <div className="flex flex-col gap-6">
          {device.hasLowBattery && (
            <div role="status" className="rounded-2xl border border-alivia-warning/30 bg-alivia-warning-soft p-4 text-alivia-warning">
              <p className="flex items-start gap-2 font-bold">
                <BatteryLow className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                Batería baja ({device.batteryLevel} %), recomendamos el recambio
              </p>
              <p className="mt-1 text-sm">
                El sensor sigue funcionando, pero conviene cambiar la pila pronto para no perder avisos.
              </p>
            </div>
          )}

          <section>
            <h3 className="text-xs font-bold tracking-wide text-alivia-text-muted uppercase">Estado y especificaciones</h3>
            <dl className="mt-2 rounded-2xl bg-alivia-page px-4">
              <Row label="Estado actual">
                <StatusDot tone={HEALTH[device.health].tone}>{device.stateLabel}</StatusDot>
              </Row>
              {device.power.type === 'battery' ? (
                <Row label="Nivel de batería">
                  <span className={device.hasLowBattery ? 'text-alivia-warning' : ''}>
                    {device.power.level} % ({device.power.cell})
                  </span>
                </Row>
              ) : (
                <Row label="Alimentación">Eléctrica</Row>
              )}
              <Row label="Conectividad">
                <span className="inline-flex items-center gap-1.5">
                  <Wifi className="size-4 text-alivia-secondary-deep" aria-hidden="true" />
                  {device.connectivity}
                </span>
              </Row>
              <Row label="Última sincronización">
                {formatTime(device.lastSyncAt)} ({formatRelative(device.lastSyncAt).toLowerCase()})
              </Row>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-bold tracking-wide text-alivia-text-muted uppercase">Instalación</h3>
            <dl className="mt-2 rounded-2xl border border-alivia-primary-mist px-4">
              <Row label="Habitación">{device.roomName}</Row>
              <Row label="Código">{device.code}</Row>
              <Row label="Técnico asignado">{device.technicianName}</Row>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-bold tracking-wide text-alivia-text-muted uppercase">Historial reciente</h3>
            <ol className="mt-3 space-y-4 border-l-2 border-alivia-primary-mist pl-4">
              {device.history.map((event) => (
                <li key={event.at} className="relative">
                  <span aria-hidden="true" className={`absolute top-1.5 -left-[21px] size-2.5 rounded-full ring-2 ring-white ${EVENT_DOT[event.tone]}`} />
                  <p className={`text-sm font-semibold ${event.tone === 'warning' ? 'text-alivia-warning' : 'text-alivia-primary-dark'}`}>
                    {formatRelative(event.at) === 'Ayer' ? 'Ayer ' : ''}
                    {formatTime(event.at)} · {event.title}
                  </p>
                  <p className="text-sm text-alivia-text-muted">{event.detail}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Drawer>
  );
}

import { useState } from 'react';
import { CloudOff } from 'lucide-react';
import { formatDateTime } from '@/shared/domain/model/valueobjects/relative-time.ts';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SampleDataNotice,
  SkeletonRows,
  StatusDot,
  type StatusTone,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { homeConnection, loadHomeDevices } from '@/tracking/index.ts';
import { isAnalyticsSample, loadDeviceActions } from '../../application/analytics.store.ts';
import {
  ACTION_RESULTS,
  DEVICE_KINDS,
  filterActions,
  summarize,
  uniqueActions,
  type ActionResult,
  type DeviceKind,
  type MetricRange,
} from '../../domain/model/device-action.ts';

const RANGES: readonly { id: MetricRange; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: '7 días' },
  { id: 'month', label: '30 días' },
];

const KIND_LABELS: Record<DeviceKind, string> = { light: 'Luces', door: 'Puertas', window: 'Ventanas', curtain: 'Cortinas' };

const RESULT: Record<ActionResult, { label: string; tone: StatusTone }> = {
  succeeded: { label: 'Exitosa', tone: 'success' },
  failed: { label: 'Fallida', tone: 'danger' },
  low_confidence: { label: 'Rechazada por baja confianza', tone: 'warning' },
  unconfirmed: { label: 'Sin confirmación del actuador', tone: 'neutral' },
};

const VOICE_ROWS = 20;

const selectClass =
  'min-h-11 rounded-lg border border-alivia-primary-mist bg-white px-3 text-base font-semibold text-alivia-primary-dark transition-colors duration-150 hover:border-alivia-primary-light sm:text-sm';

export function MetricsView() {
  useDocumentTitle('Métricas');
  const [range, setRange] = useState<MetricRange>('week');
  const [deviceId, setDeviceId] = useState('');
  const { state, retry } = useLoad(loadDeviceActions, []);
  const home = useLoad(loadHomeDevices, []);
  const connection = home.state.status === 'ready' ? homeConnection(home.state.data) : null;

  const all = state.status === 'ready' ? uniqueActions(state.data) : [];
  const devices = [...new Map(all.map((action) => [action.deviceId, action.deviceName])).entries()];
  const now = new Date();
  const actions = filterActions(all, range, deviceId, now).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const summary = summarize(actions);
  const voice = actions.filter((action) => action.source === 'voice');

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        crumb="Métricas"
        title="Acciones y autonomía"
        subtitle={
          connection?.lastUpdateAt
            ? `Última actualización de la vivienda: ${formatDateTime(connection.lastUpdateAt)}`
            : 'Lo que pidió la persona asistida a sus dispositivos y cómo terminó.'
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="metrics-device">Dispositivo</label>
            <select id="metrics-device" className={selectClass} value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
              <option value="">Todos los dispositivos</option>
              {devices.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <div role="group" aria-label="Periodo" className="flex rounded-xl bg-alivia-primary-mist/70 p-1">
              {RANGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={range === item.id}
                  onClick={() => setRange(item.id)}
                  className={[
                    'min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors duration-150',
                    range === item.id ? 'bg-white text-alivia-primary-dark shadow-xs' : 'text-alivia-text-muted hover:text-alivia-primary-dark',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        }
      />
      {isAnalyticsSample() && <SampleDataNotice />}

      {connection && !connection.online && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-alivia-warning/40 bg-alivia-warning-soft px-4 py-3 text-sm">
          <CloudOff className="mt-0.5 size-5 shrink-0 text-alivia-warning" aria-hidden="true" />
          <p className="text-alivia-text">
            <strong>El Edge de la vivienda está sin conexión.</strong> Puede haber acciones pendientes de sincronizar; las métricas
            muestran lo recibido hasta {connection.lastUpdateAt ? formatDateTime(connection.lastUpdateAt) : 'el último contacto'}.
          </p>
        </div>
      )}

      {state.status === 'loading' && <SkeletonRows label="Calculando métricas…" rows={4} />}
      {state.status === 'error' && (
        <ErrorState title="No pudimos calcular las métricas" message="Revisa tu conexión e inténtalo de nuevo." onRetry={retry} />
      )}
      {state.status === 'ready' && actions.length === 0 && (
        <EmptyState
          title="No hay acciones en este periodo"
          description="Elige otro periodo u otro dispositivo, o espera a que la persona asistida use sus dispositivos."
        />
      )}

      {state.status === 'ready' && actions.length > 0 && (
        <>
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <section className="rounded-2xl border border-alivia-primary-mist bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold text-alivia-primary-dark">Solicitadas y ejecutadas</h2>
              <ul className="mt-4 flex flex-col gap-4">
                {DEVICE_KINDS.filter((kind) => summary.byKind[kind].requested > 0).map((kind) => {
                  const { requested, executed } = summary.byKind[kind];
                  return (
                    <li key={kind} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5">
                      <span className="text-sm font-semibold text-alivia-text">{KIND_LABELS[kind]}</span>
                      <span className="text-right text-sm text-alivia-text tabular-nums">
                        <strong className="text-alivia-primary-dark">{executed}</strong> ejecutadas de {requested} solicitadas
                      </span>
                      <span aria-hidden="true" className="col-span-2 h-2 overflow-hidden rounded-full bg-alivia-primary-mist">
                        <span className="block h-full rounded-full bg-alivia-secondary-deep" style={{ width: `${(executed / requested) * 100}%` }} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-2xl border border-alivia-primary-mist bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold text-alivia-primary-dark">Resultado</h2>
              <dl className="mt-4 flex flex-col gap-2 text-sm">
                {ACTION_RESULTS.map((result) => (
                  <div key={result} className="flex items-center justify-between gap-3 rounded-lg bg-alivia-page px-3 py-2.5">
                    <dt>
                      <StatusDot tone={RESULT[result].tone}>{RESULT[result].label}</StatusDot>
                    </dt>
                    <dd className="font-bold text-alivia-primary-dark tabular-nums">{summary.byResult[result]}</dd>
                  </div>
                ))}
              </dl>
              {summary.local > 0 && (
                <p className="mt-3 text-xs text-alivia-text-muted">
                  {summary.local === 1 ? '1 acción se ejecutó' : `${summary.local} acciones se ejecutaron`} localmente sin Internet y se
                  contó una sola vez al sincronizar.
                </p>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-alivia-primary-mist bg-white">
            <header className="px-5 pt-5 sm:px-6">
              <h2 className="text-lg font-bold text-alivia-primary-dark">Comandos de voz</h2>
              <p className="text-sm text-alivia-text-muted">Se muestra lo que se interpretó de cada comando. El audio no se expone ni se reproduce.</p>
            </header>
            {voice.length === 0 ? (
              <p className="px-5 py-8 text-sm text-alivia-text-muted sm:px-6">No hubo comandos de voz en este periodo.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <caption className="sr-only">Últimos comandos de voz del periodo</caption>
                  <thead className="bg-alivia-page text-alivia-text-muted">
                    <tr>
                      <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">Momento</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Intención</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Dispositivo</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-alivia-primary-mist">
                    {voice.slice(0, VOICE_ROWS).map((action) => (
                      <tr key={action.eventId}>
                        <td className="px-5 py-3 tabular-nums sm:px-6">
                          {formatDateTime(action.occurredAt)}
                          {action.executedLocally && <span className="block text-xs text-alivia-text-muted">Ejecutada localmente</span>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-alivia-text">{action.intent}</td>
                        <td className="px-4 py-3">{action.deviceName}</td>
                        <td className="px-4 py-3">
                          <StatusDot tone={RESULT[action.result].tone}>{RESULT[action.result].label}</StatusDot>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {voice.length > VOICE_ROWS && (
                  <p className="px-5 py-3 text-xs text-alivia-text-muted sm:px-6">
                    Se muestran los {VOICE_ROWS} más recientes de {voice.length}. Filtra por dispositivo o periodo para ver otros.
                  </p>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

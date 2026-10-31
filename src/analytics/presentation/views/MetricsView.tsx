import { useState } from 'react';
import { Link } from 'react-router';
import { formatRelative } from '@/shared/domain/model/valueobjects/relative-time.ts';
import {
  Bone,
  EmptyState,
  ErrorState,
  PageHeader,
  SampleDataNotice,
  Skeleton,
  StatusDot,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { loadHomeDevices } from '@/tracking/index.ts';
import { isAnalyticsSample, loadAutonomySummary } from '../../application/analytics.store.ts';
import { autonomyPercent, autonomyShare, type MetricRange } from '../../domain/model/autonomy-summary.ts';
import { AutonomyBarChart } from '../components/AutonomyBarChart.tsx';

const RANGES: readonly { id: MetricRange; label: string; chart: string }[] = [
  { id: 'today', label: 'Hoy', chart: 'Autonomía de hoy' },
  { id: 'week', label: '7 días', chart: 'Autonomía semanal' },
  { id: 'month', label: '30 días', chart: 'Autonomía del mes' },
];

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function AutonomyRing({ percent }: { readonly percent: number }) {
  return (
    <div className="relative mx-auto size-44">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="14" className="stroke-alivia-primary-mist" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
          className="stroke-alivia-secondary-deep transition-[stroke-dashoffset] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
        />
      </svg>
      <p className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-alivia-primary-dark tabular-nums">{percent}%</span>
        <span className="text-[11px] font-bold tracking-wide text-alivia-text-muted uppercase">autónoma</span>
      </p>
    </div>
  );
}

export function MetricsView() {
  useDocumentTitle('Métricas');
  const [range, setRange] = useState<MetricRange>('week');
  const { state, retry } = useLoad(() => loadAutonomySummary(range), [range]);
  const devices = useLoad(loadHomeDevices, []);
  const attention = devices.state.status === 'ready' ? devices.state.data.devices.filter((device) => device.health !== 'operational').length : 0;
  const summary = state.status === 'ready' ? state.data : null;
  const percent = summary ? autonomyPercent(summary) : null;
  const share = summary ? autonomyShare(summary) : null;
  const maxDevice = summary ? Math.max(1, ...summary.devices.map((device) => device.amount)) : 1;
  const rangeInfo = RANGES.find((item) => item.id === range) ?? RANGES[1];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        crumb="Métricas"
        title={
          <span className="flex flex-wrap items-center gap-3">
            Resumen de autonomía
            {attention > 0 && (
              <Link to="/devices" className="rounded-full text-base font-normal">
                <StatusDot tone="warning">
                  {attention} {attention === 1 ? 'dispositivo requiere' : 'dispositivos requieren'} atención
                </StatusDot>
              </Link>
            )}
          </span>
        }
        subtitle={summary && `Actualizado ${formatRelative(summary.generatedAt).toLowerCase()}`}
        actions={
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
        }
      />
      {isAnalyticsSample() && <SampleDataNotice />}

      {state.status === 'loading' && <Skeleton label="Calculando métricas…" className="flex flex-col gap-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-alivia-primary-mist bg-white p-6">
              <Bone className="h-5 w-44" />
              <div className="mt-6 flex h-56 items-end justify-around gap-3">
                {['h-[60%]', 'h-[70%]', 'h-[50%]', 'h-[80%]', 'h-[90%]', 'h-[65%]', 'h-[75%]'].map((height) => (
                  <Bone key={height} className={`w-full max-w-10 rounded-t-md rounded-b-none ${height}`} />
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-5 rounded-2xl border border-alivia-primary-mist bg-white p-6">
              <Bone className="h-5 w-40 self-start" />
              <Bone className="size-44 rounded-full" />
              <Bone className="h-10 w-full rounded-lg" />
              <Bone className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-alivia-primary-mist bg-white p-6">
            <Bone className="h-5 w-48" />
            {['w-[90%]', 'w-[75%]', 'w-[60%]', 'w-[45%]'].map((width) => (
              <Bone key={width} className={`h-2 rounded-full ${width}`} />
            ))}
          </div>
        </Skeleton>}
      {state.status === 'error' && (
        <ErrorState title="No pudimos calcular las métricas" message="Revisa tu conexión e inténtalo de nuevo." onRetry={retry} />
      )}

      {summary && share && share.total === 0 && (
        <EmptyState title="Aún no hay actividad registrada" description="Las métricas aparecen cuando los dispositivos registran las primeras acciones." />
      )}

      {summary && share && percent !== null && (
        <>
          <div className="reveal-stagger grid gap-5 lg:grid-cols-[1fr_320px]">
            <section className="rounded-2xl border border-alivia-primary-mist bg-white p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-alivia-primary-dark">{rangeInfo.chart}</h2>
                <ul className="flex flex-wrap gap-4 text-xs text-alivia-text-muted">
                  <li className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-2.5 rounded-sm bg-alivia-secondary-deep" />
                    Acciones autónomas
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-2.5 rounded-sm bg-alivia-primary-mist" />
                    Acciones con asistencia
                  </li>
                </ul>
              </div>
              <AutonomyBarChart key={range} buckets={summary.buckets} highlight={range === 'week' ? summary.buckets.length - 1 : null} />
            </section>

            <section className="flex flex-col gap-5 rounded-2xl border border-alivia-primary-mist bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold text-alivia-primary-dark">Nivel de autonomía</h2>
              <AutonomyRing percent={percent} />
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-alivia-page px-3 py-2.5">
                  <dt className="flex items-center gap-2 text-alivia-text">
                    <span aria-hidden="true" className="size-2 rounded-full bg-alivia-secondary-deep" />
                    Autónomas
                  </dt>
                  <dd className="font-bold text-alivia-primary-dark tabular-nums">
                    {share.autonomous} · {percent} %
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-alivia-page px-3 py-2.5">
                  <dt className="flex items-center gap-2 text-alivia-text">
                    <span aria-hidden="true" className="size-2 rounded-full bg-alivia-primary-light" />
                    Con asistencia
                  </dt>
                  <dd className="font-bold text-alivia-primary-dark tabular-nums">
                    {share.assisted} · {100 - percent} %
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="rounded-2xl border border-alivia-primary-mist bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-alivia-primary-dark">Uso por dispositivo</h2>
            <ul className="mt-4 flex flex-col gap-4">
              {summary.devices.map((device, index) => (
                <li key={device.deviceName} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[180px_1fr_110px]">
                  <span className="text-sm text-alivia-text">{device.deviceName}</span>
                  <span className="text-right text-sm font-bold text-alivia-primary-dark tabular-nums sm:order-last">{device.amountLabel}</span>
                  <span aria-hidden="true" className="col-span-2 h-2 overflow-hidden rounded-full bg-alivia-primary-mist sm:col-span-1">
                    <span
                      key={`${range}-${device.deviceName}`}
                      className="block h-full origin-left rounded-full bg-alivia-secondary-deep transition-[scale] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] starting:scale-x-0"
                      style={{ width: `${(device.amount / maxDevice) * 100}%`, transitionDelay: `${index * 40}ms` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowRight, CalendarClock, Plus, Search } from 'lucide-react';
import { formatDateTime } from '@/shared/domain/model/valueobjects/relative-time.ts';
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SampleDataNotice,
  SkeletonRows,
  StatusDot,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { isIncidentsSample, loadIncidents } from '../../application/incidents.store.ts';
import { INCIDENT_STAGES, PROBLEM_TYPES, type IncidentStage, type ProblemType } from '../../domain/model/incident.entity.ts';
import { DEVICE_ICON, formatWindow, STAGE } from '../incident-presentation.ts';
import { ReportIncidentDrawer } from '../components/ReportIncidentDrawer.tsx';

type Tab = 'open' | 'resolved';

export function IncidentsView() {
  useDocumentTitle('Incidencias');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { state, retry } = useLoad(loadIncidents, []);
  const [tab, setTab] = useState<Tab>('open');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<IncidentStage | ''>('');
  const [deviceFilter, setDeviceFilter] = useState('');

  const reportOpen = params.get('report') === '1';
  const initialType = PROBLEM_TYPES.includes(params.get('type') as ProblemType) ? (params.get('type') as ProblemType) : '';
  const closeReport = () => setParams({}, { replace: true });

  const all = state.status === 'ready' ? state.data : [];
  const open = all.filter((incident) => !incident.isResolved);
  const resolved = all.filter((incident) => incident.isResolved);
  const devices = [...new Map(all.map((incident) => [incident.deviceId, incident.deviceName])).entries()];
  const needle = query.trim().toLowerCase();
  const shown = (tab === 'open' ? open : resolved)
    .filter(
      (incident) =>
        (needle === '' || incident.code.toLowerCase().includes(needle) || incident.deviceName.toLowerCase().includes(needle)) &&
        (stage === '' || incident.stage === stage) &&
        (deviceFilter === '' || incident.deviceId === deviceFilter),
    )
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  const filtering = needle !== '' || stage !== '' || deviceFilter !== '';

  const selectClass =
    'min-h-11 rounded-lg border border-alivia-primary-mist bg-white px-3 text-base text-alivia-primary-dark sm:text-sm hover:border-alivia-primary-light';

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        crumb="Incidencias"
        title="Incidencias"
        subtitle="Reporta y consulta los problemas de tus dispositivos."
        actions={
          <Button onClick={() => setParams({ report: '1' })}>
            <Plus className="size-4" aria-hidden="true" />
            Reportar incidencia
          </Button>
        }
      />
      {isIncidentsSample() && <SampleDataNotice />}

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Estado de las incidencias" className="flex gap-1">
          {(['open', 'resolved'] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={tab === item}
              onClick={() => setTab(item)}
              className={[
                'min-h-11 rounded-lg px-4 text-sm font-semibold transition-colors duration-150',
                tab === item ? 'bg-alivia-primary-mist text-alivia-primary-dark' : 'text-alivia-text-muted hover:bg-white',
              ].join(' ')}
            >
              {item === 'open' ? 'En curso' : 'Resueltas'}{' '}
              <span className="font-normal">({item === 'open' ? open.length : resolved.length})</span>
            </button>
          ))}
        </div>
        <div className="flex w-full flex-wrap gap-2 md:ml-auto md:w-auto">
          <label className="relative min-w-0 flex-1 basis-56">
            <span className="sr-only">Buscar por código o dispositivo</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-alivia-hint" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por código o dispositivo"
              className={`${selectClass} w-full pl-9`}
            />
          </label>
          <label className="sr-only" htmlFor="incident-stage">Estado</label>
          <select id="incident-stage" value={stage} onChange={(event) => setStage(event.target.value as IncidentStage | '')} className={selectClass}>
            <option value="">Todos los estados</option>
            {INCIDENT_STAGES.filter((item) => (tab === 'open') !== (item === 'resolved')).map((item) => (
              <option key={item} value={item}>
                {STAGE[item].label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="incident-device">Dispositivo</label>
          <select id="incident-device" value={deviceFilter} onChange={(event) => setDeviceFilter(event.target.value)} className={selectClass}>
            <option value="">Todos los dispositivos</option>
            {devices.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.status === 'loading' && <SkeletonRows label="Cargando incidencias…" rows={3} />}
      {state.status === 'error' && (
        <ErrorState title="No pudimos cargar las incidencias" message="Revisa tu conexión e inténtalo de nuevo." onRetry={retry} />
      )}

      {state.status === 'ready' && shown.length === 0 && (
        <EmptyState
          title={filtering ? 'Ninguna incidencia coincide' : tab === 'open' ? 'No tienes incidencias en curso' : 'Aún no hay incidencias resueltas'}
          description={filtering ? 'Prueba con otro código o quita los filtros.' : 'Si un dispositivo falla, repórtalo y te mantendremos al tanto.'}
          action={
            filtering && (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('');
                  setStage('');
                  setDeviceFilter('');
                }}
              >
                Quitar filtros
              </Button>
            )
          }
        />
      )}

      {shown.length > 0 && (
        <ul className="flex flex-col gap-3">
          {shown.map((incident) => {
            const Icon = DEVICE_ICON[incident.deviceKind];
            return (
              <li key={incident.id}>
                <Link
                  to={`/incidents/${incident.id}`}
                  className="group flex flex-wrap items-center gap-4 rounded-2xl border border-alivia-primary-mist bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-alivia-primary-light hover:shadow-sm sm:p-5"
                >
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-alivia-primary-mist text-alivia-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1 basis-52">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold tracking-wide text-alivia-text-muted">{incident.code}</span>
                      <StatusDot tone={STAGE[incident.stage].tone}>{STAGE[incident.stage].label}</StatusDot>
                    </div>
                    <p className="mt-1 text-lg text-alivia-primary-dark">
                      <span className="font-bold">{incident.deviceName}</span> · {incident.roomName}
                    </p>
                    <p className="text-xs text-alivia-hint">{formatDateTime(incident.reportedAt)}</p>
                  </div>
                  {incident.visit && !incident.isResolved ? (
                    <span className="flex items-center gap-2 rounded-xl bg-alivia-page px-3 py-2 text-xs">
                      <CalendarClock className="size-4 text-alivia-secondary-deep" aria-hidden="true" />
                      <span>
                        <span className="block font-bold text-alivia-primary-dark">{formatWindow(incident.visit.start, incident.visit.end)}</span>
                        <span className="text-alivia-text-muted">Técnico: {incident.visit.technicianName}</span>
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-alivia-text-muted">
                      {incident.isResolved
                        ? `Resuelta el ${new Date(incident.stageDates.resolved ?? incident.reportedAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}`
                        : incident.remoteNote}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-sm font-bold text-alivia-primary-dark">
                    Ver detalle
                    <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <ReportIncidentDrawer
        open={reportOpen}
        initialDeviceId={params.get('device') ?? ''}
        initialType={initialType}
        onClose={closeReport}
        onReported={(incident) => navigate(`/incidents/${incident.id}/registered`, { replace: true })}
      />
    </div>
  );
}

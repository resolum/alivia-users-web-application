import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { addDays, toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import {
  Bone,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  SampleDataNotice,
  Skeleton,
  SkeletonRows,
  Toast,
  useToast,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';
import {
  cancelActivity,
  completeActivity,
  isAssistanceSample,
  loadCareNetwork,
  loadWeek,
  startOfWeek,
} from '../../application/assistance.store.ts';
import { ACTIVITY_TYPES, type ActivityState, type CareActivity } from '../../domain/model/care-activity.entity.ts';
import { ACTIVITY_STATE, ACTIVITY_TYPE } from '../assistance-labels.ts';
import { ActivityDetailDrawer } from '../components/ActivityDetailDrawer.tsx';
import { ActivityFormDrawer } from '../components/ActivityFormDrawer.tsx';
import { AgendaRows, DayAgenda } from '../components/DayAgenda.tsx';
import { WeekCalendar } from '../components/WeekCalendar.tsx';

type Mode = 'day' | 'week' | 'list';

const MODES: readonly { id: Mode; label: string }[] = [
  { id: 'day', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'list', label: 'Lista' },
];

interface Filters {
  readonly caregiverId: string;
  readonly type: string;
  readonly state: ActivityState | '';
}

const NO_FILTERS: Filters = { caregiverId: '', type: '', state: '' };

function rangeLabel(mode: Mode, anchor: Date, weekStart: Date): string {
  if (mode === 'day') {
    const text = anchor.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  const end = addDays(weekStart, 6);
  const short = (date: Date) => date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  return `${short(weekStart)} – ${short(end)} ${end.getFullYear()}`;
}

/** Narrow screens open on the day view: the week grid needs a desktop width. */
const initialMode = (): Mode => (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? 'week' : 'day');

export function ActivitiesView() {
  useDocumentTitle('Actividades');
  const { accessLevel } = useSession();
  const canManage = accessLevel === 'principal';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [anchor, setAnchor] = useState(() => new Date());
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [now, setNow] = useState(() => new Date());
  const [detail, setDetail] = useState<CareActivity | null>(null);
  const [params, setParams] = useSearchParams();
  // "Nueva actividad" on Home links here with ?new=1 to open the form directly.
  const [formTarget, setFormTarget] = useState<CareActivity | 'new' | null>(() =>
    canManage && params.get('new') === '1' ? 'new' : null,
  );
  const [cancelling, setCancelling] = useState<CareActivity | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, notify] = useToast();

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const weekKey = toIsoDate(weekStart);
  const { state, retry, setData } = useLoad(() => loadWeek(weekStart), [weekKey]);
  const network = useLoad(loadCareNetwork, []);

  // States like "Pendiente" become "Vencida" as time passes; refresh once a minute.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const caregivers = network.state.status === 'ready' ? [network.state.data.principal, ...network.state.data.additional.filter((c) => c.status === 'active')] : [];
  const assistedPersonName = network.state.status === 'ready' ? network.state.data.assistedPersonName : '';

  const all = state.status === 'ready' ? state.data : [];
  const visible = all.filter(
    (activity) =>
      (filters.caregiverId === '' || activity.caregiverId === filters.caregiverId) &&
      (filters.type === '' || activity.type === filters.type) &&
      (filters.state === '' || activity.stateAt(now) === filters.state),
  );
  const dayItems = visible.filter((activity) => activity.date === toIsoDate(anchor));
  const filtersOn = filters !== NO_FILTERS;

  const upsert = (activity: CareActivity) => {
    const inWeek = activity.date >= weekKey && activity.date <= toIsoDate(addDays(weekStart, 6));
    const rest = all.filter((item) => item.id !== activity.id);
    setData(inWeek ? [...rest, activity] : rest);
    if (detail?.id === activity.id) setDetail(activity);
  };

  const complete = async (activity: CareActivity) => {
    try {
      upsert(await completeActivity(activity.id));
      notify(`«${activity.title}» marcada como completada`);
    } catch {
      notify('No pudimos actualizar la actividad. Inténtalo de nuevo.');
    }
  };

  const confirmCancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      upsert(await cancelActivity(cancelling.id));
      notify('Actividad cancelada');
    } catch {
      notify('No pudimos cancelar la actividad. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
      setCancelling(null);
    }
  };

  const shift = (direction: -1 | 1) => setAnchor((date) => addDays(date, direction * (mode === 'day' ? 1 : 7)));
  const openEdit = (activity: CareActivity) => {
    setDetail(null);
    setFormTarget(activity);
  };

  const selectClass =
    'min-h-11 rounded-lg border border-transparent bg-alivia-page px-3 text-base text-alivia-primary-dark sm:text-sm hover:border-alivia-primary-light';

  const empty = (
    <EmptyState
      title={filtersOn ? 'Ninguna actividad coincide con los filtros' : 'No hay actividades en estas fechas'}
      description={filtersOn ? 'Quita algún filtro para ver más resultados.' : 'Programa la primera para organizar el cuidado.'}
      action={
        filtersOn ? (
          <Button variant="outline" onClick={() => setFilters(NO_FILTERS)}>
            Quitar filtros
          </Button>
        ) : (
          canManage && <Button onClick={() => setFormTarget('new')}>Nueva actividad</Button>
        )
      }
    />
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <PageHeader
        crumb="Actividades"
        title="Actividades"
        subtitle="Organiza y consulta las actividades de cuidado."
        actions={
          <>
            <div role="group" aria-label="Vista" className="flex rounded-xl bg-alivia-primary-mist/70 p-1">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={mode === item.id}
                  onClick={() => {
                    setMode(item.id);
                    if (item.id === 'day') setAnchor(new Date());
                  }}
                  className={[
                    'min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors duration-150',
                    mode === item.id ? 'bg-alivia-primary-dark text-white' : 'text-alivia-primary-dark hover:bg-white/70',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {canManage && (
              <Button onClick={() => setFormTarget('new')}>
                <Plus className="size-4" aria-hidden="true" />
                Nueva actividad
              </Button>
            )}
          </>
        }
      />
      {isAssistanceSample() && <SampleDataNotice />}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-alivia-primary-mist bg-white p-2 sm:p-3">
        <div className="flex items-center gap-1 rounded-xl bg-alivia-page p-1">
          <button type="button" aria-label={mode === 'day' ? 'Día anterior' : 'Semana anterior'} onClick={() => shift(-1)} className="grid size-10 place-items-center rounded-lg text-alivia-primary-dark hover:bg-white">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setAnchor(new Date())} className="min-h-10 rounded-lg px-3 text-xs font-bold tracking-wide text-alivia-primary-dark uppercase hover:bg-white">
            Hoy
          </button>
          <button type="button" aria-label={mode === 'day' ? 'Día siguiente' : 'Semana siguiente'} onClick={() => shift(1)} className="grid size-10 place-items-center rounded-lg text-alivia-primary-dark hover:bg-white">
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
        <h2 aria-live="polite" className="text-lg font-bold text-alivia-primary-dark">
          {rangeLabel(mode, anchor, weekStart)}
        </h2>
        <div className="flex w-full flex-wrap gap-2 lg:ml-auto lg:w-auto">
          <label className="sr-only" htmlFor="filter-caregiver">Responsable</label>
          <select id="filter-caregiver" className={selectClass} value={filters.caregiverId} onChange={(e) => setFilters({ ...filters, caregiverId: e.target.value })}>
            <option value="">Responsable: todos</option>
            {caregivers.map((caregiver) => (
              <option key={caregiver.id} value={caregiver.id}>
                {caregiver.fullName}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="filter-type">Tipo</label>
          <select id="filter-type" className={selectClass} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">Tipo: todos</option>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {ACTIVITY_TYPE[type].label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="filter-state">Estado</label>
          <select id="filter-state" className={selectClass} value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value as ActivityState | '' })}>
            <option value="">Estado: todos</option>
            {(Object.keys(ACTIVITY_STATE) as ActivityState[]).map((key) => (
              <option key={key} value={key}>
                {ACTIVITY_STATE[key].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.status === 'loading' && (mode === 'week' ? (
          <Skeleton label="Cargando actividades…" className="h-[34rem] overflow-hidden rounded-2xl border border-alivia-primary-mist bg-white">
            <div className="grid h-full grid-cols-[56px_repeat(7,minmax(0,1fr))]">
              {Array.from({ length: 8 }, (_, column) => (
                <div key={column} className="border-l border-alivia-primary-mist p-1.5 first:border-0">
                  <Bone className="mx-auto mb-4 h-8 w-10" />
                  {column > 0 &&
                    [0, 1].map((card) => (
                      <Bone key={card} className={(column + card) % 3 ? 'mt-10 h-12 w-full rounded-lg' : 'mt-24 h-12 w-full rounded-lg'} />
                    ))}
                </div>
              ))}
            </div>
          </Skeleton>
        ) : (
          <SkeletonRows label="Cargando actividades…" rows={5} />
        ))}
      {state.status === 'error' && (
        <ErrorState title="No pudimos cargar las actividades" message="Revisa tu conexión e inténtalo de nuevo." onRetry={retry} />
      )}

      {state.status === 'ready' && mode === 'week' && <WeekCalendar weekStart={weekStart} activities={visible} now={now} onOpen={setDetail} />}

      {state.status === 'ready' && mode === 'day' &&
        (dayItems.length === 0 ? (
          empty
        ) : (
          <DayAgenda activities={dayItems} now={now} canManage={canManage} onOpen={setDetail} onComplete={complete} onReschedule={openEdit} />
        ))}

      {state.status === 'ready' && mode === 'list' &&
        (visible.length === 0 ? (
          empty
        ) : (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(weekStart, index))).map((iso) => {
              const items = visible.filter((activity) => activity.date === iso).sort((a, b) => a.startMinute - b.startMinute);
              if (items.length === 0) return null;
              const label = new Date(`${iso}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
              return (
                <section key={iso} className="overflow-hidden rounded-2xl border border-alivia-primary-mist bg-white">
                  <h3 className="bg-alivia-page px-5 py-2.5 text-sm font-bold text-alivia-primary-dark first-letter:uppercase">
                    {label}
                  </h3>
                  <AgendaRows activities={items} now={now} canManage={canManage} onOpen={setDetail} onComplete={complete} onReschedule={openEdit} />
                </section>
              );
            })}
          </div>
        ))}

      <ActivityDetailDrawer
        activity={detail}
        assistedPersonName={assistedPersonName}
        canManage={canManage}
        now={now}
        onClose={() => setDetail(null)}
        onComplete={complete}
        onEdit={openEdit}
        onCancel={(activity) => setCancelling(activity)}
      />

      <ActivityFormDrawer
        target={formTarget}
        defaultDate={anchor}
        assistedPersonName={assistedPersonName}
        caregivers={caregivers}
        onClose={() => {
          setFormTarget(null);
          if (params.has('new')) setParams({}, { replace: true });
        }}
        onSaved={(activity, created) => {
          setFormTarget(null);
          if (params.has('new')) setParams({}, { replace: true });
          upsert(activity);
          notify(created ? 'Actividad programada' : 'Actividad actualizada');
        }}
      />

      <ConfirmDialog
        open={cancelling !== null}
        title="¿Cancelar esta actividad?"
        confirmLabel="Cancelar actividad"
        danger
        busy={busy}
        onConfirm={confirmCancel}
        onCancel={() => setCancelling(null)}
      >
        «{cancelling?.title}» quedará en la agenda como cancelada y nadie recibirá su recordatorio.
      </ConfirmDialog>

      <Toast message={notice} />
    </div>
  );
}

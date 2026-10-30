import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, List, Repeat } from 'lucide-react';
import { addDays, toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import {
  Bone,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SampleDataNotice,
  Skeleton,
  Toast,
  useToast,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { completeActivity, isAssistanceSample, loadWeek, startOfWeek } from '../../application/assistance.store.ts';
import type { ActivityState, CareActivity } from '../../domain/model/care-activity.entity.ts';
import { formatClock, GUEST_STATE } from '../assistance-labels.ts';
import { GuestActivityDrawer } from '../components/GuestActivityDrawer.tsx';
import { GuestStatePill } from '../components/GuestStatePill.tsx';
import { WeekCalendar, WeekCalendarSkeleton } from '../components/WeekCalendar.tsx';
import { useCareActor } from '../useCareActor.ts';

type Mode = 'list' | 'schedule';
type Bucket = 'today' | 'tomorrow' | 'upcoming' | 'past';

const STATES = Object.keys(GUEST_STATE) as ActivityState[];

const BUCKETS: readonly { id: Bucket; dot: string }[] = [
  { id: 'today', dot: 'bg-alivia-primary-dark' },
  { id: 'tomorrow', dot: 'bg-alivia-secondary' },
  { id: 'upcoming', dot: 'bg-alivia-text-soft' },
  { id: 'past', dot: 'bg-alivia-primary-mist' },
];

const selectClass =
  'min-h-11 rounded-lg border border-alivia-primary-mist bg-white px-3 text-base font-semibold text-alivia-primary-dark transition-colors duration-150 hover:border-alivia-primary-light sm:text-sm';

/** ISO-8601 week number, as printed next to the range ("Semana 42"). */
function isoWeek(date: Date): number {
  const thursday = addDays(startOfWeek(date), 3);
  const firstThursday = addDays(startOfWeek(new Date(thursday.getFullYear(), 0, 4)), 3);
  return 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
}

/** "14 – 20 de octubre de 2024", naming both months when the week crosses one. */
function weekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const month = (date: Date) => date.toLocaleDateString('es-PE', { month: 'long' }).toLocaleLowerCase('es-PE');
  const head = weekStart.getMonth() === end.getMonth() ? `${weekStart.getDate()}` : `${weekStart.getDate()} de ${month(weekStart)}`;
  return `${head} – ${end.getDate()} de ${month(end)} de ${end.getFullYear()}`;
}

function weekday(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-PE', options).replace('.', '');
}

/** Mirrors the bucketed list: a day header over a few rows with time, title and state pill. */
function GuestListSkeleton() {
  return (
    <Skeleton label="Cargando tus actividades…" className="overflow-hidden rounded-2xl border border-alivia-primary-mist bg-white">
      {[3, 2].map((rows, section) => (
        <div key={section}>
          <div className="flex items-center justify-between border-b border-alivia-primary-mist bg-alivia-page px-4 py-3 sm:px-5">
            <Bone className="h-3 w-36" />
            <Bone className="h-3 w-16" />
          </div>
          <div className="divide-y divide-alivia-primary-mist">
            {Array.from({ length: rows }, (_, row) => (
              <div key={row} className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                <span className="w-[4.75rem] shrink-0">
                  <Bone className="h-4 w-14" />
                </span>
                <div className="flex-1 space-y-2">
                  <Bone className={`h-4 ${(section + row) % 2 ? 'w-2/5' : 'w-1/2'}`} />
                  <Bone className="h-3 w-16" />
                  <Bone className="h-6 w-24 rounded-full sm:hidden" />
                </div>
                <Bone className="hidden h-6 w-28 rounded-full sm:block" />
                <Bone className="size-4 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </Skeleton>
  );
}

/** Stagger for blocks entering together; capped so a long week never waits on its tail. */
const stagger = (index: number) => ({ animationDelay: `${Math.min(index, 3) * 50}ms` });

const MODES = [
  { id: 'list', label: 'Lista', icon: List },
  { id: 'schedule', label: 'Horarios', icon: CalendarDays },
] as const;

function bucketOf(date: string, today: string, tomorrow: string): Bucket {
  if (date === today) return 'today';
  if (date === tomorrow) return 'tomorrow';
  return date > tomorrow ? 'upcoming' : 'past';
}

function bucketLabel(bucket: Bucket, today: string, tomorrow: string): string {
  const longDay = (iso: string) => weekday(iso, { weekday: 'long', day: 'numeric' });
  if (bucket === 'today') return `Hoy · ${longDay(today)}`;
  if (bucket === 'tomorrow') return `Mañana · ${longDay(tomorrow)}`;
  return bucket === 'upcoming' ? 'Próximas' : 'Anteriores';
}

/** Invited caregiver's agenda: only what is assigned to them, consulted as a list or on the week grid. */
export function GuestActivitiesView() {
  useDocumentTitle('Mis actividades');
  const [mode, setMode] = useState<Mode>('list');
  const [anchor, setAnchor] = useState(() => new Date());
  const [stateFilter, setStateFilter] = useState<ActivityState | ''>('');
  const [now, setNow] = useState(() => new Date());
  const [detail, setDetail] = useState<CareActivity | null>(null);
  const [notice, notify] = useToast();

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const weekKey = toIsoDate(weekStart);
  const { state, stale, retry, setData } = useLoad(() => loadWeek(weekStart), [weekKey]);
  const { network, actor, status: networkStatus, retry: retryNetwork } = useCareActor();
  const canComplete = actor?.can('manage_activities') ?? false;

  // "Pendiente" turns into "Vencida" while the screen is open.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const assistedPersonName = network?.assistedPersonName ?? '';
  const shortName = assistedPersonName.split(' ')[0] ?? '';
  const today = toIsoDate(now);
  const tomorrow = toIsoDate(addDays(now, 1));
  const thisWeek = toIsoDate(startOfWeek(now));
  const nextWeek = toIsoDate(addDays(startOfWeek(now), 7));
  const weekChoice = weekKey === thisWeek ? 'this' : weekKey === nextWeek ? 'next' : 'other';

  const all = state.status === 'ready' && actor ? state.data : [];
  const mine = all.filter((activity) => activity.caregiverId === actor?.id);
  const visible = mine
    .filter((activity) => stateFilter === '' || activity.stateAt(now) === stateFilter)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute);
  const groups = BUCKETS.map((bucket) => ({
    bucket,
    items: visible.filter((activity) => bucketOf(activity.date, today, tomorrow) === bucket.id),
  })).filter((group) => group.items.length > 0);

  const loading = state.status === 'loading' || networkStatus === 'loading';
  const failed = state.status === 'error' || networkStatus === 'error';

  const complete = async (activity: CareActivity) => {
    if (!actor || state.status !== 'ready') return;
    try {
      const saved = await completeActivity(activity.id, actor);
      setData(state.data.map((item) => (item.id === saved.id ? saved : item)));
      setDetail(saved);
      notify(`«${activity.title}» registrada como atendida`);
    } catch {
      notify('No pudimos actualizar la actividad. Inténtalo de nuevo.');
    }
  };

  const personChip = assistedPersonName && (
    <span className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-alivia-text-muted lg:ml-auto">
      <span aria-hidden="true" className="size-2 rounded-full bg-alivia-secondary" />
      {assistedPersonName}
    </span>
  );

  const stateSelect = (
    <label className="flex items-center gap-2 text-sm text-alivia-text-muted">
      <span className={mode === 'list' ? 'sr-only' : ''}>Estado:</span>
      <select className={selectClass} value={stateFilter} onChange={(event) => setStateFilter(event.target.value as ActivityState | '')}>
        <option value="">Todos los estados</option>
        {STATES.map((key) => (
          <option key={key} value={key}>
            {GUEST_STATE[key].label}
          </option>
        ))}
      </select>
    </label>
  );

  const empty = stateFilter ? (
    <EmptyState
      title={`No tienes actividades «${GUEST_STATE[stateFilter].label.toLowerCase()}» en esta semana`}
      description="Elige otro estado para ver el resto de tu agenda."
      action={
        <Button variant="outline" onClick={() => setStateFilter('')}>
          Ver todos los estados
        </Button>
      }
    />
  ) : (
    <EmptyState
      title="No tienes actividades asignadas en esta semana"
      description="Cuando la cuidadora titular te asigne una actividad, aparecerá aquí con su horario e indicaciones."
    />
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <PageHeader
        title="Mis actividades"
        subtitle="Consulta las actividades que tienes asignadas."
        actions={
          <div role="group" aria-label="Vista" className="relative grid grid-cols-2 rounded-xl bg-alivia-primary-mist/70 p-1">
            {/* One pill travels between the options, so the switch reads as a single control. */}
            <span
              aria-hidden="true"
              className={[
                'absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-alivia-primary-dark shadow-xs',
                'transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]',
                mode === 'schedule' ? 'translate-x-full' : '',
              ].join(' ')}
            />
            {MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={mode === item.id}
                onClick={() => setMode(item.id)}
                className={[
                  'relative inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold',
                  'transition-[color,scale] duration-150 ease-out active:scale-[0.97]',
                  mode === item.id ? 'text-white' : 'text-alivia-primary-dark hover:text-alivia-primary-mid',
                ].join(' ')}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
        }
      />
      {isAssistanceSample() && <SampleDataNotice />}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-alivia-primary-mist bg-white p-2 sm:p-3">
        {mode === 'list' ? (
          <>
            <span className="pl-1 text-sm text-alivia-text-muted">Filtrar por:</span>
            <label className="sr-only" htmlFor="guest-week">Semana</label>
            <select
              id="guest-week"
              className={selectClass}
              value={weekChoice}
              onChange={(event) => setAnchor(event.target.value === 'next' ? addDays(new Date(), 7) : new Date())}
            >
              <option value="this">Esta semana</option>
              <option value="next">Próxima semana</option>
              {weekChoice === 'other' && <option value="other">{weekRange(weekStart)}</option>}
            </select>
            {stateSelect}
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 rounded-xl border border-alivia-primary-mist p-1">
              <button type="button" aria-label="Semana anterior" onClick={() => setAnchor((date) => addDays(date, -7))} className="grid size-10 place-items-center rounded-lg text-alivia-primary-dark transition-[background-color,scale] duration-150 ease-out hover:bg-alivia-page active:scale-[0.96]">
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setAnchor(new Date())} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-alivia-primary-dark transition-[background-color,scale] duration-150 ease-out hover:bg-alivia-page active:scale-[0.97]">
                Hoy
              </button>
              <button type="button" aria-label="Semana siguiente" onClick={() => setAnchor((date) => addDays(date, 7))} className="grid size-10 place-items-center rounded-lg text-alivia-primary-dark transition-[background-color,scale] duration-150 ease-out hover:bg-alivia-page active:scale-[0.96]">
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
            <h2 aria-live="polite" className="flex flex-wrap items-center gap-x-2 text-base font-bold text-alivia-primary-dark">
              <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
              {weekRange(weekStart)}
              <span className="text-sm font-normal text-alivia-text-muted">· Semana {isoWeek(weekStart)}</span>
            </h2>
            {stateSelect}
          </>
        )}
        {personChip}
      </div>

      {loading && (mode === 'schedule' ? <WeekCalendarSkeleton label="Cargando tus actividades…" /> : <GuestListSkeleton />)}
      {!loading && failed && (
        <ErrorState
          title="No pudimos cargar tus actividades"
          message="Revisa tu conexión e inténtalo de nuevo."
          onRetry={() => {
            retry();
            retryNetwork();
          }}
        />
      )}

      {!loading && !failed && (
        // The previous week dims while the next one loads, instead of sitting there unchanged.
        <div aria-busy={stale} className={`transition-opacity duration-200 ease-out ${stale ? 'opacity-50' : ''}`}>
          {mode === 'schedule' && (
            <div className="animate-reveal">
              <WeekCalendar weekStart={weekStart} activities={visible} now={now} onOpen={setDetail} caption={() => shortName} />
            </div>
          )}

          {mode === 'list' &&
            (visible.length === 0 ? (
              empty
            ) : (
              <div className="overflow-hidden rounded-2xl border border-alivia-primary-mist bg-white">
                {groups.map(({ bucket, items }, index) => {
                  const headingId = `guest-bucket-${bucket.id}`;
                  const showDay = bucket.id === 'upcoming' || bucket.id === 'past';
                  return (
                    <section key={bucket.id} aria-labelledby={headingId} className="animate-reveal" style={stagger(index)}>
                      <header className="flex items-center justify-between gap-3 border-b border-alivia-primary-mist bg-alivia-page px-4 py-2.5 sm:px-5">
                        <h3 id={headingId} className="flex items-center gap-2 text-xs font-bold tracking-wide text-alivia-primary-dark uppercase">
                          <span aria-hidden="true" className={`size-2 rounded-full ${bucket.dot}`} />
                          {bucketLabel(bucket.id, today, tomorrow)}
                        </h3>
                        <span className="text-xs text-alivia-text-muted">
                          {items.length} {items.length === 1 ? 'actividad' : 'actividades'}
                        </span>
                      </header>
                      <ul className="divide-y divide-alivia-primary-mist border-b border-alivia-primary-mist last:border-0">
                        {items.map((activity) => {
                          const activityState = activity.stateAt(now);
                          const muted = activityState === 'cancelled';
                          return (
                            <li key={activity.id}>
                              <button
                                type="button"
                                onClick={() => setDetail(activity)}
                                aria-label={`${formatClock(activity.time)}, ${activity.title}, ${GUEST_STATE[activityState].label}`}
                                className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-alivia-page/70 active:bg-alivia-primary-mist/50 sm:gap-4 sm:px-5"
                              >
                                <span className={`w-[4.75rem] shrink-0 text-sm tabular-nums ${muted ? 'text-alivia-text-muted' : 'text-alivia-primary-dark'}`}>
                                  {formatClock(activity.time)}
                                  {showDay && (
                                    <span className="block text-xs text-alivia-text-muted first-letter:uppercase">
                                      {weekday(activity.date, { weekday: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className={`flex items-center gap-1.5 font-semibold ${muted ? 'text-alivia-text-muted line-through' : 'text-alivia-primary-dark'}`}>
                                    <span className="truncate">{activity.title}</span>
                                    {activity.repetition !== 'none' && (
                                      <Repeat className="size-3.5 shrink-0 text-alivia-text-soft" aria-label="Se repite" />
                                    )}
                                  </span>
                                  <span className="mt-0.5 block truncate text-xs text-alivia-text-muted">{shortName}</span>
                                  <span className="mt-2 block sm:hidden">
                                    <GuestStatePill state={activityState} />
                                  </span>
                                </span>
                                <span className="hidden sm:block">
                                  <GuestStatePill state={activityState} />
                                </span>
                                <ChevronRight
                                  className="size-4 shrink-0 text-alivia-text-soft transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                                  aria-hidden="true"
                                />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            ))}
        </div>
      )}

      <GuestActivityDrawer
        activity={detail}
        assistedPersonName={assistedPersonName}
        canComplete={canComplete}
        now={now}
        onClose={() => setDetail(null)}
        onComplete={complete}
      />

      <Toast message={notice} />
    </div>
  );
}

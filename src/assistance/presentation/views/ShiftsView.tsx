import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { addDays, toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import {
  Avatar,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  SampleDataNotice,
  SkeletonRows,
  StatusDot,
  Toast,
  inputBase,
  useToast,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { startOfWeek } from '../../application/assistance.store.ts';
import { deleteShift, isCoordinationSample, linkedCaregivers, loadShiftBoard } from '../../application/care-coordination.store.ts';
import { shiftConflicts, type CareShift } from '../../domain/model/care-shift.entity.ts';
import { responsibleAt } from '../../domain/model/handover.entity.ts';
import { AssistanceApiError } from '../../infrastructure/assistance-api-error.ts';
import { formatRange } from '../assistance-labels.ts';
import { HandoverPanel } from '../components/HandoverPanel.tsx';
import { ShiftFormDrawer } from '../components/ShiftFormDrawer.tsx';
import { ShiftWeekCalendar } from '../components/ShiftWeekCalendar.tsx';
import { useCareActor } from '../useCareActor.ts';

const pad = (value: number) => String(value).padStart(2, '0');
const toLocalInput = (date: Date) => `${toIsoDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

type Mode = 'calendar' | 'list';
const MODES: readonly { id: Mode; label: string }[] = [
  { id: 'calendar', label: 'Calendario' },
  { id: 'list', label: 'Lista' },
];
/** Narrow screens open on the list: the week grid needs a desktop width. */
const initialMode = (): Mode => (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? 'calendar' : 'list');

export function ShiftsView() {
  useDocumentTitle('Turnos y relevos');
  const { network, actor, status: actorStatus, retry: retryActor } = useCareActor();
  const [anchor, setAnchor] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const [formTarget, setFormTarget] = useState<CareShift | 'new' | null>(null);
  const [formDate, setFormDate] = useState(() => new Date());
  const [removing, setRemoving] = useState<CareShift | null>(null);
  const [busy, setBusy] = useState(false);
  const [moment, setMoment] = useState(() => toLocalInput(new Date()));
  const [mode, setMode] = useState<Mode>(initialMode);
  const [notice, notify] = useToast();

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const weekKey = toIsoDate(weekStart);
  const { state, retry, reload } = useLoad(() => loadShiftBoard(weekStart), [weekKey]);

  // Holdovers and escalations depend on the clock, so the board re-reads it every minute.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const board = state.status === 'ready' ? state.data : null;
  const canManage = actor?.can('manage_activities') ?? false;
  const current = board ? responsibleAt(board.shifts, board.handovers, now) : null;
  const relief = current && board
    ? board.handovers.filter((item) => item.fromShiftId === current.shift.id).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0]
    : undefined;

  const queried = new Date(moment);
  const queriedValid = !Number.isNaN(queried.getTime());
  const atMoment = board && queriedValid ? responsibleAt(board.shifts, board.handovers, queried) : null;
  const availableAt = (start: Date, end: Date) =>
    network && board
      ? linkedCaregivers(network).filter((caregiver) => !board.shifts.some((shift) => shift.caregiverId === caregiver.id && shift.overlaps(start, end)))
      : [];

  const openNew = () => {
    setFormDate(anchor);
    setFormTarget('new');
  };

  const done = (message: string) => {
    notify(message);
    reload();
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await deleteShift(removing.id);
      done('Turno eliminado');
    } catch (error) {
      notify(
        error instanceof AssistanceApiError && error.code === 'has_pending'
          ? 'Este turno tiene un relevo sin confirmar; resuélvelo antes de eliminarlo.'
          : 'No pudimos eliminar el turno. Inténtalo de nuevo.',
      );
    } finally {
      setBusy(false);
      setRemoving(null);
    }
  };

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const end = addDays(weekStart, 6);
  const short = (date: Date) => date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        crumb="Turnos y relevos"
        title="Turnos y relevos"
        subtitle="Quién tiene la responsabilidad principal en cada momento y cómo pasa al siguiente cuidador."
        actions={
          canManage && (
            <Button onClick={openNew}>
              <Plus className="size-4" aria-hidden="true" />
              Asignar turno
            </Button>
          )
        }
      />
      {isCoordinationSample() && <SampleDataNotice />}

      {(state.status === 'loading' || actorStatus === 'loading') && <SkeletonRows label="Cargando turnos…" rows={4} />}
      {(state.status === 'error' || actorStatus === 'error') && (
        <ErrorState
          title="No pudimos cargar los turnos"
          message="Revisa tu conexión e inténtalo de nuevo."
          onRetry={() => {
            retry();
            retryActor();
          }}
        />
      )}

      {board && network && actor && (
        <>
          <section aria-labelledby="in-charge" className="grid gap-5 rounded-3xl border border-alivia-primary-mist bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="flex flex-col gap-3">
              <h2 id="in-charge" className="text-sm font-semibold text-alivia-text-muted">
                A cargo ahora
              </h2>
              {current ? (
                // Keyed by caregiver so a confirmed relief reads as a change of hands, not a silent text swap.
                <div
                  key={current.caregiverId}
                  className="flex items-center gap-4 transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] starting:translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0"
                >
                  <Avatar name={current.caregiverName} size="lg" />
                  <div className="min-w-0">
                    <p className="text-2xl font-bold break-words text-alivia-primary-dark">{current.caregiverName}</p>
                    <p className="text-sm text-alivia-text-muted">
                      Turno de {formatRange(current.shift.start, current.shift.end)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="flex items-start gap-2 rounded-xl bg-alivia-warning-soft px-3 py-2 text-sm text-alivia-text">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-alivia-warning" aria-hidden="true" />
                  Nadie tiene un turno en este momento. Asigna uno para que haya un responsable confirmado.
                </p>
              )}
              {current?.reason === 'holdover' && (
                <p className="text-sm text-alivia-warning">
                  Su turno terminó, pero conserva la responsabilidad hasta que se confirme el relevo.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-alivia-primary-mist pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
              <h2 className="text-sm font-semibold text-alivia-text-muted">Relevo</h2>
              {current ? (
                <HandoverPanel
                  shift={current.shift}
                  shifts={board.shifts}
                  handover={relief}
                  network={network}
                  actor={actor}
                  now={now}
                  onDone={done}
                />
              ) : (
                <p className="text-sm text-alivia-text-muted">El relevo aparece cuando hay un turno en curso.</p>
              )}
            </div>
          </section>

          <section aria-labelledby="period" className="flex flex-col gap-3 rounded-2xl border border-alivia-primary-mist bg-white p-5">
            <h2 id="period" className="text-lg font-bold text-alivia-primary-dark">
              Consultar un momento
            </h2>
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-alivia-primary-dark">
                Fecha y hora
                <input type="datetime-local" value={moment} onChange={(event) => setMoment(event.target.value)} className={`${inputBase} min-h-11 font-normal`} />
              </label>
              {queriedValid && (
                <dl className="grid flex-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2" aria-live="polite">
                  <div>
                    <dt className="text-alivia-text-muted">A cargo</dt>
                    <dd className="font-semibold text-alivia-text">{atMoment ? atMoment.caregiverName : 'Sin responsable asignado'}</dd>
                  </div>
                  <div>
                    <dt className="text-alivia-text-muted">Disponibles</dt>
                    <dd className="font-semibold text-alivia-text">
                      {availableAt(queried, new Date(queried.getTime() + 60_000)).map((caregiver) => caregiver.fullName).join(', ') || 'Nadie más'}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </section>

          <section aria-labelledby="week" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-xl bg-white p-1 ring-1 ring-alivia-primary-mist">
                <button type="button" aria-label="Semana anterior" onClick={() => setAnchor((date) => addDays(date, -7))} className="grid size-10 place-items-center rounded-lg text-alivia-primary-dark hover:bg-alivia-page">
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setAnchor(new Date())} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-alivia-primary-dark hover:bg-alivia-page">
                  Esta semana
                </button>
                <button type="button" aria-label="Semana siguiente" onClick={() => setAnchor((date) => addDays(date, 7))} className="grid size-10 place-items-center rounded-lg text-alivia-primary-dark hover:bg-alivia-page">
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
              <h2 id="week" aria-live="polite" className="text-lg font-bold text-alivia-primary-dark">
                {short(weekStart)} – {short(end)} {end.getFullYear()}
              </h2>
              <div role="group" aria-label="Vista de turnos" className="ml-auto flex rounded-xl bg-alivia-primary-mist/70 p-1">
                {MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={mode === item.id}
                    onClick={() => setMode(item.id)}
                    className={[
                      'min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors duration-150',
                      mode === item.id ? 'bg-alivia-primary-dark text-white' : 'text-alivia-primary-dark hover:bg-white/70',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {board.shifts.length === 0 && (
              <EmptyState
                title="No hay turnos esta semana"
                description="Asigna turnos para que siempre haya alguien a cargo."
                action={canManage && <Button onClick={openNew}>Asignar turno</Button>}
              />
            )}

            {board.shifts.length > 0 && mode === 'calendar' && (
              <ShiftWeekCalendar
                weekStart={weekStart}
                shifts={board.shifts.filter((shift) => shift.overlaps(weekStart, addDays(weekStart, 7)))}
                now={now}
                onOpen={canManage ? setFormTarget : undefined}
              />
            )}

            {board.shifts.length > 0 &&
              mode === 'list' &&
              days.map((day) => {
                const dayEnd = addDays(day, 1);
                const items = board.shifts
                  .filter((shift) => shift.overlaps(day, dayEnd) && shift.start >= day)
                  .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
                const free = availableAt(day, dayEnd);
                const label = day.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
                return (
                  <article key={toIsoDate(day)} className="overflow-hidden rounded-2xl border border-alivia-primary-mist bg-white">
                    <header className="flex flex-wrap items-baseline justify-between gap-2 bg-alivia-page px-5 py-2.5">
                      <h3 className="text-sm font-bold text-alivia-primary-dark first-letter:uppercase">{label}</h3>
                      <p className="text-xs text-alivia-text-muted">Sin turno: {free.map((caregiver) => caregiver.fullName.split(' ')[0]).join(', ') || 'todos tienen turno'}</p>
                    </header>
                    {items.length === 0 ? (
                      <p className="px-5 py-3 text-sm text-alivia-hint">Sin turnos asignados.</p>
                    ) : (
                      <ul className="divide-y divide-alivia-primary-mist">
                        {items.map((shift) => {
                          const overlap = shiftConflicts({ id: shift.id, caregiverId: shift.caregiverId, start: shift.start, end: shift.end }, board.shifts);
                          const running = shift.covers(now);
                          return (
                            <li key={shift.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                              <span className="w-44 shrink-0 text-sm font-semibold text-alivia-primary-dark tabular-nums">
                                {formatRange(shift.start, shift.end)}
                              </span>
                              <div className="min-w-0 flex-1 basis-48">
                                <p className="flex flex-wrap items-center gap-2 font-semibold text-alivia-text">
                                  {shift.caregiverName}
                                  {running && <StatusDot tone="success">En curso</StatusDot>}
                                  {overlap.length > 0 && <StatusDot tone="warning">Se superpone con {overlap.map((item) => item.shift.caregiverName.split(' ')[0]).join(', ')}</StatusDot>}
                                </p>
                                {shift.notes && <p className="text-sm text-alivia-text-muted">{shift.notes}</p>}
                              </div>
                              {canManage && (
                                <div className="ml-auto flex gap-1">
                                  <button type="button" aria-label={`Editar turno de ${shift.caregiverName}`} onClick={() => setFormTarget(shift)} className="grid size-11 place-items-center rounded-lg text-alivia-primary-mid hover:bg-alivia-primary-mist">
                                    <Pencil className="size-4" aria-hidden="true" />
                                  </button>
                                  <button type="button" aria-label={`Eliminar turno de ${shift.caregiverName}`} onClick={() => setRemoving(shift)} className="grid size-11 place-items-center rounded-lg text-alivia-text-muted hover:bg-alivia-danger/10 hover:text-alivia-danger">
                                    <Trash2 className="size-4" aria-hidden="true" />
                                  </button>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </article>
                );
              })}
          </section>

          <ShiftFormDrawer
            target={formTarget}
            defaultDate={formDate}
            network={network}
            shifts={board.shifts}
            onClose={() => setFormTarget(null)}
            onSaved={(shift, created) => {
              setFormTarget(null);
              done(created ? `Turno asignado a ${shift.caregiverName}` : 'Turno actualizado');
            }}
          />
        </>
      )}

      <ConfirmDialog
        open={removing !== null}
        title="¿Eliminar este turno?"
        confirmLabel="Eliminar turno"
        danger
        busy={busy}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      >
        {removing && `${removing.caregiverName} dejará de ser responsable de ${formatRange(removing.start, removing.end)}.`}
      </ConfirmDialog>

      <Toast message={notice} />
    </div>
  );
}

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, MapPin, ShieldCheck, Users } from 'lucide-react';
import { groupByDate, initials, type EvaluationSlot } from '../../domain/model/evaluation-slot.ts';

const WEEKDAY = new Intl.DateTimeFormat('es-PE', { weekday: 'short', timeZone: 'UTC' });
const DAY = new Intl.DateTimeFormat('es-PE', { day: 'numeric', timeZone: 'UTC' });
const MONTH = new Intl.DateTimeFormat('es-PE', { month: 'short', timeZone: 'UTC' });

interface ScheduleStepProps {
  readonly slots: readonly EvaluationSlot[] | null;
  readonly error: string | null;
  readonly initial: EvaluationSlot | null;
  readonly eyebrow: string;
  /** What happens with the payment while choosing, shown next to the duration. */
  readonly paymentNote: string;
  readonly addressStatus?: string;
  readonly continueLabel: string;
  readonly onRetry: () => void;
  readonly onContinue: (slot: EvaluationSlot) => void;
  readonly onBack?: { readonly label: string; readonly action: () => void };
}

export function ScheduleStep({ slots, error, initial, eyebrow, paymentNote, addressStatus, continueLabel, onRetry, onContinue, onBack }: ScheduleStepProps) {
  const groups = useMemo(() => groupByDate(slots ?? []), [slots]);
  const dates = [...groups.keys()];
  const [chosenDate, setChosenDate] = useState<string | null>(initial?.date ?? null);
  const [chosenKey, setChosenKey] = useState<string | null>(initial?.key ?? null);
  const date = chosenDate !== null && groups.has(chosenDate) ? chosenDate : dates[0] ?? null;
  const windows = date === null ? [] : groups.get(date) ?? [];
  const chosen = windows.find((slot) => slot.key === chosenKey) ?? null;

  if (error !== null) {
    return (
      <section className="mx-auto mt-7 max-w-2xl rounded-2xl border border-red-200 bg-white p-7 text-center">
        <h1 className="text-2xl font-extrabold text-alivia-primary">No pudimos cargar los horarios</h1>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <button type="button" onClick={onRetry} className="mt-5 rounded-lg bg-alivia-primary px-5 py-3 text-sm font-bold text-white">Reintentar</button>
      </section>
    );
  }
  if (slots === null) {
    return <div className="grid min-h-80 place-items-center text-sm text-alivia-text-muted">Buscando técnicos disponibles…</div>;
  }

  return (
    <section className="mx-auto mt-7 grid max-w-5xl gap-5 lg:grid-cols-[1fr_19rem]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-8">
        <p className="text-xs font-extrabold tracking-[0.1em] text-alivia-secondary-deep">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-alivia-primary">Elige cuándo te visitamos</h1>
        <p className="mt-2 text-sm leading-6 text-alivia-text-muted">
          Solo mostramos franjas en las que un técnico de Alivia está disponible según su horario laboral, desde mañana y durante los próximos 7 días.
        </p>

        {dates.length === 0 ? (
          <div className="mt-7 rounded-xl border border-dashed border-alivia-primary-light/60 bg-alivia-primary-mist/40 p-8 text-center">
            <CalendarDays aria-hidden="true" className="mx-auto size-9 text-alivia-primary-light" />
            <h2 className="mt-3 text-lg font-extrabold text-alivia-primary">No hay técnicos disponibles esta semana</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-alivia-text-muted">Vuelve a intentarlo más tarde o escríbenos y te ayudamos a coordinar la visita.</p>
            <button type="button" onClick={onRetry} className="mt-5 rounded-lg bg-alivia-primary px-5 py-2.5 text-sm font-bold text-white">Volver a buscar</button>
          </div>
        ) : (
          <>
            <h2 className="mt-7 text-xs font-bold tracking-wider text-slate-500">DÍA DE LA VISITA</h2>
            <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1" role="radiogroup" aria-label="Día de la visita">
              {dates.map((value) => {
                const day = new Date(`${value}T00:00:00Z`);
                const active = value === date;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => { setChosenDate(value); setChosenKey(null); }}
                    className={`flex min-w-[4.75rem] flex-col items-center rounded-xl border px-3 py-3 transition-colors ${active ? 'border-alivia-primary bg-alivia-primary text-white shadow-md' : 'border-slate-200 bg-white text-alivia-text hover:border-alivia-primary-light'}`}
                  >
                    <span className={`text-[0.68rem] font-bold uppercase ${active ? 'text-alivia-secondary-light' : 'text-slate-500'}`}>{WEEKDAY.format(day).replace('.', '')}</span>
                    <span className="text-2xl font-extrabold leading-tight">{DAY.format(day)}</span>
                    <span className={`text-xs ${active ? 'text-white/80' : 'text-slate-500'}`}>{MONTH.format(day).replace('.', '')}</span>
                  </button>
                );
              })}
            </div>

            <h2 className="mt-7 text-xs font-bold tracking-wider text-slate-500">FRANJA DE LLEGADA DEL TÉCNICO</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Franja horaria">
              {windows.map((slot) => {
                const active = slot.key === chosen?.key;
                return (
                  <button
                    key={slot.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setChosenKey(slot.key)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${active ? 'border-alivia-primary bg-alivia-primary-mist/60' : 'border-slate-200 bg-white hover:border-alivia-primary-light'}`}
                  >
                    <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${active ? 'bg-alivia-primary text-white' : 'bg-alivia-primary-mist text-alivia-primary'}`}><Clock aria-hidden="true" className="size-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-extrabold text-alivia-primary">{slot.startTime} – {slot.endTime}</span>
                      <span className="text-xs text-alivia-text-muted">{slot.period}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-alivia-mint px-2.5 py-1 text-[0.68rem] font-bold text-alivia-secondary-deep">
                      <Users aria-hidden="true" className="size-3.5" />{slot.availableTechnicians} {slot.availableTechnicians === 1 ? 'técnico' : 'técnicos'}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {onBack !== undefined && (
          <button type="button" onClick={onBack.action} className="mt-7 rounded-lg bg-alivia-primary-mist px-5 py-3 text-sm font-bold text-alivia-primary"><ArrowLeft aria-hidden="true" className="mr-1.5 inline size-4 align-[-3px]" />{onBack.label}</button>
        )}
      </div>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,42,107,0.05)]">
        <h2 className="text-lg font-extrabold text-alivia-primary">Visita técnica</h2>
        <ul className="mt-4 space-y-3 text-sm text-alivia-text-muted">
          <li className="flex gap-2.5"><ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-alivia-secondary-dark" />{paymentNote}</li>
        </ul>
        {addressStatus !== undefined && (
          <div className="mt-5 rounded-xl border border-slate-200 p-4">
            <p className="flex items-center gap-2 text-[0.68rem] font-bold tracking-[0.08em] text-slate-500">
              <MapPin aria-hidden="true" className="size-4 text-alivia-secondary-dark" />
              DIRECCIÓN DE INSTALACIÓN
            </p>
            <p className="mt-2 text-sm font-bold text-alivia-primary">{addressStatus}</p>
          </div>
        )}
        <div className="mt-5 rounded-xl bg-alivia-primary-mist/60 p-4">
          <p className="text-[0.68rem] font-bold tracking-[0.08em] text-slate-500">TÉCNICO ASIGNADO</p>
          {chosen === null ? (
            <p className="mt-2 text-sm text-alivia-text-muted">Elige una franja para ver quién te visitará.</p>
          ) : (
            <div className="mt-3 flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-alivia-primary text-sm font-bold text-white">{initials(chosen.technicianName)}</span>
              <div className="min-w-0">
                <p className="truncate font-extrabold text-alivia-primary">{chosen.technicianName}</p>
                <p className="text-xs text-alivia-text-muted">Técnico de soporte Alivia</p>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={chosen === null}
          onClick={() => { if (chosen !== null) onContinue(chosen); }}
          className="mt-5 w-full rounded-lg bg-alivia-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {continueLabel}<ArrowRight aria-hidden="true" className="ml-1.5 inline size-4 align-[-3px]" />
        </button>
      </aside>
    </section>
  );
}

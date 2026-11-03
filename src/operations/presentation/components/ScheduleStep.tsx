import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { formatLongDate, groupByDate, groupByWindow, initials, type EvaluationSlot } from '../../domain/model/evaluation-slot.ts';
import { ScrollRow } from './ScrollRow.tsx';

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
  /** While the chosen window is being held for the family. */
  readonly submitting?: boolean;
  readonly submitError?: string | null;
  readonly onRetry: () => void;
  readonly onContinue: (slot: EvaluationSlot) => void;
  readonly onBack?: { readonly label: string; readonly action: () => void };
}

const sectionTitle = 'mt-7 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500';

/** Day, then arrival window, then the technician: the family sees who visits them before paying. */
export function ScheduleStep({ slots, error, initial, eyebrow, paymentNote, addressStatus, continueLabel, submitting = false, submitError = null, onRetry, onContinue, onBack }: ScheduleStepProps) {
  const groups = useMemo(() => groupByDate(slots ?? []), [slots]);
  const dates = [...groups.keys()];
  const [chosenDate, setChosenDate] = useState<string | null>(initial?.date ?? null);
  const [chosenWindow, setChosenWindow] = useState<string | null>(initial?.windowKey ?? null);
  const [chosenKey, setChosenKey] = useState<string | null>(initial?.key ?? null);
  const date = chosenDate !== null && groups.has(chosenDate) ? chosenDate : dates[0] ?? null;
  const windows = useMemo(() => groupByWindow(date === null ? [] : groups.get(date) ?? []), [date, groups]);
  const picked = windows.find((item) => item.key === chosenWindow) ?? null;
  const chosen = picked?.technicians.find((slot) => slot.key === chosenKey) ?? null;

  if (error !== null && slots === null) {
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

  const pickDate = (value: string) => { setChosenDate(value); setChosenWindow(null); setChosenKey(null); };
  const pickWindow = (key: string) => { setChosenWindow(key); setChosenKey(null); };

  return (
    <section className="mx-auto mt-7 grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-8">
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
            <h2 className={sectionTitle}><span className="grid size-5 place-items-center rounded-full bg-alivia-primary text-[0.65rem] text-white">1</span>DÍA DE LA VISITA</h2>
            <ScrollRow label="Día de la visita">
              {dates.map((value) => {
                const day = new Date(`${value}T00:00:00Z`);
                const active = value === date;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => pickDate(value)}
                    className={`flex min-w-[4.75rem] shrink-0 flex-col items-center rounded-xl border px-3 py-3 transition-colors ${active ? 'border-alivia-primary bg-alivia-primary text-white shadow-md' : 'border-slate-200 bg-white text-alivia-text hover:border-alivia-primary-light'}`}
                  >
                    <span className={`text-[0.68rem] font-bold uppercase ${active ? 'text-alivia-secondary-light' : 'text-slate-500'}`}>{WEEKDAY.format(day).replace('.', '')}</span>
                    <span className="text-2xl font-extrabold leading-tight">{DAY.format(day)}</span>
                    <span className={`text-xs ${active ? 'text-white/80' : 'text-slate-500'}`}>{MONTH.format(day).replace('.', '')}</span>
                  </button>
                );
              })}
            </ScrollRow>

            <h2 className={sectionTitle}><span className="grid size-5 place-items-center rounded-full bg-alivia-primary text-[0.65rem] text-white">2</span>FRANJA DE LLEGADA <span className="font-semibold normal-case tracking-normal text-slate-400">· {windows.length} {windows.length === 1 ? 'horario' : 'horarios'}</span></h2>
            <ScrollRow key={date} label="Franja horaria">
              {windows.map((item) => {
                const active = item.key === picked?.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => pickWindow(item.key)}
                    className={`flex w-40 shrink-0 flex-col rounded-xl border-2 p-3.5 text-left transition-colors ${active ? 'border-alivia-primary bg-alivia-primary-mist/60' : 'border-slate-200 bg-white hover:border-alivia-primary-light'}`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-alivia-text-muted"><Clock aria-hidden="true" className="size-3.5" />{item.period}</span>
                    <span className="mt-1 text-lg font-extrabold text-alivia-primary">{item.startTime} – {item.endTime}</span>
                    <span className="mt-1 text-[0.7rem] font-bold text-alivia-secondary-deep">{item.technicians.length} {item.technicians.length === 1 ? 'técnico libre' : 'técnicos libres'}</span>
                  </button>
                );
              })}
            </ScrollRow>

            <h2 className={sectionTitle}><span className="grid size-5 place-items-center rounded-full bg-alivia-primary text-[0.65rem] text-white">3</span>ELIGE QUIÉN TE VISITA</h2>
            {picked === null ? (
              <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-alivia-text-muted">Elige una franja para ver los técnicos libres en ese horario.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={`Técnicos de ${picked.startTime} a ${picked.endTime}`}>
                {picked.technicians.map((slot) => {
                  const active = slot.key === chosen?.key;
                  return (
                    <button
                      key={slot.key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setChosenKey(slot.key)}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors ${active ? 'border-alivia-primary bg-alivia-primary-mist/60' : 'border-slate-200 bg-white hover:border-alivia-primary-light'}`}
                    >
                      <span className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold ${active ? 'bg-alivia-primary text-white' : 'bg-alivia-primary-mist text-alivia-primary'}`}>{initials(slot.technicianName)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-extrabold text-alivia-primary">{slot.technicianName}</span>
                        <span className="text-xs text-alivia-text-muted">Técnico de soporte Alivia</span>
                      </span>
                      <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${active ? 'border-alivia-primary bg-alivia-primary text-white' : 'border-slate-300'}`}>{active && <Check aria-hidden="true" className="size-3.5" />}</span>
                    </button>
                  );
                })}
              </div>
            )}
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
          <p className="text-[0.68rem] font-bold tracking-[0.08em] text-slate-500">TU ELECCIÓN</p>
          {chosen === null ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-alivia-text-muted"><UserRound aria-hidden="true" className="size-4" />Elige día, franja y técnico.</p>
          ) : (
            <>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-alivia-primary text-sm font-bold text-white">{initials(chosen.technicianName)}</span>
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-alivia-primary">{chosen.technicianName}</p>
                  <p className="text-xs text-alivia-text-muted">Técnico de soporte Alivia</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-alivia-text">{formatLongDate(chosen.date)}</p>
              <p className="text-sm text-alivia-text-muted">{chosen.startTime} – {chosen.endTime} hrs</p>
            </>
          )}
        </div>
        {submitError !== null && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{submitError}</p>}
        <button
          type="button"
          disabled={chosen === null || submitting}
          onClick={() => { if (chosen !== null) onContinue(chosen); }}
          className="mt-5 w-full rounded-lg bg-alivia-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting ? 'Separando tu horario…' : <>{continueLabel}<ArrowRight aria-hidden="true" className="ml-1.5 inline size-4 align-[-3px]" /></>}
        </button>
      </aside>
    </section>
  );
}

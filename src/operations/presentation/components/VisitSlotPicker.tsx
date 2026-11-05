import { useMemo, useState } from 'react';
import { CalendarDays, Check, Clock, UserRound } from 'lucide-react';
import { formatLongDate, groupByDate, groupByWindow, initials, type EvaluationSlot } from '../../domain/model/evaluation-slot.ts';
import { ScrollRow } from './ScrollRow.tsx';

const WEEKDAY = new Intl.DateTimeFormat('es-PE', { weekday: 'short', timeZone: 'UTC' });
const DAY = new Intl.DateTimeFormat('es-PE', { day: 'numeric', timeZone: 'UTC' });
const MONTH = new Intl.DateTimeFormat('es-PE', { month: 'short', timeZone: 'UTC' });

const stepTitle = 'mt-4 flex items-center gap-2 text-[0.7rem] font-bold tracking-wider text-slate-500';
const stepBadge = 'grid size-5 place-items-center rounded-full bg-alivia-primary text-[0.65rem] text-white';

interface VisitSlotPickerProps {
  readonly slots: readonly EvaluationSlot[] | null;
  readonly error: string | null;
  readonly value: EvaluationSlot | null;
  readonly invalid?: boolean;
  readonly onRetry: () => void;
  readonly onChange: (slot: EvaluationSlot | null) => void;
}

/**
 * The maintenance visit inside the report panel: day, arrival window and the technician who comes,
 * the same choice the family makes for the installation, sized for the side panel.
 */
export function VisitSlotPicker({ slots, error, value, invalid = false, onRetry, onChange }: VisitSlotPickerProps) {
  const groups = useMemo(() => groupByDate(slots ?? []), [slots]);
  const dates = [...groups.keys()];
  const [chosenDate, setChosenDate] = useState<string | null>(value?.date ?? null);
  const [chosenWindow, setChosenWindow] = useState<string | null>(value?.windowKey ?? null);
  const date = chosenDate !== null && groups.has(chosenDate) ? chosenDate : dates[0] ?? null;
  const windows = useMemo(() => groupByWindow(date === null ? [] : groups.get(date) ?? []), [date, groups]);
  const picked = windows.find((item) => item.key === chosenWindow) ?? null;
  // A refreshed list may drop the chosen technician: the choice is shown only while it is still free.
  const chosen = picked?.technicians.find((slot) => slot.key === value?.key) ?? null;

  if (error !== null && slots === null) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        No pudimos cargar los horarios. {error}
        <button type="button" onClick={onRetry} className="ml-1 font-bold underline">Reintentar</button>
      </div>
    );
  }
  if (slots === null) {
    return <p className="rounded-xl bg-alivia-page px-4 py-6 text-center text-sm text-alivia-text-muted">Buscando técnicos disponibles…</p>;
  }
  if (dates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-alivia-primary-light/60 bg-alivia-primary-mist/40 p-5 text-center">
        <CalendarDays aria-hidden="true" className="mx-auto size-7 text-alivia-primary-light" />
        <p className="mt-2 text-sm font-bold text-alivia-primary">No hay técnicos disponibles esta semana</p>
        <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-alivia-primary px-4 py-2 text-xs font-bold text-white">Volver a buscar</button>
      </div>
    );
  }

  const pickDate = (next: string) => { setChosenDate(next); setChosenWindow(null); onChange(null); };
  const pickWindow = (key: string) => { setChosenWindow(key); onChange(null); };

  return (
    <div className={`rounded-xl border p-4 ${invalid ? 'border-alivia-danger' : 'border-alivia-primary-mist'}`}>
      <h3 className={stepTitle.replace('mt-4 ', '')}><span className={stepBadge}>1</span>DÍA</h3>
      <ScrollRow label="Día de la visita">
        {dates.map((item) => {
          const day = new Date(`${item}T00:00:00Z`);
          const active = item === date;
          return (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => pickDate(item)}
              className={`flex min-w-[3.75rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2 transition-colors ${active ? 'border-alivia-primary bg-alivia-primary text-white' : 'border-slate-200 bg-white text-alivia-text hover:border-alivia-primary-light'}`}
            >
              <span className={`text-[0.62rem] font-bold uppercase ${active ? 'text-alivia-secondary-light' : 'text-slate-500'}`}>{WEEKDAY.format(day).replace('.', '')}</span>
              <span className="text-lg font-extrabold leading-tight">{DAY.format(day)}</span>
              <span className={`text-[0.68rem] ${active ? 'text-white/80' : 'text-slate-500'}`}>{MONTH.format(day).replace('.', '')}</span>
            </button>
          );
        })}
      </ScrollRow>

      <h3 className={stepTitle}><span className={stepBadge}>2</span>FRANJA DE LLEGADA</h3>
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
              className={`flex w-32 shrink-0 flex-col rounded-xl border-2 p-2.5 text-left transition-colors ${active ? 'border-alivia-primary bg-alivia-primary-mist/60' : 'border-slate-200 bg-white hover:border-alivia-primary-light'}`}
            >
              <span className="flex items-center gap-1 text-[0.68rem] font-semibold text-alivia-text-muted"><Clock aria-hidden="true" className="size-3" />{item.period}</span>
              <span className="text-sm font-extrabold text-alivia-primary">{item.startTime} – {item.endTime}</span>
              <span className="text-[0.65rem] font-bold text-alivia-secondary-deep">{item.technicians.length} {item.technicians.length === 1 ? 'técnico libre' : 'técnicos libres'}</span>
            </button>
          );
        })}
      </ScrollRow>

      <h3 className={stepTitle}><span className={stepBadge}>3</span>ELIGE QUIÉN TE VISITA</h3>
      {picked === null ? (
        <p className="mt-2 rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-alivia-text-muted">Elige una franja para ver los técnicos libres.</p>
      ) : (
        <div className="mt-2 grid gap-2" role="radiogroup" aria-label={`Técnicos de ${picked.startTime} a ${picked.endTime}`}>
          {picked.technicians.map((slot) => {
            const active = slot.key === chosen?.key;
            return (
              <button
                key={slot.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(slot)}
                className={`flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-colors ${active ? 'border-alivia-primary bg-alivia-primary-mist/60' : 'border-slate-200 bg-white hover:border-alivia-primary-light'}`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${active ? 'bg-alivia-primary text-white' : 'bg-alivia-primary-mist text-alivia-primary'}`}>{initials(slot.technicianName)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-alivia-primary">{slot.technicianName}</span>
                  <span className="text-xs text-alivia-text-muted">Técnico de soporte Alivia</span>
                </span>
                <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${active ? 'border-alivia-primary bg-alivia-primary text-white' : 'border-slate-300'}`}>{active && <Check aria-hidden="true" className="size-3" />}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 rounded-lg bg-alivia-primary-mist/60 px-3 py-2.5 text-sm">
        <p className="text-[0.65rem] font-bold tracking-[0.08em] text-slate-500">TU ELECCIÓN</p>
        {chosen === null ? (
          <p className="mt-1 flex items-center gap-2 text-alivia-text-muted"><UserRound aria-hidden="true" className="size-4" />Elige día, franja y técnico.</p>
        ) : (
          <p className="mt-1 text-alivia-text">
            <span className="font-bold text-alivia-primary">{chosen.technicianName}</span> · {formatLongDate(chosen.date)} · {chosen.startTime} – {chosen.endTime}
          </p>
        )}
      </div>
    </div>
  );
}

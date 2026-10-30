import { Clock, TriangleAlert } from 'lucide-react';
import { addDays, toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { shiftConflicts, type CareShift } from '../../domain/model/care-shift.entity.ts';
import { formatRange } from '../assistance-labels.ts';

const HOUR_PX = 28;
const DAY_MINUTES = 24 * 60;

interface Segment {
  readonly shift: CareShift;
  readonly start: number;
  readonly end: number;
}

/** The part of each shift that falls on `day`, in minutes from midnight, so night shifts show on both days. */
function segmentsOn(day: Date, shifts: readonly CareShift[]): Segment[] {
  const next = addDays(day, 1);
  return shifts
    .filter((shift) => shift.overlaps(day, next))
    .map((shift) => ({
      shift,
      start: Math.max(0, (shift.start.getTime() - day.getTime()) / 60_000),
      end: Math.min(DAY_MINUTES, (shift.end.getTime() - day.getTime()) / 60_000),
    }))
    .sort((a, b) => a.start - b.start);
}

/** Segments that share time go side by side. */
function columnsOf(segments: readonly Segment[]): Segment[][] {
  const groups: Segment[][] = [];
  let groupEnd = -1;
  for (const segment of segments) {
    const current = groups.at(-1);
    if (current && segment.start < groupEnd) {
      current.push(segment);
      groupEnd = Math.max(groupEnd, segment.end);
    } else {
      groups.push([segment]);
      groupEnd = segment.end;
    }
  }
  return groups;
}

interface ShiftWeekCalendarProps {
  readonly weekStart: Date;
  readonly shifts: readonly CareShift[];
  readonly now: Date;
  /** Present only for whoever can edit shifts. */
  readonly onOpen?: (shift: CareShift) => void;
}

export function ShiftWeekCalendar({ weekStart, shifts, now, onOpen }: ShiftWeekCalendarProps) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const today = toIsoDate(now);
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const height = 24 * HOUR_PX;

  return (
    // Like the activity grid: it scrolls inside its card on narrow screens, never the page.
    <div className="overflow-x-auto rounded-2xl border border-alivia-primary-mist bg-white">
      <div className="grid min-w-[760px] grid-cols-[56px_repeat(7,minmax(0,1fr))]">
        <div className="grid place-items-center border-b border-alivia-primary-mist">
          <Clock className="size-4 text-alivia-text-muted" aria-hidden="true" />
        </div>
        {days.map((day) => {
          const isToday = toIsoDate(day) === today;
          return (
            <div key={day.toISOString()} className={`border-b border-l border-alivia-primary-mist py-2 text-center ${isToday ? 'bg-alivia-page' : ''}`}>
              <p className="text-xs font-semibold text-alivia-text-muted uppercase">
                {day.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '')}
              </p>
              <p
                className={`mx-auto mt-0.5 grid size-8 place-items-center rounded-full text-lg font-bold ${isToday ? 'bg-alivia-primary text-white' : 'text-alivia-primary-dark'}`}
                aria-current={isToday ? 'date' : undefined}
              >
                {day.getDate()}
              </p>
            </div>
          );
        })}

        <div className="relative" style={{ height }}>
          {[0, 4, 8, 12, 16, 20].map((hour) => (
            <span
              key={hour}
              className="absolute right-2 text-[11px] font-semibold text-alivia-text-muted tabular-nums"
              style={{ top: hour * HOUR_PX + 2 }}
            >
              {String(hour).padStart(2, '0')}:00
            </span>
          ))}
        </div>

        {days.map((day) => {
          const iso = toIsoDate(day);
          return (
            <div
              key={iso}
              className={`relative border-l border-alivia-primary-mist ${iso === today ? 'bg-alivia-page/60' : ''}`}
              style={{
                height,
                // A line every 4 hours keeps the day readable without a dense ruler.
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX * 4 - 1}px, var(--color-alivia-primary-mist) ${HOUR_PX * 4 - 1}px, var(--color-alivia-primary-mist) ${HOUR_PX * 4}px)`,
              }}
            >
              {columnsOf(segmentsOn(day, shifts)).flatMap((group) =>
                group.map(({ shift, start, end }, column) => {
                  const overlap = shiftConflicts({ id: shift.id, caregiverId: shift.caregiverId, start: shift.start, end: shift.end }, shifts).length > 0;
                  const running = shift.covers(now);
                  const width = 100 / group.length;
                  const label = `${shift.caregiverName}, ${formatRange(shift.start, shift.end)}${overlap ? ', se superpone con otro turno' : ''}`;
                  const className = [
                    'absolute overflow-hidden rounded-lg border px-1.5 py-1 text-left',
                    running ? 'border-alivia-secondary/60 bg-alivia-mint' : 'border-alivia-primary-light/70 bg-alivia-primary-mist/70',
                    overlap ? 'ring-2 ring-alivia-warning/60' : '',
                    onOpen ? 'transition-[box-shadow,scale] duration-150 ease-out hover:z-10 hover:shadow-md active:scale-[0.98]' : '',
                  ].join(' ');
                  const style = {
                    top: (start / 60) * HOUR_PX + 1,
                    height: Math.max(((end - start) / 60) * HOUR_PX - 2, 18),
                    left: `calc(${column * width}% + 3px)`,
                    width: `calc(${width}% - 6px)`,
                  };
                  const content = (
                    <>
                      <span className="flex items-center justify-between gap-1">
                        <span className="truncate text-[11px] font-bold text-alivia-primary-dark">{shift.caregiverName}</span>
                        {overlap && <TriangleAlert className="size-3.5 shrink-0 text-alivia-warning" aria-hidden="true" />}
                      </span>
                      <span className="block truncate text-[10px] text-alivia-text-muted tabular-nums">{formatRange(shift.start, shift.end)}</span>
                    </>
                  );
                  return onOpen ? (
                    <button key={shift.id} type="button" aria-label={`Editar turno de ${label}`} onClick={() => onOpen(shift)} className={className} style={style}>
                      {content}
                    </button>
                  ) : (
                    <div key={shift.id} role="img" aria-label={label} className={className} style={style}>
                      {content}
                    </div>
                  );
                }),
              )}
              {iso === today && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: (nowMinute / 60) * HOUR_PX }}>
                  <span className="-ml-1 size-2.5 rounded-full bg-alivia-secondary-deep" />
                  <span className="h-0.5 flex-1 bg-alivia-secondary-deep" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

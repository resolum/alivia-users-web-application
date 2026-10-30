import { Clock, TriangleAlert } from 'lucide-react';
import { addDays, toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { Bone, Skeleton } from '@/shared/presentation/components/ui/index.ts';
import { clashingIds, overlapGroups, type CareActivity, type ActivityState } from '../../domain/model/care-activity.entity.ts';
import { ACTIVITY_STATE, ACTIVITY_TYPE, formatClock } from '../assistance-labels.ts';

const FIRST_HOUR = 6;
const LAST_HOUR = 22;
const HOUR_PX = 64;
/** Cards shorter than this cannot show title and state, so the grid treats them as this long. */
const MIN_CARD_MINUTES = 50;

const CARD_TONE: Record<ActivityState, string> = {
  completed: 'border-alivia-secondary/50 bg-alivia-mint',
  pending: 'border-alivia-primary-light bg-alivia-primary-mist/70',
  scheduled: 'border-alivia-primary-light/70 bg-white',
  overdue: 'border-alivia-danger/40 bg-alivia-danger/5',
  cancelled: 'border-alivia-primary-mist bg-alivia-page opacity-70',
};

interface WeekCalendarProps {
  readonly weekStart: Date;
  readonly activities: readonly CareActivity[];
  readonly now: Date;
  readonly onOpen: (activity: CareActivity) => void;
  /** Second line of each card; the assigned caregiver unless the screen says otherwise. */
  readonly caption?: (activity: CareActivity) => string;
}

const minuteToPx = (minute: number) => ((minute - FIRST_HOUR * 60) / 60) * HOUR_PX;

export function WeekCalendar({ weekStart, activities, now, onOpen, caption = (activity) => activity.caregiverName }: WeekCalendarProps) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, index) => FIRST_HOUR + index);
  const clashes = clashingIds(activities);
  const today = toIsoDate(now);
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const showNow = nowMinute >= FIRST_HOUR * 60 && nowMinute < LAST_HOUR * 60;

  return (
    // The grid needs ~760px; on narrow screens it scrolls inside its card, never the page.
    <div className="overflow-x-auto rounded-2xl border border-alivia-primary-mist bg-white">
      <div className="grid min-w-[760px] grid-cols-[56px_repeat(7,minmax(0,1fr))]">
        <div className="grid place-items-center border-b border-alivia-primary-mist">
          <Clock className="size-4 text-alivia-text-muted" aria-hidden="true" />
        </div>
        {days.map((day) => {
          const isToday = toIsoDate(day) === today;
          return (
            <div
              key={day.toISOString()}
              className={`border-b border-l border-alivia-primary-mist py-2 text-center ${isToday ? 'bg-alivia-page' : ''}`}
            >
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

        <div className="relative" style={{ height: hours.length * HOUR_PX }}>
          {hours.map((hour) => (
            <span
              key={hour}
              className="absolute right-2 -translate-y-1/2 text-[11px] font-semibold text-alivia-text-muted tabular-nums"
              style={{ top: (hour - FIRST_HOUR) * HOUR_PX + (hour === FIRST_HOUR ? 10 : 0) }}
            >
              {String(hour).padStart(2, '0')}:00
            </span>
          ))}
        </div>

        {days.map((day) => {
          const iso = toIsoDate(day);
          const dayItems = activities.filter((activity) => activity.date === iso);
          const groups = overlapGroups(dayItems, (activity) => Math.max(activity.span, MIN_CARD_MINUTES));
          return (
            <div
              key={iso}
              className={`relative border-l border-alivia-primary-mist ${iso === today ? 'bg-alivia-page/60' : ''}`}
              style={{
                height: hours.length * HOUR_PX,
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, var(--color-alivia-primary-mist) ${HOUR_PX - 1}px, var(--color-alivia-primary-mist) ${HOUR_PX}px)`,
              }}
            >
              {groups.flatMap((group) =>
                group.map((activity, column) => {
                  const state = activity.stateAt(now);
                  const type = ACTIVITY_TYPE[activity.type];
                  const top = Math.max(0, minuteToPx(activity.startMinute));
                  const height = (Math.max(activity.span, MIN_CARD_MINUTES) / 60) * HOUR_PX - 4;
                  const width = 100 / group.length;
                  const clash = clashes.has(activity.id);
                  return (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => onOpen(activity)}
                      aria-label={`${formatClock(activity.time)}, ${activity.title}, ${ACTIVITY_STATE[state].label}${clash ? ', se cruza con otra actividad' : ''}`}
                      className={[
                        'absolute overflow-hidden rounded-lg border px-1.5 py-1 text-left shadow-xs',
                        'transition-[translate,box-shadow] duration-150 ease-out hover:z-10 hover:shadow-md active:scale-[0.98]',
                        CARD_TONE[state],
                        clash ? 'ring-2 ring-alivia-warning/60' : '',
                      ].join(' ')}
                      style={{ top: top + 2, height, left: `calc(${column * width}% + 3px)`, width: `calc(${width}% - 6px)` }}
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span className="truncate text-[11px] font-bold text-alivia-primary-dark">
                          {formatClock(activity.time)} · {activity.title}
                        </span>
                        {clash ? (
                          <TriangleAlert className="size-3.5 shrink-0 text-alivia-warning" aria-hidden="true" />
                        ) : (
                          <type.icon className="size-3.5 shrink-0 text-alivia-primary" aria-hidden="true" />
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-alivia-text-muted">{caption(activity)}</span>
                      <span className="mt-0.5 block truncate text-[10px] font-semibold text-alivia-primary-dark">
                        {clash ? 'Superposición de horario' : ACTIVITY_STATE[state].label}
                      </span>
                    </button>
                  );
                }),
              )}
              {iso === today && showNow && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: minuteToPx(nowMinute) }}>
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

/** The week grid's outline while it loads: hour gutter, seven day columns and a few cards. */
export function WeekCalendarSkeleton({ label }: { readonly label: string }) {
  return (
    <Skeleton label={label} className="h-[34rem] overflow-hidden rounded-2xl border border-alivia-primary-mist bg-white">
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
  );
}

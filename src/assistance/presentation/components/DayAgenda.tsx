import { Moon, Sun, Sunset, User } from 'lucide-react';
import { Button, StatusDot } from '@/shared/presentation/components/ui/index.ts';
import { periodOf, type CareActivity, type DayPeriod } from '../../domain/model/care-activity.entity.ts';
import { ACTIVITY_STATE, ACTIVITY_TYPE, formatClock } from '../assistance-labels.ts';

const PERIODS: readonly { id: DayPeriod; label: string; range: string; icon: typeof Sun }[] = [
  { id: 'morning', label: 'Mañana', range: '06:00 – 12:00', icon: Sun },
  { id: 'afternoon', label: 'Tarde', range: '12:00 – 18:00', icon: Sunset },
  { id: 'night', label: 'Noche', range: '18:00 – 22:00', icon: Moon },
];

interface AgendaRowsProps {
  readonly activities: readonly CareActivity[];
  readonly now: Date;
  readonly canManage: boolean;
  readonly onOpen: (activity: CareActivity) => void;
  readonly onComplete: (activity: CareActivity) => void;
  readonly onReschedule: (activity: CareActivity) => void;
}

function stateText(activity: CareActivity, now: Date): string {
  const state = activity.stateAt(now);
  if (state === 'completed' && activity.completedAt) {
    const time = new Date(activity.completedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    return `Completada a las ${time}`;
  }
  return ACTIVITY_STATE[state].label;
}

/** One line per activity; the trailing action is the next sensible step for its state. */
export function AgendaRows({ activities, now, canManage, onOpen, onComplete, onReschedule }: AgendaRowsProps) {
  return (
    <ul className="divide-y divide-alivia-primary-mist">
      {activities.map((activity) => {
        const state = activity.stateAt(now);
        const type = ACTIVITY_TYPE[activity.type];
        const muted = state === 'cancelled';
        return (
          <li key={activity.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
            <span className={`w-[4.5rem] shrink-0 text-sm font-semibold tabular-nums text-alivia-primary-dark ${muted ? 'line-through opacity-60' : ''}`}>
              {formatClock(activity.time)}
            </span>
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-alivia-page text-alivia-primary">
              <type.icon className="size-4" />
            </span>
            <button
              type="button"
              onClick={() => onOpen(activity)}
              className="min-w-0 flex-1 basis-48 rounded-md text-left"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className={`font-semibold text-alivia-primary-dark ${muted ? 'line-through opacity-60' : ''}`}>{activity.title}</span>
                {activity.tag && (
                  <span className="rounded-md bg-alivia-primary-mist px-1.5 py-0.5 text-[11px] font-semibold text-alivia-primary-dark">
                    {activity.tag}
                  </span>
                )}
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-alivia-text-muted">
                <span className="inline-flex items-center gap-1">
                  <User className="size-3" aria-hidden="true" />
                  {activity.caregiverName}
                </span>
                {activity.notes && <span className="truncate">· {activity.notes}</span>}
              </span>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <StatusDot tone={ACTIVITY_STATE[state].tone}>{stateText(activity, now)}</StatusDot>
              {state === 'pending' || state === 'scheduled' ? (
                <Button variant="ghost" onClick={() => onComplete(activity)} className="text-alivia-primary-dark">
                  Completar
                </Button>
              ) : state === 'overdue' && canManage ? (
                <Button variant="ghost" onClick={() => onReschedule(activity)} className="text-alivia-primary-dark">
                  Reprogramar
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => onOpen(activity)} className="text-alivia-primary-dark">
                  Ver detalle
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DayAgenda(props: AgendaRowsProps) {
  const sorted = [...props.activities].sort((a, b) => a.startMinute - b.startMinute);
  return (
    <div className="flex flex-col gap-4">
      {PERIODS.map((period) => {
        const items = sorted.filter((activity) => periodOf(activity) === period.id);
        if (items.length === 0) return null;
        return (
          <section key={period.id} aria-labelledby={`period-${period.id}`} className="overflow-hidden rounded-2xl border border-alivia-primary-mist bg-white">
            <header className="flex items-center justify-between gap-3 bg-alivia-page px-4 py-2.5 sm:px-5">
              <h3 id={`period-${period.id}`} className="flex items-center gap-2 text-sm font-bold text-alivia-primary-dark">
                <period.icon className="size-4" aria-hidden="true" />
                {period.label}
                <span className="font-normal text-alivia-text-muted">{period.range}</span>
              </h3>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-alivia-text-muted">
                {items.length} {items.length === 1 ? 'actividad' : 'actividades'}
              </span>
            </header>
            <AgendaRows {...props} activities={items} />
          </section>
        );
      })}
    </div>
  );
}

import { useState, type ReactNode } from 'react';
import { CircleCheck, Clock } from 'lucide-react';
import { Button, Drawer } from '@/shared/presentation/components/ui/index.ts';
import type { CareActivity } from '../../domain/model/care-activity.entity.ts';
import { ACTIVITY_TYPE, formatRange, REPETITION_LABELS } from '../assistance-labels.ts';
import { GuestStatePill } from './GuestStatePill.tsx';

interface GuestActivityDrawerProps {
  readonly activity: CareActivity | null;
  readonly assistedPersonName: string;
  /** Granted by the principal; without it the guest only consults. */
  readonly canComplete: boolean;
  readonly now: Date;
  readonly onClose: () => void;
  readonly onComplete: (activity: CareActivity) => Promise<void>;
}

function Fact({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-alivia-text-muted">{label}</dt>
      <dd className="mt-1 font-semibold break-words text-alivia-primary-dark">{children}</dd>
    </div>
  );
}

function scheduleText(activity: CareActivity, now: Date): string {
  const start = activity.startsAt;
  const end = new Date(start.getTime() + activity.span * 60_000);
  const day =
    start.toDateString() === now.toDateString()
      ? 'Hoy'
      : start.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${formatRange(start, end)}`;
}

/** Read-only sheet: the guest sees what to do and when, the principal keeps the agenda. */
export function GuestActivityDrawer({
  activity,
  assistedPersonName,
  canComplete,
  now,
  onClose,
  onComplete,
}: GuestActivityDrawerProps) {
  const [completing, setCompleting] = useState(false);
  // Only the activity the guest just completed pops its new state; opening a sheet stays calm.
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const state = activity?.stateAt(now);
  const completable = canComplete && (state === 'pending' || state === 'overdue');

  const complete = async () => {
    if (!activity) return;
    setCompleting(true);
    try {
      await onComplete(activity);
      setJustCompleted(activity.id);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <Drawer
      open={activity !== null}
      onClose={onClose}
      title={activity?.title ?? ''}
      header={
        activity && (
          <div className="space-y-1">
            <p className="text-xs font-bold tracking-wider text-alivia-secondary-deep uppercase">Consulta de actividad</p>
            <h2 className="text-2xl font-bold text-balance text-alivia-primary-dark">{activity.title}</h2>
            <p className="text-sm text-alivia-text-muted">Asignación para {assistedPersonName}</p>
          </div>
        )
      }
      footer={
        activity && (
          <div className="flex w-full flex-col gap-2">
            {completable && (
              <Button onClick={complete} loading={completing} className="w-full">
                <CircleCheck className="size-4" aria-hidden="true" />
                Marcar como completada
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          </div>
        )
      }
    >
      {activity && state && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-alivia-primary-mist bg-alivia-page px-4 py-3">
            <span className="text-sm text-alivia-text-muted">Estado</span>
            <span key={state} className={`inline-flex ${justCompleted === activity.id && state === 'completed' ? 'animate-pill-in' : ''}`}>
              <GuestStatePill state={state} />
            </span>
          </div>

          <div>
            <p className="text-sm text-alivia-text-muted">Horario programado</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-alivia-primary-dark">
              <Clock className="size-5 shrink-0 text-alivia-secondary-deep" aria-hidden="true" />
              {scheduleText(activity, now)}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            <Fact label="Categoría">{ACTIVITY_TYPE[activity.type].label}</Fact>
            <Fact label="Frecuencia">{REPETITION_LABELS[activity.repetition]}</Fact>
            {activity.completedAt && (
              <Fact label="Atendida">
                {new Date(activity.completedAt).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' })}
                {activity.completedByName && ` · ${activity.completedByName}`}
              </Fact>
            )}
          </dl>

          <section aria-labelledby="guest-activity-notes">
            <h3 id="guest-activity-notes" className="text-sm text-alivia-text-muted">
              Indicaciones registradas
            </h3>
            <p className="mt-2 rounded-xl border border-alivia-primary-mist bg-alivia-page px-4 py-3 text-sm leading-relaxed text-alivia-text">
              {activity.notes || 'La cuidadora titular no dejó indicaciones para esta actividad.'}
            </p>
          </section>

          {!canComplete && (
            <p className="rounded-xl border border-alivia-primary-light/40 bg-alivia-primary-mist/60 px-4 py-3 text-sm leading-relaxed text-alivia-primary-dark">
              <strong>Modo solo lectura:</strong> esta actividad es gestionada por la cuidadora titular. Para solicitar
              reprogramaciones o consultas clínicas, coordina directamente con ella.
            </p>
          )}
        </div>
      )}
    </Drawer>
  );
}

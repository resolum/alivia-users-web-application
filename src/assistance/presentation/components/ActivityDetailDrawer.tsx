import { useState, type ReactNode } from 'react';
import { Bell, CalendarClock, CircleCheck, Clock, Pencil, Quote, Repeat, User, UserRound, X } from 'lucide-react';
import { Button, Drawer, StatusDot } from '@/shared/presentation/components/ui/index.ts';
import type { CareActivity } from '../../domain/model/care-activity.entity.ts';
import { ACTIVITY_STATE, ACTIVITY_TYPE, formatClock, REPETITION_LABELS } from '../assistance-labels.ts';

interface ActivityDetailDrawerProps {
  readonly activity: CareActivity | null;
  readonly assistedPersonName: string;
  readonly canManage: boolean;
  readonly now: Date;
  readonly onClose: () => void;
  readonly onComplete: (activity: CareActivity) => Promise<void>;
  readonly onEdit: (activity: CareActivity) => void;
  readonly onCancel: (activity: CareActivity) => void;
}

function Row({ icon, label, children }: { readonly icon: ReactNode; readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-alivia-primary-mist py-3 text-sm">
      <dt className="flex items-center gap-2 text-alivia-text-muted">
        {icon}
        {label}
      </dt>
      <dd className="font-semibold text-alivia-primary-dark">{children}</dd>
    </div>
  );
}

function scheduleText(activity: CareActivity, now: Date): string {
  const date = activity.startsAt;
  const day =
    date.toDateString() === now.toDateString()
      ? 'Hoy'
      : date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  const duration = activity.durationMinutes ? ` (${activity.durationMinutes} min)` : '';
  return `${day} · ${formatClock(activity.time)}${duration}`;
}

export function ActivityDetailDrawer({
  activity,
  assistedPersonName,
  canManage,
  now,
  onClose,
  onComplete,
  onEdit,
  onCancel,
}: ActivityDetailDrawerProps) {
  const [completing, setCompleting] = useState(false);
  const state = activity?.stateAt(now);
  const isOpen = state === 'pending' || state === 'scheduled' || state === 'overdue';
  const type = activity ? ACTIVITY_TYPE[activity.type] : null;

  const complete = async () => {
    if (!activity) return;
    setCompleting(true);
    try {
      await onComplete(activity);
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
        activity &&
        type &&
        state && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-alivia-mint px-2.5 py-0.5 text-xs font-semibold text-alivia-secondary-deep">
                <type.icon className="size-3.5" aria-hidden="true" />
                {type.label}
              </span>
              <StatusDot tone={ACTIVITY_STATE[state].tone}>{ACTIVITY_STATE[state].label}</StatusDot>
            </div>
            <h2 className="text-2xl font-bold text-balance text-alivia-primary-dark">{activity.title}</h2>
            <p className="text-sm text-alivia-text-muted">Plan de cuidado diario para {assistedPersonName}</p>
          </div>
        )
      }
      footer={
        activity &&
        isOpen &&
        canManage && (
          <div className="flex w-full flex-col gap-2">
            <Button onClick={complete} loading={completing} className="w-full">
              <CircleCheck className="size-4" aria-hidden="true" />
              Marcar como completada
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="soft" onClick={() => onEdit(activity)}>
                <CalendarClock className="size-4" aria-hidden="true" />
                Reprogramar
              </Button>
              <Button variant="soft" onClick={() => onEdit(activity)}>
                <Pencil className="size-4" aria-hidden="true" />
                Editar
              </Button>
            </div>
            <Button variant="ghost" onClick={() => onCancel(activity)} className="self-center text-alivia-text-muted">
              <X className="size-4" aria-hidden="true" />
              Cancelar actividad
            </Button>
          </div>
        )
      }
    >
      {activity && (
        <div className="flex flex-col gap-6">
          <dl>
            <Row icon={<UserRound className="size-4" aria-hidden="true" />} label="Persona asistida">
              {assistedPersonName}
            </Row>
            <Row icon={<Clock className="size-4" aria-hidden="true" />} label="Horario">
              {scheduleText(activity, now)}
            </Row>
            <Row icon={<Repeat className="size-4" aria-hidden="true" />} label="Frecuencia">
              {REPETITION_LABELS[activity.repetition]}
            </Row>
            <Row icon={<User className="size-4" aria-hidden="true" />} label="Cuidador asignado">
              {activity.caregiverName}
            </Row>
            <Row icon={<Bell className="size-4" aria-hidden="true" />} label="Recordatorio">
              {activity.reminderMinutes ? `${activity.reminderMinutes} min antes` : 'Sin recordatorio'}
            </Row>
            {activity.completedAt && (
              <Row icon={<CircleCheck className="size-4" aria-hidden="true" />} label="Atendida">
                {new Date(activity.completedAt).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                {activity.completedByName && ` · ${activity.completedByName}`}
              </Row>
            )}
          </dl>
          {activity.notes && (
            <section>
              <h3 className="flex items-center gap-2 text-xs font-bold tracking-wide text-alivia-text-muted uppercase">
                <Quote className="size-3.5" aria-hidden="true" />
                Indicaciones
              </h3>
              <p className="mt-2 rounded-xl bg-alivia-page px-4 py-3 text-sm text-alivia-text">{activity.notes}</p>
            </section>
          )}
        </div>
      )}
    </Drawer>
  );
}

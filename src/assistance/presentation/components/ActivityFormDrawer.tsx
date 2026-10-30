import { useState, type FormEvent } from 'react';
import { CalendarCheck } from 'lucide-react';
import { toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { Button, Drawer, Field, inputBase } from '@/shared/presentation/components/ui/index.ts';
import { scheduleActivity } from '../../application/assistance.store.ts';
import {
  ACTIVITY_TYPES,
  REPETITIONS,
  type ActivityType,
  type CareActivity,
  type Repetition,
} from '../../domain/model/care-activity.entity.ts';
import type { Caregiver } from '../../domain/model/caregiver.entity.ts';
import {
  NOTES_MAX,
  ScheduleActivityCommand,
  type ActivityFieldError,
  type ScheduleActivityValues,
} from '../../domain/model/schedule-activity.command.ts';
import { ACTIVITY_TYPE, DURATION_OPTIONS, REMINDER_OPTIONS, REPETITION_LABELS } from '../assistance-labels.ts';

const ERROR_TEXT: Record<ActivityFieldError, string> = {
  required: 'Este campo es obligatorio.',
  too_long: 'El texto es demasiado largo.',
  in_past: 'Elige una hora que aún no haya pasado.',
};

function emptyValues(date: Date): ScheduleActivityValues {
  const next = new Date();
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return {
    title: '',
    type: '',
    date: toIsoDate(date < next ? next : date),
    time: `${String(next.getHours()).padStart(2, '0')}:00`,
    durationMinutes: 30,
    repetition: 'none',
    caregiverId: '',
    reminderMinutes: 15,
    notes: '',
  };
}

function valuesOf(activity: CareActivity): ScheduleActivityValues {
  return {
    title: activity.title,
    type: activity.type,
    date: activity.date,
    time: activity.time,
    durationMinutes: activity.durationMinutes,
    repetition: activity.repetition,
    caregiverId: activity.caregiverId,
    reminderMinutes: activity.reminderMinutes,
    notes: activity.notes,
  };
}

const toNumber = (value: string) => (value === '' ? null : Number(value));

interface ActivityFormDrawerProps {
  /** null closes the drawer; 'new' schedules one; an activity edits it. */
  readonly target: CareActivity | 'new' | null;
  readonly defaultDate: Date;
  readonly assistedPersonName: string;
  readonly caregivers: readonly Caregiver[];
  readonly onClose: () => void;
  readonly onSaved: (activity: CareActivity, created: boolean) => void;
}

export function ActivityFormDrawer({
  target,
  defaultDate,
  assistedPersonName,
  caregivers,
  onClose,
  onSaved,
}: ActivityFormDrawerProps) {
  const [values, setValues] = useState<ScheduleActivityValues>(() => emptyValues(defaultDate));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  // Each opening starts from the target's values, reset during render instead of in an effect.
  const [openedFor, setOpenedFor] = useState(target);
  if (target !== openedFor) {
    setOpenedFor(target);
    if (target !== null) {
      setValues(target === 'new' ? emptyValues(defaultDate) : valuesOf(target));
      setSubmitted(false);
      setFailed(false);
    }
  }

  const editingId = target && target !== 'new' ? target.id : null;
  const command = new ScheduleActivityCommand(editingId, values);
  const errors = submitted ? command.validate() : {};
  const errorOf = (field: keyof typeof errors) => (errors[field] ? ERROR_TEXT[errors[field]] : null);
  const set = <K extends keyof ScheduleActivityValues>(key: K, value: ScheduleActivityValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(command.validate()).length > 0) return;
    setSaving(true);
    setFailed(false);
    try {
      const caregiver = caregivers.find((item) => item.id === values.caregiverId);
      onSaved(await scheduleActivity(command, caregiver?.fullName ?? ''), editingId === null);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const selectClass = `${inputBase} min-h-11`;

  return (
    <Drawer
      open={target !== null}
      onClose={onClose}
      title={editingId ? 'Editar actividad' : 'Nueva actividad'}
      description={editingId ? 'Cambia el horario o las indicaciones.' : 'Programa una tarea o recordatorio de cuidado.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="activity-form" loading={saving}>
            <CalendarCheck className="size-4" aria-hidden="true" />
            Guardar actividad
          </Button>
        </>
      }
    >
      <form id="activity-form" noValidate onSubmit={submit} className="flex flex-col gap-5">
        <Field id="activity-title" label="Nombre de la actividad" required error={errorOf('title')}>
          {(describedBy) => (
            <input
              id="activity-title"
              value={values.title}
              onChange={(event) => set('title', event.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={describedBy}
              placeholder="Ejemplo: Caminata asistida en el jardín"
              className={selectClass}
            />
          )}
        </Field>

        <Field id="activity-type" label="Tipo de actividad" required error={errorOf('type')}>
          {(describedBy) => (
            <select
              id="activity-type"
              value={values.type}
              onChange={(event) => set('type', event.target.value as ActivityType)}
              aria-invalid={Boolean(errors.type)}
              aria-describedby={describedBy}
              className={selectClass}
            >
              <option value="" disabled>
                Elige un tipo
              </option>
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ACTIVITY_TYPE[type].label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-alivia-primary-dark">Persona asistida</span>
          <p className="rounded-lg bg-alivia-page px-3 py-2.5 text-sm font-semibold text-alivia-primary-dark">{assistedPersonName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field id="activity-date" label="Fecha" required error={errorOf('date')}>
            {(describedBy) => (
              <input
                id="activity-date"
                type="date"
                value={values.date}
                onChange={(event) => set('date', event.target.value)}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={describedBy}
                className={selectClass}
              />
            )}
          </Field>
          <Field id="activity-time" label="Hora" required error={errorOf('time')}>
            {(describedBy) => (
              <input
                id="activity-time"
                type="time"
                step={300}
                value={values.time}
                onChange={(event) => set('time', event.target.value)}
                aria-invalid={Boolean(errors.time)}
                aria-describedby={describedBy}
                className={selectClass}
              />
            )}
          </Field>
          <Field id="activity-duration" label="Duración">
            {(describedBy) => (
              <select
                id="activity-duration"
                value={values.durationMinutes ?? ''}
                onChange={(event) => set('durationMinutes', toNumber(event.target.value))}
                aria-describedby={describedBy}
                className={selectClass}
              >
                <option value="">Sin duración</option>
                {DURATION_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} min
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="activity-repetition" label="Repetición">
            {(describedBy) => (
              <select
                id="activity-repetition"
                value={values.repetition}
                onChange={(event) => set('repetition', event.target.value as Repetition)}
                aria-describedby={describedBy}
                className={selectClass}
              >
                {REPETITIONS.map((item) => (
                  <option key={item} value={item}>
                    {REPETITION_LABELS[item]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <Field id="activity-caregiver" label="Cuidador responsable" required error={errorOf('caregiverId')}>
          {(describedBy) => (
            <select
              id="activity-caregiver"
              value={values.caregiverId}
              onChange={(event) => set('caregiverId', event.target.value)}
              aria-invalid={Boolean(errors.caregiverId)}
              aria-describedby={describedBy}
              className={selectClass}
            >
              <option value="" disabled>
                Elige quién la realiza
              </option>
              {caregivers.map((caregiver) => (
                <option key={caregiver.id} value={caregiver.id}>
                  {caregiver.fullName}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field id="activity-reminder" label="Recordatorio">
          {(describedBy) => (
            <select
              id="activity-reminder"
              value={values.reminderMinutes ?? ''}
              onChange={(event) => set('reminderMinutes', toNumber(event.target.value))}
              aria-describedby={describedBy}
              className={selectClass}
            >
              <option value="">Sin recordatorio</option>
              {REMINDER_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min antes
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          id="activity-notes"
          label="Indicaciones"
          error={errorOf('notes')}
          aside={
            <span className={`text-xs tabular-nums ${values.notes.length > NOTES_MAX ? 'text-alivia-danger' : 'text-alivia-hint'}`}>
              {values.notes.length}/{NOTES_MAX}
            </span>
          }
        >
          {(describedBy) => (
            <textarea
              id="activity-notes"
              rows={3}
              value={values.notes}
              onChange={(event) => set('notes', event.target.value)}
              aria-describedby={describedBy}
              placeholder="Ejemplo: asegurarse de llevar bastón y calzado ajustado."
              className={`${inputBase} resize-y`}
            />
          )}
        </Field>

        {failed && (
          <p role="alert" className="rounded-lg bg-alivia-danger/10 px-3 py-2 text-sm text-alivia-danger">
            No pudimos guardar la actividad. Inténtalo de nuevo.
          </p>
        )}
      </form>
    </Drawer>
  );
}

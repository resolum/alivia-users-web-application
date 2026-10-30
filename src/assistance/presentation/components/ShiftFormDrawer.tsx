import { useState, type FormEvent } from 'react';
import { TriangleAlert } from 'lucide-react';
import { toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { Button, Drawer, Field, inputBase } from '@/shared/presentation/components/ui/index.ts';
import { linkedCaregivers, saveShift } from '../../application/care-coordination.store.ts';
import { AssignShiftCommand, type ShiftFieldError } from '../../domain/model/assign-shift.command.ts';
import { shiftConflicts, type CareShift } from '../../domain/model/care-shift.entity.ts';
import type { CareNetwork } from '../../domain/model/caregiver.entity.ts';
import { formatRange } from '../assistance-labels.ts';

const ERROR_TEXT: Record<ShiftFieldError, string> = {
  required: 'Este campo es obligatorio.',
  end_before_start: 'El turno debe terminar en otra hora que la de inicio.',
};

const pad = (value: number) => String(value).padStart(2, '0');
const clock = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

interface ShiftFormDrawerProps {
  /** 'new' opens an empty form for `defaultDate`; a shift opens it for editing. */
  readonly target: CareShift | 'new' | null;
  readonly defaultDate: Date;
  readonly network: CareNetwork;
  readonly shifts: readonly CareShift[];
  readonly onClose: () => void;
  readonly onSaved: (shift: CareShift, created: boolean) => void;
}

export function ShiftFormDrawer({ target, defaultDate, network, shifts, onClose, onSaved }: ShiftFormDrawerProps) {
  const editing = target !== null && target !== 'new' ? target : null;
  const [caregiverId, setCaregiverId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  // The coincidence is shown first; a second press confirms it knowingly.
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const [shownTarget, setShownTarget] = useState(target);
  if (target !== shownTarget) {
    setShownTarget(target);
    setCaregiverId(editing?.caregiverId ?? '');
    setDate(editing ? toIsoDate(editing.start) : toIsoDate(defaultDate));
    setStartTime(editing ? clock(editing.start) : '08:00');
    setEndTime(editing ? clock(editing.end) : '16:00');
    setNotes(editing?.notes ?? '');
    setSubmitted(false);
    setAcknowledged(false);
    setFailed(false);
  }

  const command = new AssignShiftCommand(editing?.id ?? null, { caregiverId, date, startTime, endTime, notes });
  const errors = submitted ? command.validate() : {};
  const errorOf = (field: keyof typeof errors) => (errors[field] ? ERROR_TEXT[errors[field]] : null);
  const complete = Object.keys(command.validate()).length === 0;
  const conflicts = complete
    ? shiftConflicts({ id: command.shiftId, caregiverId, start: command.start, end: command.end }, shifts)
    : [];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!complete) return;
    if (conflicts.length > 0 && !acknowledged) {
      setAcknowledged(true);
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      onSaved(await saveShift(command, network, conflicts.length > 0), editing === null);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={target !== null}
      onClose={onClose}
      title={editing ? 'Editar turno' : 'Asignar turno'}
      description="Quien tenga el turno queda como responsable principal en ese periodo."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="shift-form" loading={saving} variant={acknowledged && conflicts.length > 0 ? 'danger' : 'primary'}>
            {acknowledged && conflicts.length > 0 ? 'Asignar a pesar de la coincidencia' : editing ? 'Guardar turno' : 'Asignar turno'}
          </Button>
        </>
      }
    >
      <form id="shift-form" noValidate onSubmit={submit} className="flex flex-col gap-5">
        <Field id="shift-caregiver" label="Cuidador responsable" required error={errorOf('caregiverId')}>
          {(describedBy) => (
            <select
              id="shift-caregiver"
              value={caregiverId}
              onChange={(event) => {
                setCaregiverId(event.target.value);
                setAcknowledged(false);
              }}
              aria-describedby={describedBy}
              aria-invalid={Boolean(errors.caregiverId)}
              className={`${inputBase} min-h-11`}
            >
              <option value="">Elige a un cuidador vinculado</option>
              {linkedCaregivers(network).map((caregiver) => (
                <option key={caregiver.id} value={caregiver.id}>
                  {caregiver.fullName}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field id="shift-date" label="Día de inicio" required error={errorOf('date')}>
          {(describedBy) => (
            <input
              id="shift-date"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setAcknowledged(false);
              }}
              aria-describedby={describedBy}
              className={`${inputBase} min-h-11`}
            />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id="shift-start" label="Desde" required error={errorOf('startTime')}>
            {(describedBy) => (
              <input
                id="shift-start"
                type="time"
                value={startTime}
                onChange={(event) => {
                  setStartTime(event.target.value);
                  setAcknowledged(false);
                }}
                aria-describedby={describedBy}
                className={`${inputBase} min-h-11`}
              />
            )}
          </Field>
          <Field id="shift-end" label="Hasta" required error={errorOf('endTime')} hint="Si es antes del inicio, termina al día siguiente.">
            {(describedBy) => (
              <input
                id="shift-end"
                type="time"
                value={endTime}
                onChange={(event) => {
                  setEndTime(event.target.value);
                  setAcknowledged(false);
                }}
                aria-describedby={describedBy}
                className={`${inputBase} min-h-11`}
              />
            )}
          </Field>
        </div>

        <Field id="shift-notes" label="Indicaciones para el turno">
          {(describedBy) => (
            <textarea
              id="shift-notes"
              rows={3}
              maxLength={200}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              aria-describedby={describedBy}
              className={`${inputBase} resize-y`}
            />
          )}
        </Field>

        {conflicts.length > 0 && (
          <div
            role={acknowledged ? 'alert' : 'status'}
            className="rounded-xl border border-alivia-warning/40 bg-alivia-warning-soft px-4 py-3 text-sm"
          >
            <p className="flex items-center gap-2 font-semibold text-alivia-text">
              <TriangleAlert className="size-4 shrink-0 text-alivia-warning" aria-hidden="true" />
              Este turno coincide con otra responsabilidad
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-alivia-text-muted">
              {conflicts.map(({ kind, shift }) => (
                <li key={shift.id}>
                  {kind === 'same_caregiver'
                    ? `Ya tiene un turno ${shift.start.toLocaleDateString('es-PE', { weekday: 'long' })} de ${formatRange(shift.start, shift.end)}.`
                    : `${shift.caregiverName} ya está a cargo de ${formatRange(shift.start, shift.end)}.`}
                </li>
              ))}
            </ul>
            {acknowledged && <p className="mt-2 font-semibold text-alivia-text">Presiona otra vez para confirmar la asignación igualmente.</p>}
          </div>
        )}

        {failed && (
          <p role="alert" className="rounded-lg bg-alivia-danger/10 px-3 py-2 text-sm text-alivia-danger">
            No pudimos guardar el turno. Revisa tu conexión e inténtalo de nuevo.
          </p>
        )}
      </form>
    </Drawer>
  );
}

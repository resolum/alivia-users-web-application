import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { Button, Drawer, Field, inputBase } from '@/shared/presentation/components/ui/index.ts';
import { linkedCaregivers, scheduleMedication } from '../../application/care-coordination.store.ts';
import type { Caregiver, CareNetwork } from '../../domain/model/caregiver.entity.ts';
import { FREQUENCIES, type Frequency, type MedicationSchedule } from '../../domain/model/medication-schedule.entity.ts';
import { ScheduleMedicationCommand } from '../../domain/model/medication.commands.ts';
import { FREQUENCY_LABELS, MEDICATION_ERROR_TEXT } from '../assistance-labels.ts';

/** Editable list of HH:mm doses. */
export function TimesField({
  times,
  onChange,
  error,
}: {
  readonly times: readonly string[];
  readonly onChange: (times: string[]) => void;
  readonly error: string | null;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-alivia-primary-dark">
        Horarios<span aria-hidden="true" className="ml-0.5 text-alivia-danger">*</span>
      </legend>
      <ul className="flex flex-col gap-2">
        {times.map((time, index) => (
          <li key={index} className="flex gap-2">
            <input
              type="time"
              aria-label={`Horario ${index + 1}`}
              value={time}
              onChange={(event) => onChange(times.map((item, i) => (i === index ? event.target.value : item)))}
              className={`${inputBase} min-h-11`}
            />
            {times.length > 1 && (
              <button
                type="button"
                aria-label={`Quitar horario ${index + 1}`}
                onClick={() => onChange(times.filter((_, i) => i !== index))}
                className="grid size-11 shrink-0 place-items-center rounded-lg text-alivia-text-muted hover:bg-alivia-primary-mist"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <Button variant="ghost" className="self-start" onClick={() => onChange([...times, ''])}>
        <Plus className="size-4" aria-hidden="true" />
        Agregar horario
      </Button>
      {error && <p className="text-xs font-semibold text-alivia-danger">{error}</p>}
    </fieldset>
  );
}

interface MedicationFormDrawerProps {
  readonly open: boolean;
  readonly network: CareNetwork;
  readonly actor: Caregiver;
  readonly assistedPersonId: string;
  readonly onClose: () => void;
  readonly onSaved: (schedule: MedicationSchedule) => void;
}

/** Registers when and by whom an indicated medication is given; the indication itself is only referenced. */
export function MedicationFormDrawer({ open, network, actor, assistedPersonId, onClose, onSaved }: MedicationFormDrawerProps) {
  const [medication, setMedication] = useState('');
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [frequency, setFrequency] = useState<Frequency | ''>('daily');
  const [startDate, setStartDate] = useState(() => toIsoDate(new Date()));
  const [endDate, setEndDate] = useState('');
  const [caregiverId, setCaregiverId] = useState('');
  const [indicationRef, setIndicationRef] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  // Only caregivers allowed to record doses can be made responsible for them.
  const authorized = linkedCaregivers(network).filter((caregiver) => caregiver.can('record_medications'));
  const command = new ScheduleMedicationCommand({ medication, dose, times, frequency, startDate, endDate, caregiverId, assistedPersonId, indicationRef });
  const errors = submitted ? command.validate() : {};
  const errorOf = (field: keyof typeof errors) => (errors[field] ? MEDICATION_ERROR_TEXT[errors[field]] : null);
  const missing = Object.keys(errors).length;

  const close = () => {
    setMedication('');
    setDose('');
    setTimes(['08:00']);
    setFrequency('daily');
    setEndDate('');
    setCaregiverId('');
    setIndicationRef('');
    setSubmitted(false);
    setFailed(false);
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(command.validate()).length > 0) return;
    setSaving(true);
    setFailed(false);
    try {
      onSaved(await scheduleMedication(command, network, actor));
      close();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const text = (id: string, label: string, value: string, set: (value: string) => void, field: keyof typeof errors, hint?: string, placeholder?: string) => (
    <Field id={id} label={label} required error={errorOf(field)} hint={hint}>
      {(describedBy) => (
        <input
          id={id}
          value={value}
          onChange={(event) => set(event.target.value)}
          aria-describedby={describedBy}
          aria-invalid={Boolean(errors[field])}
          placeholder={placeholder}
          className={`${inputBase} min-h-11`}
        />
      )}
    </Field>
  );

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Programar medicamento"
      description={`Para ${network.assistedPersonName}. Registra la indicación que ya existe; aquí no se cambia.`}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" form="medication-form" loading={saving}>
            Guardar programación
          </Button>
        </>
      }
    >
      <form id="medication-form" noValidate onSubmit={submit} className="flex flex-col gap-5">
        {missing > 0 && (
          <p role="alert" className="rounded-lg bg-alivia-danger/10 px-3 py-2 text-sm text-alivia-danger">
            Faltan {missing} {missing === 1 ? 'dato' : 'datos'} para registrar la programación.
            {/* The only required value without its own field: it comes from the household. */}
            {errors.assistedPersonId && ' No se identificó a la persona asistida; recarga la página e inténtalo de nuevo.'}
          </p>
        )}
        {text('med-name', 'Medicamento', medication, setMedication, 'medication', undefined, 'Losartán')}
        {text('med-dose', 'Dosis', dose, setDose, 'dose', undefined, '50 mg, 1 tableta')}
        <TimesField times={times} onChange={setTimes} error={errorOf('times')} />
        <Field id="med-frequency" label="Frecuencia" required error={errorOf('frequency')}>
          {(describedBy) => (
            <select id="med-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)} aria-describedby={describedBy} className={`${inputBase} min-h-11`}>
              {FREQUENCIES.map((item) => (
                <option key={item} value={item}>
                  {FREQUENCY_LABELS[item]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="med-start" label="Desde" required error={errorOf('startDate')}>
            {(describedBy) => <input id="med-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} aria-describedby={describedBy} className={`${inputBase} min-h-11`} />}
          </Field>
          <Field id="med-end" label="Hasta" error={errorOf('endDate')} hint="Vacío si no tiene fin.">
            {(describedBy) => <input id="med-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} aria-describedby={describedBy} className={`${inputBase} min-h-11`} />}
          </Field>
        </div>
        <Field id="med-caregiver" label="Responsable" required error={errorOf('caregiverId')} hint="Solo cuidadores autorizados a registrar medicamentos.">
          {(describedBy) => (
            <select id="med-caregiver" value={caregiverId} onChange={(event) => setCaregiverId(event.target.value)} aria-describedby={describedBy} aria-invalid={Boolean(errors.caregiverId)} className={`${inputBase} min-h-11`}>
              <option value="">Elige al responsable</option>
              {authorized.map((caregiver) => (
                <option key={caregiver.id} value={caregiver.id}>
                  {caregiver.fullName}
                </option>
              ))}
            </select>
          )}
        </Field>
        {text('med-indication', 'Indicación que lo sustenta', indicationRef, setIndicationRef, 'indicationRef', 'Receta o indicación médica previa.', 'Receta Dr. Paredes, 12/10/2026')}
        {failed && (
          <p role="alert" className="rounded-lg bg-alivia-danger/10 px-3 py-2 text-sm text-alivia-danger">
            No pudimos guardar la programación. Verifica que tengas permiso e inténtalo de nuevo.
          </p>
        )}
      </form>
    </Drawer>
  );
}

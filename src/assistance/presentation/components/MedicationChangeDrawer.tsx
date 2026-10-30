import { useState, type FormEvent } from 'react';
import { toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { Button, Drawer, Field, inputBase } from '@/shared/presentation/components/ui/index.ts';
import { assignMedicationResponsible, linkedCaregivers, suspendMedication, updateMedication } from '../../application/care-coordination.store.ts';
import type { Caregiver, CareNetwork } from '../../domain/model/caregiver.entity.ts';
import { FREQUENCIES, type Frequency, type MedicationSchedule } from '../../domain/model/medication-schedule.entity.ts';
import { SuspendMedicationCommand, UpdateMedicationCommand } from '../../domain/model/medication.commands.ts';
import { FREQUENCY_LABELS, MEDICATION_ERROR_TEXT } from '../assistance-labels.ts';
import { TimesField } from './MedicationFormDrawer.tsx';

export type MedicationChange = { readonly schedule: MedicationSchedule; readonly mode: 'update' | 'suspend' | 'responsible' };

interface MedicationChangeDrawerProps {
  readonly change: MedicationChange | null;
  readonly actor: Caregiver;
  readonly network: CareNetwork;
  readonly onClose: () => void;
  readonly onSaved: (schedule: MedicationSchedule, message: string) => void;
}

/**
 * A new indication changes dose, frequency or times from a date on; a suspension stops new doses. Both keep the history.
 * Changing the responsible only moves the coming doses to another authorized caregiver.
 */
export function MedicationChangeDrawer({ change, actor, network, onClose, onSaved }: MedicationChangeDrawerProps) {
  const today = toIsoDate(new Date());
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<Frequency | ''>('daily');
  const [from, setFrom] = useState(today);
  const [reference, setReference] = useState('');
  const [caregiverId, setCaregiverId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const [shown, setShown] = useState(change);
  if (change !== shown) {
    setShown(change);
    if (change) {
      setDose(change.schedule.latest.dose);
      setTimes([...change.schedule.latest.times]);
      setFrequency(change.schedule.latest.frequency);
      setCaregiverId(change.schedule.caregiverId);
    }
    setFrom(today);
    setReference('');
    setSubmitted(false);
    setFailed(false);
  }

  const schedule = change?.schedule;
  const update = schedule ? new UpdateMedicationCommand(schedule.id, { dose, times, frequency, effectiveFrom: from, indicationRef: reference }) : null;
  const suspend = schedule ? new SuspendMedicationCommand(schedule.id, from, reference) : null;
  const validate = () =>
    !change || !update || !suspend
      ? {}
      : change.mode === 'update'
        ? update.validate(today)
        : change.mode === 'suspend'
          ? suspend.validate(today)
          : caregiverId === ''
            ? { caregiverId: 'required' as const }
            : {};
  const errors = submitted ? validate() : {};
  const errorOf = (field: keyof typeof errors) => (errors[field] ? MEDICATION_ERROR_TEXT[errors[field]] : null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!change || !update || !suspend) return;
    setSubmitted(true);
    if (Object.keys(validate()).length > 0) return;
    setSaving(true);
    setFailed(false);
    try {
      if (change.mode === 'update') onSaved(await updateMedication(update, actor), 'Programación actualizada; el historial anterior se conserva');
      else if (change.mode === 'suspend') onSaved(await suspendMedication(suspend, actor), 'Programación suspendida; no se generarán nuevas administraciones');
      else {
        const saved = await assignMedicationResponsible(change.schedule.id, caregiverId, network, actor);
        onSaved(saved, `${saved.caregiverName} es ahora responsable de las administraciones de ${saved.medication}`);
      }
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const suspending = change?.mode === 'suspend';
  const reassigning = change?.mode === 'responsible';
  const authorized = linkedCaregivers(network).filter((caregiver) => caregiver.can('record_medications'));

  return (
    <Drawer
      open={change !== null}
      onClose={onClose}
      title={`${suspending ? 'Suspender' : reassigning ? 'Responsable de' : 'Actualizar'} ${schedule?.medication ?? ''}`}
      description={
        suspending
          ? 'Solo con la suspensión de una fuente autorizada.'
          : reassigning
            ? 'Las próximas administraciones quedan a su cargo; las ya registradas no cambian.'
            : 'Solo con una nueva indicación válida. Los días anteriores no cambian.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="medication-change" loading={saving} variant={suspending ? 'danger' : 'primary'}>
            {suspending ? 'Suspender programación' : reassigning ? 'Asignar responsable' : 'Aplicar nueva indicación'}
          </Button>
        </>
      }
    >
      <form id="medication-change" noValidate onSubmit={submit} className="flex flex-col gap-5">
        {reassigning && (
          <Field id="change-caregiver" label="Responsable" required error={errorOf('caregiverId')} hint="Solo cuidadores autorizados a registrar medicamentos.">
            {(describedBy) => (
              <select id="change-caregiver" value={caregiverId} onChange={(event) => setCaregiverId(event.target.value)} aria-describedby={describedBy} className={`${inputBase} min-h-11`}>
                <option value="">Elige al responsable</option>
                {authorized.map((caregiver) => (
                  <option key={caregiver.id} value={caregiver.id}>
                    {caregiver.fullName}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}
        {!suspending && !reassigning && (
          <>
            <Field id="change-dose" label="Dosis" required error={errorOf('dose')}>
              {(describedBy) => <input id="change-dose" value={dose} onChange={(event) => setDose(event.target.value)} aria-describedby={describedBy} className={`${inputBase} min-h-11`} />}
            </Field>
            <TimesField times={times} onChange={setTimes} error={errorOf('times')} />
            <Field id="change-frequency" label="Frecuencia" required error={errorOf('frequency')}>
              {(describedBy) => (
                <select id="change-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)} aria-describedby={describedBy} className={`${inputBase} min-h-11`}>
                  {FREQUENCIES.map((item) => (
                    <option key={item} value={item}>
                      {FREQUENCY_LABELS[item]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </>
        )}
        {!reassigning && (
          <>
            <Field id="change-from" label={suspending ? 'Suspender desde' : 'Aplicar desde'} required error={errorOf('effectiveFrom')}>
              {(describedBy) => <input id="change-from" type="date" min={today} value={from} onChange={(event) => setFrom(event.target.value)} aria-describedby={describedBy} className={`${inputBase} min-h-11`} />}
            </Field>
            <Field
              id="change-reference"
              label={suspending ? 'Fuente autorizada de la suspensión' : 'Nueva indicación que sustenta el cambio'}
              required
              error={errorOf(suspending ? 'source' : 'indicationRef')}
            >
              {(describedBy) => (
                <input
                  id="change-reference"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  aria-describedby={describedBy}
                  placeholder={suspending ? 'Dr. Paredes, teleconsulta del 30/10' : 'Receta Dra. Salas, control del 30/10'}
                  className={`${inputBase} min-h-11`}
                />
              )}
            </Field>
          </>
        )}
        {failed && (
          <p role="alert" className="rounded-lg bg-alivia-danger/10 px-3 py-2 text-sm text-alivia-danger">
            No se aplicó el cambio: necesitas permiso para programar medicamentos y el responsable debe poder registrarlos. La programación vigente sigue igual.
          </p>
        )}
      </form>
    </Drawer>
  );
}

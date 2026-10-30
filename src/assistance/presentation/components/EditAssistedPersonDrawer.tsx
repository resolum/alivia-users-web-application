import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { Button, Drawer, Field, inputBase } from '@/shared/presentation/components/ui/index.ts';
import { updateAssistedPerson } from '../../application/assistance.store.ts';
import type { AssistedPerson } from '../../domain/model/assisted-person.entity.ts';
import {
  UpdateAssistedPersonCommand,
  type AssistedPersonFieldError,
  type AssistedPersonValues,
} from '../../domain/model/update-assisted-person.command.ts';

const ERROR_TEXT: Record<AssistedPersonFieldError, string> = {
  required: 'Este campo es obligatorio.',
  too_short: 'Ingresa al menos 2 caracteres.',
  invalid_date: 'Ingresa una fecha válida que no sea futura.',
  invalid_phone: 'Ingresa un celular de 9 dígitos, por ejemplo 912 345 678, o déjalo vacío.',
};

const valuesOf = (person: AssistedPerson): AssistedPersonValues => ({
  firstName: person.firstName,
  lastName: person.lastName,
  birthDate: person.birthDate,
  kinship: person.kinship,
  localPhone: person.phone?.replace(/^\+51\s*/, '') ?? '',
});

interface EditAssistedPersonDrawerProps {
  readonly open: boolean;
  readonly person: AssistedPerson;
  readonly onClose: () => void;
  readonly onSaved: (person: AssistedPerson) => void;
}

export function EditAssistedPersonDrawer({ open, person, onClose, onSaved }: EditAssistedPersonDrawerProps) {
  const [values, setValues] = useState(() => valuesOf(person));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setValues(valuesOf(person));
      setSubmitted(false);
      setFailed(false);
    }
  }

  const command = new UpdateAssistedPersonCommand(values);
  const errors = submitted ? command.validate() : {};
  const errorOf = (field: keyof typeof errors) => (errors[field] ? ERROR_TEXT[errors[field]] : null);
  const set = (key: keyof AssistedPersonValues, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(command.validate()).length > 0) return;
    setSaving(true);
    setFailed(false);
    try {
      onSaved(await updateAssistedPerson(person, command));
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const text = (id: keyof AssistedPersonValues, label: string, extra: { hint?: string; autoComplete?: string } = {}) => (
    <Field id={`ap-${id}`} label={label} required={id !== 'localPhone'} hint={extra.hint} error={errorOf(id === 'localPhone' ? 'phone' : id)}>
      {(describedBy) => (
        <input
          id={`ap-${id}`}
          value={values[id]}
          onChange={(event) => set(id, event.target.value)}
          autoComplete={extra.autoComplete ?? 'off'}
          aria-invalid={Boolean(errorOf(id === 'localPhone' ? 'phone' : id))}
          aria-describedby={describedBy}
          className={`${inputBase} min-h-11`}
        />
      )}
    </Field>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Editar información"
      description={`Actualiza los datos de ${person.firstName}.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="assisted-person-form" loading={saving}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="assisted-person-form" noValidate onSubmit={submit} className="flex flex-col gap-5">
        {text('firstName', 'Nombres')}
        {text('lastName', 'Apellidos')}

        <div className="rounded-2xl border border-alivia-primary-mist bg-alivia-page/70 p-4 text-sm">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-alivia-text-muted uppercase">
            <Lock className="size-3.5" aria-hidden="true" />
            Documento de identidad
          </p>
          <p className="mt-1 font-semibold text-alivia-primary-dark">
            {person.documentType} {person.documentNumber}
          </p>
          <p className="mt-1 text-xs text-alivia-hint">
            {person.documentValidated
              ? 'Validado en el registro. Para corregirlo comunícate con soporte.'
              : 'Se valida en la evaluación técnica; no se edita desde aquí.'}
          </p>
        </div>

        <Field id="ap-birthDate" label="Fecha de nacimiento" required error={errorOf('birthDate')}>
          {(describedBy) => (
            <input
              id="ap-birthDate"
              type="date"
              min="1900-01-01"
              max={toIsoDate(new Date())}
              value={values.birthDate}
              onChange={(event) => set('birthDate', event.target.value)}
              aria-invalid={Boolean(errors.birthDate)}
              aria-describedby={describedBy}
              className={`${inputBase} min-h-11`}
            />
          )}
        </Field>

        {text('kinship', 'Parentesco con el cuidador principal', { hint: 'Por ejemplo: Padre, Madre, Abuelo.' })}

        <Field
          id="ap-localPhone"
          label="Teléfono de contacto"
          hint="Línea móvil de la persona asistida. Déjalo vacío si no tiene una."
          error={errorOf('phone')}
        >
          {(describedBy) => (
            <div className="flex">
              <span className="flex items-center rounded-l-lg border-r border-alivia-primary-mist bg-alivia-primary-mist px-3 text-sm font-semibold text-alivia-primary-dark">
                +51
              </span>
              <input
                id="ap-localPhone"
                type="tel"
                inputMode="numeric"
                value={values.localPhone}
                onChange={(event) => set('localPhone', event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={describedBy}
                className={`${inputBase} min-h-11 rounded-l-none`}
              />
            </div>
          )}
        </Field>

        {failed && (
          <p role="alert" className="rounded-lg bg-alivia-danger/10 px-3 py-2 text-sm text-alivia-danger">
            No pudimos guardar los cambios. Inténtalo de nuevo.
          </p>
        )}
      </form>
    </Drawer>
  );
}

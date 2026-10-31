import { useState, type FormEvent } from 'react';
import { CircleCheck, Lock } from 'lucide-react';
import { Button, Drawer, Field, inputBase } from '@/shared/presentation/components/ui/index.ts';
import { updateHousehold } from '../../application/household.store.ts';
import type { Household } from '../../domain/model/household.entity.ts';
import {
  ALIAS_MAX,
  toLocalPhone,
  UpdateHouseholdCommand,
  type HouseholdFieldError,
} from '../../domain/model/update-household.command.ts';

const ERROR_TEXT: Record<HouseholdFieldError, string> = {
  required: 'Este campo es obligatorio.',
  too_long: `Usa como máximo ${ALIAS_MAX} caracteres.`,
  invalid_phone: 'Ingresa un celular de 9 dígitos, por ejemplo 984 123 456.',
  invalid_email: 'Ingresa un correo válido, por ejemplo familia@correo.pe.',
};

interface EditHouseholdDrawerProps {
  readonly open: boolean;
  readonly household: Household;
  readonly onClose: () => void;
  readonly onSaved: (household: Household) => void;
}

export function EditHouseholdDrawer({ open, household, onClose, onSaved }: EditHouseholdDrawerProps) {
  const [alias, setAlias] = useState(household.alias);
  const [phone, setPhone] = useState(toLocalPhone(household.phone));
  const [email, setEmail] = useState(household.email);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setAlias(household.alias);
      setPhone(toLocalPhone(household.phone));
      setEmail(household.email);
      setSubmitted(false);
      setFailed(false);
    }
  }

  const command = new UpdateHouseholdCommand(alias, phone, email);
  const errors = submitted ? command.validate() : {};
  const errorOf = (field: keyof typeof errors) => (errors[field] ? ERROR_TEXT[errors[field]] : null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(command.validate()).length > 0) return;
    setSaving(true);
    setFailed(false);
    try {
      onSaved(await updateHousehold(household, command));
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Editar información del hogar"
      description="Actualiza los datos de contacto de tu hogar."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="household-form" loading={saving}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="household-form" noValidate onSubmit={submit} className="flex flex-col gap-6">
        <Field
          id="household-alias"
          label="Alias del hogar"
          required
          hint="Este nombre permitirá identificar tu hogar dentro de Alivia."
          error={errorOf('alias')}
          aside={
            <span className={`text-xs tabular-nums ${alias.trim().length > ALIAS_MAX ? 'text-alivia-danger' : 'text-alivia-hint'}`}>
              {alias.trim().length} / {ALIAS_MAX}
            </span>
          }
        >
          {(describedBy) => (
            <input
              id="household-alias"
              value={alias}
              onChange={(event) => setAlias(event.target.value)}
              aria-invalid={Boolean(errors.alias)}
              aria-describedby={describedBy}
              className={`${inputBase} min-h-11`}
            />
          )}
        </Field>

        <Field
          id="household-phone"
          label="Teléfono asociado"
          required
          hint="Lo usamos para coordinar evaluaciones, instalaciones e incidencias."
          error={errorOf('phone')}
        >
          {(describedBy) => (
            <div className="flex">
              <span className="flex items-center rounded-l-lg border-r border-alivia-primary-mist bg-alivia-primary-mist px-3 text-sm font-semibold text-alivia-primary-dark">
                +51
              </span>
              <input
                id="household-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={describedBy}
                className={`${inputBase} min-h-11 rounded-l-none`}
              />
            </div>
          )}
        </Field>

        <Field
          id="household-email"
          label="Correo asociado"
          required
          hint="Recibirá las comunicaciones relacionadas con el servicio."
          error={errorOf('email')}
        >
          {(describedBy) => (
            <input
              id="household-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy}
              className={`${inputBase} min-h-11`}
            />
          )}
        </Field>

        <section className="rounded-2xl border border-alivia-primary-mist bg-alivia-page/70 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-alivia-text-muted uppercase">
              <Lock className="size-3.5" aria-hidden="true" />
              Ubicación actual
            </h3>
            {household.address.validated && (
              <span className="flex items-center gap-1 text-xs font-semibold text-alivia-secondary-deep">
                <CircleCheck className="size-3.5" aria-hidden="true" />
                Validada
              </span>
            )}
          </div>
          <p className="mt-2 font-semibold text-alivia-primary-dark">
            {household.address.line}, {household.address.district}
          </p>
          <p className="mt-2 border-t border-alivia-primary-mist pt-2 text-sm text-alivia-text-muted">
            La dirección se cambia en un flujo aparte porque define la cobertura técnica. Para moverla, comunícate con
            soporte desde Incidencias.
          </p>
        </section>

        {failed && (
          <p role="alert" className="rounded-lg bg-alivia-danger/10 px-3 py-2 text-sm text-alivia-danger">
            No pudimos guardar los cambios. Inténtalo de nuevo.
          </p>
        )}
      </form>
    </Drawer>
  );
}

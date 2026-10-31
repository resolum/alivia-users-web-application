import { useState, type FormEvent } from 'react';
import { Mail, Send } from 'lucide-react';
import { Button, Drawer, Field, inputBase } from '@/shared/presentation/components/ui/index.ts';
import { inviteCaregiver } from '../../application/assistance.store.ts';
import {
  RELATIONSHIPS,
  type Caregiver,
  type CareNetwork,
  type Relationship,
  type Responsibility,
} from '../../domain/model/caregiver.entity.ts';
import { InviteCaregiverCommand, type InviteFieldError } from '../../domain/model/invite-caregiver.command.ts';
import { LINK_STATUS, RELATIONSHIP_LABELS, RESPONSIBILITY_LABELS } from '../assistance-labels.ts';
import { ResponsibilityPicker } from './ResponsibilityPicker.tsx';

const ERROR_TEXT: Record<InviteFieldError, string> = {
  required: 'Este campo es obligatorio.',
  invalid_email: 'Ingresa un correo válido, por ejemplo nombre@correo.pe.',
  already_in_network: 'Esta persona ya forma parte de la red o tiene una invitación.',
  none_selected: 'Elige al menos una responsabilidad.',
};

const DEFAULT_RESPONSIBILITIES: Responsibility[] = ['view_activities', 'manage_activities', 'receive_notifications'];

interface InviteCaregiverDrawerProps {
  readonly open: boolean;
  readonly network: CareNetwork;
  readonly onClose: () => void;
  readonly onInvited: (caregiver: Caregiver) => void;
}

export function InviteCaregiverDrawer({ open, network, onClose, onInvited }: InviteCaregiverDrawerProps) {
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<Relationship | ''>('family');
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>(DEFAULT_RESPONSIBILITIES);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const command = new InviteCaregiverCommand(email, relationship, responsibilities);
  const taken = [network.principal, ...network.additional].map((caregiver) => caregiver.email);
  const errors = submitted ? command.validate(taken) : {};
  const errorOf = (field: keyof typeof errors) => (errors[field] ? ERROR_TEXT[errors[field]] : null);
  // Inviting someone already linked is blocked; show what they can already do instead.
  const existing =
    errors.email === 'already_in_network'
      ? [network.principal, ...network.additional].find((caregiver) => caregiver.email.toLowerCase() === command.email)
      : undefined;

  const reset = () => {
    setEmail('');
    setRelationship('family');
    setResponsibilities(DEFAULT_RESPONSIBILITIES);
    setSubmitted(false);
    setFailed(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(command.validate(taken)).length > 0) return;
    setSending(true);
    setFailed(false);
    try {
      const caregiver = await inviteCaregiver(network, command);
      reset();
      onInvited(caregiver);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Invitar cuidador"
      description="Enviaremos una invitación para unirse a la red de cuidado."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" form="invite-caregiver" loading={sending}>
            Enviar invitación
            <Send className="size-4" aria-hidden="true" />
          </Button>
        </>
      }
    >
      <form id="invite-caregiver" noValidate onSubmit={submit} className="flex flex-col gap-6">
        <Field id="invite-email" label="Correo electrónico" required error={errorOf('email')}>
          {(describedBy) => (
            <div className="relative">
              <Mail
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-alivia-hint"
                aria-hidden="true"
              />
              <input
                id="invite-email"
                type="email"
                autoComplete="off"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={describedBy}
                placeholder="nombre@correo.pe"
                className={`${inputBase} min-h-11 pl-9`}
              />
            </div>
          )}
        </Field>

        {existing && (
          <div role="status" className="rounded-xl border border-alivia-primary-mist bg-alivia-page px-4 py-3 text-sm">
            <p className="font-semibold text-alivia-primary-dark">
              {existing.fullName} · {LINK_STATUS[existing.statusAt()].label}
            </p>
            <p className="mt-1 text-alivia-text-muted">Responsabilidades actuales:</p>
            <ul className="mt-1 list-inside list-disc text-alivia-text">
              {existing.responsibilities.map((item) => (
                <li key={item}>{RESPONSIBILITY_LABELS[item]}</li>
              ))}
            </ul>
          </div>
        )}

        <Field id="invite-relationship" label="Relación con la persona asistida" required error={errorOf('relationship')}>
          {(describedBy) => (
            <select
              id="invite-relationship"
              value={relationship}
              onChange={(event) => setRelationship(event.target.value as Relationship)}
              aria-describedby={describedBy}
              className={`${inputBase} min-h-11`}
            >
              {RELATIONSHIPS.map((item) => (
                <option key={item} value={item}>
                  {RELATIONSHIP_LABELS[item]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <ResponsibilityPicker
          legend="Responsabilidades asignadas"
          value={responsibilities}
          onChange={setResponsibilities}
          error={errorOf('responsibilities')}
        />

        {failed && (
          <p role="alert" className="rounded-lg bg-alivia-danger/10 px-3 py-2 text-sm text-alivia-danger">
            No pudimos enviar la invitación. Revisa tu conexión e inténtalo de nuevo.
          </p>
        )}
      </form>
    </Drawer>
  );
}

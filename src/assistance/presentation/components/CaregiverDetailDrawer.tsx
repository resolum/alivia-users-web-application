import { useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { Avatar, Button, Drawer, StatusDot } from '@/shared/presentation/components/ui/index.ts';
import { updateResponsibilities } from '../../application/assistance.store.ts';
import type { Caregiver, Responsibility } from '../../domain/model/caregiver.entity.ts';
import { formatSince, LINK_STATUS, RESPONSIBILITY_LABELS } from '../assistance-labels.ts';
import { ResponsibilityPicker } from './ResponsibilityPicker.tsx';

interface CaregiverDetailDrawerProps {
  readonly caregiver: Caregiver | null;
  readonly onClose: () => void;
  readonly onSaved: (caregiver: Caregiver) => void;
}

function Row({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-alivia-primary-mist py-3 text-sm last:border-0">
      <dt className="text-alivia-text-muted">{label}</dt>
      <dd className="font-semibold break-all text-alivia-primary-dark">{children}</dd>
    </div>
  );
}

/** Contact data and responsibilities of one caregiver; the principal ones are fixed. */
export function CaregiverDetailDrawer({ caregiver, onClose, onSaved }: CaregiverDetailDrawerProps) {
  const [editing, setEditing] = useState<Responsibility[] | null>(null);
  const [saving, setSaving] = useState(false);

  const [shownId, setShownId] = useState(caregiver?.id);
  if (caregiver?.id !== shownId) {
    setShownId(caregiver?.id);
    setEditing(null);
  }

  const save = async () => {
    if (!caregiver || !editing || editing.length === 0) return;
    setSaving(true);
    try {
      onSaved(await updateResponsibilities(caregiver.id, editing));
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const status = caregiver ? LINK_STATUS[caregiver.status] : null;

  return (
    <Drawer
      open={caregiver !== null}
      onClose={onClose}
      title="Detalle del cuidador"
      footer={
        caregiver &&
        (editing ? (
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Descartar
            </Button>
            <Button onClick={save} loading={saving} disabled={editing.length === 0}>
              Guardar responsabilidades
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {!caregiver.isPrincipal && (
              <Button onClick={() => setEditing([...caregiver.responsibilities])}>Editar responsabilidades</Button>
            )}
          </>
        ))
      }
    >
      {caregiver && status && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar name={caregiver.fullName} src={caregiver.photoUrl ?? undefined} size="lg" />
            <div className="min-w-0 space-y-1">
              <p className="text-lg font-bold break-words text-alivia-primary-dark">{caregiver.fullName}</p>
              <p className="text-sm text-alivia-text-muted">{caregiver.relationshipDetail}</p>
              {caregiver.isPrincipal && (
                <span className="inline-block rounded-md bg-alivia-primary-mist px-2 py-0.5 text-xs font-semibold text-alivia-primary-dark">
                  Cuidador principal
                </span>
              )}
            </div>
          </div>

          <section aria-labelledby="contact-heading">
            <h3 id="contact-heading" className="text-xs font-bold tracking-wide text-alivia-text-muted uppercase">
              Datos de contacto
            </h3>
            <dl className="mt-1">
              <Row label="Correo electrónico">{caregiver.email}</Row>
              <Row label="Teléfono móvil">{caregiver.phone ?? 'Sin registrar'}</Row>
              <Row label="Estado de vinculación">
                <StatusDot tone={status.tone}>{status.label}</StatusDot>
              </Row>
              <Row label={caregiver.linkedSince ? 'Fecha de registro' : 'Invitación enviada'}>
                {caregiver.linkedSince
                  ? `Vinculado desde el ${formatSince(caregiver.linkedSince)}`
                  : formatSince(caregiver.invitedAt)}
              </Row>
            </dl>
          </section>

          <section aria-labelledby="duties-heading">
            {editing ? (
              <ResponsibilityPicker
                legend="Responsabilidades asignadas"
                value={editing}
                onChange={setEditing}
                error={editing.length === 0 ? 'Elige al menos una responsabilidad.' : null}
              />
            ) : (
              <>
                <h3 id="duties-heading" className="text-xs font-bold tracking-wide text-alivia-text-muted uppercase">
                  Responsabilidades asignadas
                </h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {caregiver.responsibilities.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 rounded-lg bg-alivia-page px-3 py-2.5 text-sm text-alivia-text"
                    >
                      <CircleCheck className="size-4 shrink-0 text-alivia-secondary-deep" aria-hidden="true" />
                      {RESPONSIBILITY_LABELS[item]}
                    </li>
                  ))}
                </ul>
                {caregiver.isPrincipal && (
                  <p className="mt-3 text-xs text-alivia-hint">
                    Como titular del servicio, el cuidador principal mantiene todos los permisos.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}

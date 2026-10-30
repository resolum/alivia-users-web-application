import { useState } from 'react';
import { Eye, Plus, RotateCw } from 'lucide-react';
import {
  ActionMenu,
  Avatar,
  Bone,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  SampleDataNotice,
  Skeleton,
  StatusDot,
  Toast,
  useToast,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import {
  isAssistanceSample,
  loadCareNetwork,
  removeCaregiver,
  resendInvitation,
} from '../../application/assistance.store.ts';
import type { Caregiver, CareNetwork } from '../../domain/model/caregiver.entity.ts';
import { LINK_STATUS } from '../assistance-labels.ts';
import { CaregiverDetailDrawer } from '../components/CaregiverDetailDrawer.tsx';
import { InviteCaregiverDrawer } from '../components/InviteCaregiverDrawer.tsx';

function replaceIn(network: CareNetwork, caregiver: Caregiver): CareNetwork {
  if (caregiver.isPrincipal) return { ...network, principal: caregiver };
  const exists = network.additional.some((item) => item.id === caregiver.id);
  return {
    ...network,
    additional: exists
      ? network.additional.map((item) => (item.id === caregiver.id ? caregiver : item))
      : [...network.additional, caregiver],
  };
}

export function CareNetworkView() {
  useDocumentTitle('Red de cuidado');
  const { state, retry, setData } = useLoad(loadCareNetwork, []);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detail, setDetail] = useState<Caregiver | null>(null);
  const [removing, setRemoving] = useState<Caregiver | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, notify] = useToast();

  const network = state.status === 'ready' ? state.data : null;

  const apply = (caregiver: Caregiver, message: string) => {
    if (!network) return;
    setData(replaceIn(network, caregiver));
    notify(message);
  };

  const resend = async (caregiver: Caregiver) => {
    setBusyId(caregiver.id);
    try {
      apply(await resendInvitation(caregiver.id), `Invitación reenviada a ${caregiver.email}`);
    } catch {
      notify('No pudimos reenviar la invitación. Inténtalo de nuevo.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = async () => {
    if (!network || !removing) return;
    setBusyId(removing.id);
    try {
      await removeCaregiver(removing.id);
      setData({ ...network, additional: network.additional.filter((item) => item.id !== removing.id) });
      notify(removing.status === 'active' ? 'Cuidador retirado de la red' : 'Invitación cancelada');
    } catch {
      notify('No pudimos completar la acción. Inténtalo de nuevo.');
    } finally {
      setBusyId(null);
      setRemoving(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        crumb="Red de cuidado"
        title="Red de cuidado"
        subtitle="Personas autorizadas para apoyar en el cuidado dentro de este hogar."
        actions={
          network && (
            <Button onClick={() => setInviteOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Invitar cuidador
            </Button>
          )
        }
      />
      {isAssistanceSample() && <SampleDataNotice />}

      {state.status === 'loading' && <Skeleton label="Cargando la red de cuidado…" className="rounded-3xl border border-alivia-primary-mist bg-white p-5 sm:p-8">
          <Bone className="h-3 w-36" />
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-alivia-page/60 p-5">
            <Bone className="size-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bone className="h-5 w-1/2 max-w-64" />
              <Bone className="h-3 w-1/3 max-w-48" />
            </div>
          </div>
          <Bone className="mt-10 h-3 w-44" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-4 border-b border-alivia-primary-mist py-5 last:border-0">
              <Bone className="size-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Bone className={row % 2 ? 'h-4 w-1/3' : 'h-4 w-2/5'} />
                <Bone className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </Skeleton>}
      {state.status === 'error' && (
        <ErrorState title="No pudimos cargar la red de cuidado" message="Revisa tu conexión e inténtalo de nuevo." onRetry={retry} />
      )}

      {network && (
        <section className="rounded-3xl border border-alivia-primary-mist bg-white p-5 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-bold tracking-wide text-alivia-text-muted uppercase">Cuidador principal</h2>
            <span className="text-xs font-semibold text-alivia-text-muted">Titular del servicio</span>
          </div>

          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-alivia-primary-mist bg-alivia-page/60 p-4 sm:flex-row sm:items-center sm:p-5">
            <Avatar name={network.principal.fullName} src={network.principal.photoUrl ?? undefined} size="lg" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-bold break-words text-alivia-primary-dark">{network.principal.fullName}</p>
                <span className="rounded-md bg-alivia-primary-mist px-2 py-0.5 text-xs font-semibold text-alivia-primary-dark">
                  Cuidador principal
                </span>
              </div>
              <p className="text-sm text-alivia-text-muted">{network.principal.relationshipDetail}</p>
              <p className="flex flex-wrap gap-x-3 text-xs break-all text-alivia-hint">
                <span>{network.principal.email}</span>
                {network.principal.phone && <span>{network.principal.phone}</span>}
              </p>
            </div>
            <Button variant="outline" onClick={() => setDetail(network.principal)} className="self-start sm:self-center">
              <Eye className="size-4" aria-hidden="true" />
              Ver responsabilidades
            </Button>
          </div>

          <hr className="my-8 border-alivia-primary-mist" />

          <h2 className="flex items-center gap-2 text-xs font-bold tracking-wide text-alivia-text-muted uppercase">
            Cuidadores adicionales
            <span className="grid min-w-6 place-items-center rounded-full bg-alivia-primary-mist px-1.5 text-xs text-alivia-primary-dark">
              {network.additional.length}
            </span>
          </h2>

          {network.additional.length === 0 ? (
            <EmptyState
              title="Aún no invitas a nadie"
              description="Invita a familiares o cuidadores para repartir las actividades del día."
              action={<Button onClick={() => setInviteOpen(true)}>Invitar cuidador</Button>}
            />
          ) : (
            <ul className="mt-3 divide-y divide-alivia-primary-mist">
              {network.additional.map((caregiver) => {
                const status = LINK_STATUS[caregiver.status];
                const isActive = caregiver.status === 'active';
                return (
                  <li key={caregiver.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
                    <Avatar name={caregiver.fullName} src={caregiver.photoUrl ?? undefined} size="lg" />
                    <div className="min-w-0 flex-1 basis-56 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold break-words text-alivia-primary-dark">{caregiver.fullName}</p>
                        <StatusDot tone={status.tone}>{status.label}</StatusDot>
                      </div>
                      <p className="flex flex-wrap gap-x-2 text-sm text-alivia-text-muted">
                        <span>{caregiver.relationshipDetail}</span>
                        <span aria-hidden="true">·</span>
                        <span className="break-all">{caregiver.email}</span>
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      {caregiver.canResendInvitation ? (
                        <Button variant="outline" loading={busyId === caregiver.id} onClick={() => resend(caregiver)}>
                          <RotateCw className="size-4" aria-hidden="true" />
                          Reenviar
                        </Button>
                      ) : (
                        <Button variant="ghost" onClick={() => setDetail(caregiver)} className="text-alivia-primary-dark">
                          Ver responsabilidades
                        </Button>
                      )}
                      <ActionMenu
                        label={`Más acciones para ${caregiver.fullName}`}
                        items={[
                          { label: 'Ver detalle', onSelect: () => setDetail(caregiver) },
                          {
                            label: isActive ? 'Retirar de la red' : 'Cancelar invitación',
                            danger: true,
                            onSelect: () => setRemoving(caregiver),
                          },
                        ]}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <InviteCaregiverDrawer
            open={inviteOpen}
            network={network}
            onClose={() => setInviteOpen(false)}
            onInvited={(caregiver) => {
              setInviteOpen(false);
              apply(caregiver, `Invitación enviada a ${caregiver.email}`);
            }}
          />
        </section>
      )}

      <CaregiverDetailDrawer
        caregiver={detail}
        onClose={() => setDetail(null)}
        onSaved={(caregiver) => {
          setDetail(caregiver);
          apply(caregiver, 'Responsabilidades actualizadas');
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        title={removing?.status === 'active' ? '¿Retirar a este cuidador?' : '¿Cancelar la invitación?'}
        confirmLabel={removing?.status === 'active' ? 'Retirar' : 'Cancelar invitación'}
        danger
        busy={busyId !== null && busyId === removing?.id}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      >
        {removing?.status === 'active'
          ? `${removing.fullName} dejará de ver las actividades y avisos del hogar.`
          : `El enlace enviado a ${removing?.email ?? ''} dejará de funcionar.`}
      </ConfirmDialog>

      <Toast message={notice} />
    </div>
  );
}

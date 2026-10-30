import { useState } from 'react';
import { ArrowRightLeft, CircleCheck, CircleDashed, ShieldAlert } from 'lucide-react';
import { formatTime } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { Button, StatusDot, inputBase } from '@/shared/presentation/components/ui/index.ts';
import { answerHandover, linkedCaregivers, proposeSubstitute, requestHandover } from '../../application/care-coordination.store.ts';
import type { CareShift } from '../../domain/model/care-shift.entity.ts';
import type { Caregiver, CareNetwork } from '../../domain/model/caregiver.entity.ts';
import { ESCALATION_MINUTES, HANDOVER_LEAD_MINUTES, reliefFor, type Handover } from '../../domain/model/handover.entity.ts';
import { HANDOVER_STATUS } from '../assistance-labels.ts';

interface HandoverPanelProps {
  /** The shift whose relief is being handled: the one running, or the one held over. */
  readonly shift: CareShift;
  readonly shifts: readonly CareShift[];
  readonly handover: Handover | undefined;
  readonly network: CareNetwork;
  readonly actor: Caregiver;
  readonly now: Date;
  readonly onDone: (message: string) => void;
}

function Summary({ title, items, icon: Icon, empty }: { readonly title: string; readonly items: readonly string[]; readonly icon: typeof CircleCheck; readonly empty: string }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-alivia-primary-dark">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-alivia-hint">{empty}</p>
      ) : (
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-alivia-text">
              <Icon className="mt-0.5 size-4 shrink-0 text-alivia-text-muted" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Relief between the shift in charge and the next one, with the summary the incoming caregiver receives. */
export function HandoverPanel({ shift, shifts, handover, network, actor, now, onDone }: HandoverPanelProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [substituteId, setSubstituteId] = useState('');
  const [failed, setFailed] = useState(false);
  const next = reliefFor(shifts, shift);

  const run = async (key: string, action: () => Promise<unknown>, message: string) => {
    setBusy(key);
    setFailed(false);
    try {
      await action();
      onDone(message);
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  if (!next) {
    return (
      <p className="text-sm text-alivia-text-muted">
        No hay un turno siguiente con otro cuidador. Asigna uno para poder organizar el relevo.
      </p>
    );
  }

  if (!handover) {
    const isOutgoing = actor.id === shift.caregiverId || actor.isPrincipal;
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-alivia-text-muted">
          A las {formatTime(shift.endsAt)} le toca a <strong className="text-alivia-text">{next.caregiverName}</strong>. La responsabilidad solo cambia cuando acepte el relevo; si nadie lo solicita, se abre solo {HANDOVER_LEAD_MINUTES} min antes.
        </p>
        {isOutgoing && (
          <Button
            className="self-start"
            loading={busy === 'request'}
            onClick={() => run('request', () => requestHandover(shift, next), `Relevo solicitado a ${next.caregiverName}`)}
          >
            <ArrowRightLeft className="size-4" aria-hidden="true" />
            Solicitar relevo
          </Button>
        )}
        {failed && <p role="alert" className="text-sm text-alivia-danger">No pudimos solicitar el relevo. Inténtalo de nuevo.</p>}
      </div>
    );
  }

  const status =
    handover.substitute && handover.status === 'pending' ? { label: 'Esperando al sustituto', tone: 'info' as const } : HANDOVER_STATUS[handover.status];
  const isIncoming = actor.id === handover.toCaregiverId;
  const canReassign = handover.isOpen && (actor.isPrincipal || actor.id === handover.fromCaregiverId);
  const candidates = linkedCaregivers(network).filter(
    (caregiver) => caregiver.id !== handover.fromCaregiverId && caregiver.id !== handover.toCaregiverId,
  );
  const ended = shift.end <= now;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-alivia-text">
          {handover.fromCaregiverName} → <strong>{handover.toCaregiverName}</strong>
        </p>
        <StatusDot tone={status.tone}>{status.label}</StatusDot>
      </div>

      {handover.escalatedAt && handover.isOpen && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-alivia-danger/10 px-3 py-2 text-sm text-alivia-danger">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Escalado al cuidador principal a las {formatTime(handover.escalatedAt)}: riesgo de falta de cobertura registrado.
        </p>
      )}
      {handover.isOpen && ended && !handover.escalatedAt && (
        <p className="text-sm text-alivia-warning">
          El turno terminó. {handover.fromCaregiverName} sigue a cargo; si nadie confirma en {ESCALATION_MINUTES} min se avisará al cuidador principal.
        </p>
      )}

      <div className="grid gap-4 rounded-xl bg-alivia-page px-4 py-3 sm:grid-cols-2">
        <Summary title="Atendido en el turno" items={handover.attended} icon={CircleCheck} empty="Nada registrado como atendido." />
        <Summary title="Pendiente para quien recibe" items={handover.pending} icon={CircleDashed} empty="No quedan asuntos pendientes." />
      </div>

      {handover.isOpen && isIncoming && handover.status === 'pending' && (
        <div className="flex flex-wrap gap-2">
          <Button loading={busy === 'accept'} onClick={() => run('accept', () => answerHandover(handover.id, true, actor, shift), handover.substitute ? 'Turno asumido: sus actividades y medicamentos pendientes pasan a ti' : 'Relevo aceptado: ahora eres el responsable activo')}>
            {handover.substitute ? 'Asumir el turno' : 'Aceptar relevo'}
          </Button>
          <Button variant="outline" loading={busy === 'decline'} onClick={() => run('decline', () => answerHandover(handover.id, false, actor, shift), 'Avisamos que no puedes asumir el turno')}>
            No puedo asumirlo
          </Button>
        </div>
      )}

      {canReassign && candidates.length > 0 && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const substitute = candidates.find((caregiver) => caregiver.id === substituteId);
            if (substitute) {
              void run('substitute', () => proposeSubstitute(handover.id, substitute, actor), `Pedimos a ${substitute.fullName} que asuma el turno; cambia de manos cuando acepte`);
            }
          }}
        >
          <label className="flex min-w-48 flex-1 flex-col gap-1.5 text-sm font-semibold text-alivia-primary-dark">
            Proponer un sustituto
            <select value={substituteId} onChange={(event) => setSubstituteId(event.target.value)} className={`${inputBase} min-h-11 font-normal`}>
              <option value="">Elige a un cuidador</option>
              {candidates.map((caregiver) => (
                <option key={caregiver.id} value={caregiver.id}>
                  {caregiver.fullName}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="soft" disabled={substituteId === '' || busy !== null} loading={busy === 'substitute'}>
            Enviar propuesta
          </Button>
        </form>
      )}

      {failed && <p role="alert" className="text-sm text-alivia-danger">No pudimos registrar el relevo. Inténtalo de nuevo.</p>}
    </div>
  );
}

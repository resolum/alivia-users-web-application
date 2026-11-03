import { useState } from 'react';
import { currentChosenSlot, holdSlot } from '../../application/evaluation.store.ts';
import type { EvaluationSlot } from '../../domain/model/evaluation-slot.ts';
import { AppointmentRequestError } from '../../infrastructure/appointments-api.ts';
import { ScheduleStep } from './ScheduleStep.tsx';
import { useAvailableSlots } from './useAvailableSlots.ts';

/**
 * "Instalación" substep of the configuration: the family picks the day, the window and the technician
 * before paying. Continuing holds them for 30 minutes, so no other family can take them meanwhile.
 */
export function InstallationDateStep({ draftId, back, onContinue }: {
  readonly draftId: string;
  readonly back: { readonly label: string; readonly action: () => void };
  readonly onContinue: () => void;
}) {
  const { slots, error, retry } = useAvailableSlots(draftId);
  const [holding, setHolding] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);

  const hold = (slot: EvaluationSlot) => {
    setHolding(true);
    setHoldError(null);
    holdSlot(draftId, slot)
      .then(onContinue)
      .catch((reason: unknown) => {
        if (reason instanceof AppointmentRequestError && reason.conflict === 'SLOT_TAKEN') {
          setHoldError('Otra familia acaba de separar ese horario. Elige otro técnico o franja.');
          retry();
        } else {
          setHoldError(reason instanceof Error ? reason.message : 'No pudimos separar el horario.');
        }
      })
      .finally(() => setHolding(false));
  };

  return (
    <ScheduleStep
      slots={slots}
      error={error}
      initial={currentChosenSlot()}
      eyebrow="CONFIGURACIÓN — FECHA DE INSTALACIÓN"
      paymentNote="Elegir la fecha no tiene costo. Al continuar te separamos el horario y el técnico por 30 minutos mientras completas el pago."
      addressStatus="Pendiente de confirmación"
      continueLabel="Separar y revisar configuración"
      submitting={holding}
      submitError={holdError}
      onRetry={retry}
      onContinue={hold}
      onBack={back}
    />
  );
}

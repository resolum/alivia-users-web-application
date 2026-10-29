import { chooseSlot, currentChosenSlot } from '../../application/evaluation.store.ts';
import { ScheduleStep } from './ScheduleStep.tsx';
import { useAvailableSlots } from './useAvailableSlots.ts';

/**
 * "Instalación" substep of the configuration: the family picks the visit window before paying.
 * Nothing is booked yet; the window is reserved when the evaluation is confirmed after the payment.
 */
export function InstallationDateStep({ back, onContinue }: {
  readonly back: { readonly label: string; readonly action: () => void };
  readonly onContinue: () => void;
}) {
  const { slots, error, retry } = useAvailableSlots();
  return (
    <ScheduleStep
      slots={slots}
      error={error}
      initial={currentChosenSlot()}
      eyebrow="CONFIGURACIÓN — FECHA DE INSTALACIÓN"
      paymentNote="Elegir la fecha no tiene costo. La reservamos cuando confirmes la visita, después del pago."
      addressStatus="Pendiente de confirmación"
      continueLabel="Revisar configuración"
      onRetry={retry}
      onContinue={(slot) => { chooseSlot(slot); onContinue(); }}
      onBack={back}
    />
  );
}

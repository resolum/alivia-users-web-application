import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { ContractBrand, readPlanSelection } from '@/subscriptions/index.ts';
import { chooseSlot, confirmEvaluation } from '../../application/evaluation.store.ts';
import type { Appointment, EvaluationContact } from '../../domain/model/appointment.ts';
import type { EvaluationSlot } from '../../domain/model/evaluation-slot.ts';
import { AppointmentRequestError } from '../../infrastructure/appointments-api.ts';
import { readBookedAppointment, readChosenSlot } from '../../infrastructure/evaluation.storage.ts';
import { BookedState } from '../components/BookedState.tsx';
import { ConfirmStep } from '../components/ConfirmStep.tsx';
import { EvaluationProgress, type EvaluationSubstep } from '../components/EvaluationProgress.tsx';
import { ScheduleStep } from '../components/ScheduleStep.tsx';
import { useAvailableSlots } from '../components/useAvailableSlots.ts';

const SUBSTEPS: readonly EvaluationSubstep[] = ['schedule', 'confirm'];

/** Last step of the guided contracting: book the technical evaluation with an available technician. */
export function EvaluationView() {
  const navigate = useNavigate();
  const params = useParams<{ substep: string }>();
  const substep = SUBSTEPS.includes(params.substep as EvaluationSubstep) ? params.substep as EvaluationSubstep : null;
  const selection = readPlanSelection();
  const [chosen, setChosen] = useState<EvaluationSlot | null>(() => readChosenSlot());
  const [booked, setBooked] = useState<Appointment | null>(() => selection === null ? null : readBookedAppointment(selection.draftId));
  const [submitting, setSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const { slots, error: loadError, retry } = useAvailableSlots(substep === 'schedule' && booked === null);

  if (selection === null) return <Navigate to="/plans" replace />;
  // The window is normally picked in the "Instalación" substep, so the evaluation opens on its confirmation.
  if (substep === null || (substep === 'confirm' && chosen === null && booked === null)) {
    return <Navigate to={chosen === null ? '/contract/evaluation/schedule' : '/contract/evaluation/confirm'} replace />;
  }

  const goToConfirm = (slot: EvaluationSlot) => {
    chooseSlot(slot);
    setChosen(slot);
    setConfirmError(null);
    void navigate('/contract/evaluation/confirm');
  };

  const confirm = (contact: EvaluationContact) => {
    if (chosen === null) return;
    setSubmitting(true);
    setConfirmError(null);
    void confirmEvaluation(selection.draftId, chosen, contact)
      .then(setBooked)
      .catch((reason: unknown) => {
        if (reason instanceof AppointmentRequestError && reason.conflict === 'SLOT_TAKEN') {
          setConfirmError(`${reason.message} Te mostramos los horarios actualizados.`);
          setTimeout(() => void navigate('/contract/evaluation/schedule'), 2500);
        } else {
          setConfirmError(reason instanceof Error ? reason.message : 'No pudimos agendar la evaluación.');
        }
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="min-h-screen bg-[#f7f7fc] text-alivia-text">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <ContractBrand />
          <Link to="/sign-in" className="text-sm font-bold text-alivia-secondary-deep hover:underline">¿Ya tienes una cuenta? Iniciar sesión</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-7 lg:px-8 lg:py-9">
        <EvaluationProgress current={booked !== null ? 'confirm' : substep} />
        {booked !== null ? (
          <BookedState appointment={booked} />
        ) : substep === 'schedule' || chosen === null ? (
          <ScheduleStep
            slots={slots}
            error={loadError}
            initial={chosen}
            eyebrow="EVALUACIÓN — CAMBIAR HORARIO"
            paymentNote="No cobramos hoy: solo mantenemos la preautorización de tu tarjeta."
            continueLabel="Continuar"
            onRetry={retry}
            onContinue={goToConfirm}
          />
        ) : (
          <ConfirmStep
            slot={chosen}
            submitting={submitting}
            error={confirmError}
            onChangeSlot={() => void navigate('/contract/evaluation/schedule')}
            onConfirm={confirm}
          />
        )}
      </main>
    </div>
  );
}

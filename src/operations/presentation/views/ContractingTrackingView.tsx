import { useCallback, useEffect, useState } from 'react';
import { Hash, Headphones, LifeBuoy, Lock, RefreshCw } from 'lucide-react';
import { Link, Navigate } from 'react-router';
import { ContractFooter, readPlanSelection } from '@/subscriptions/index.ts';
import type { ContractingTracking } from '../../domain/model/contracting-tracking.ts';
import { contractingTrackingApi } from '../../infrastructure/contracting-tracking-api.ts';
import { ConfirmationTrackingCard } from '../components/ConfirmationTrackingCard.tsx';
import { EvaluationTrackingCard } from '../components/EvaluationTrackingCard.tsx';
import { TrackingStatusCard } from '../components/TrackingStatusCard.tsx';
import { ContractingStepper } from '@/shared/presentation/components/contracting-stepper/ContractingStepper.tsx';
import { TrackingStepper } from '../components/TrackingStepper.tsx';

/** While the technician has not decided, the tracking refreshes itself so the family sees the change. */
const REFRESH_MS = 30_000;

/** "Seguimiento de contratación": what follows the payment, from the evaluation to the activation. */
export function ContractingTrackingView() {
  const selection = readPlanSelection();
  const draftId = selection?.draftId ?? null;
  const [tracking, setTracking] = useState<ContractingTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (draftId === null) return Promise.resolve();
    return contractingTrackingApi.get(draftId)
      .then((value) => { setTracking(value); setError(null); })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No pudimos consultar el seguimiento.'));
  }, [draftId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (tracking?.stage !== 'EVALUATION') return undefined;
    const timer = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [tracking?.stage, load]);

  if (draftId === null) return <Navigate to="/plans" replace />;

  const refresh = () => {
    setRefreshing(true);
    void load().finally(() => setRefreshing(false));
  };

  const confirm = () => {
    setConfirming(true);
    setConfirmError(null);
    contractingTrackingApi.confirm(draftId)
      .then(setTracking)
      .catch((reason: unknown) => setConfirmError(reason instanceof Error ? reason.message : 'No pudimos confirmar tu configuración.'))
      .finally(() => setConfirming(false));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7fc] text-alivia-text">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <Link to="/plans" className="inline-flex items-center gap-3" aria-label="Alivia, Contratación y Asistencia">
            <span className="grid size-9 place-items-center rounded-xl bg-alivia-primary text-sm font-bold text-white shadow-sm">A</span>
            <span className="text-xl font-extrabold tracking-tight text-alivia-primary">Alivia</span>
            <span aria-hidden="true" className="hidden h-6 w-px bg-slate-200 sm:block" />
            <span className="hidden text-sm font-semibold text-alivia-text-muted sm:inline">Contratación &amp; Asistencia</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-bold" aria-label="Contratación">
            <span aria-current="page" className="border-b-2 border-alivia-primary pb-1 text-alivia-primary">Seguimiento</span>
            <a href="#ayuda" className="flex items-center gap-1.5 pb-1 text-alivia-text-muted hover:text-alivia-primary"><LifeBuoy aria-hidden="true" className="size-4" />Ayuda y soporte</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 lg:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-extrabold tracking-[0.1em] text-alivia-secondary-deep"><span className="size-2 rounded-full bg-alivia-secondary-deep" />ESTADO DE SOLICITUD</p>
            <h1 className="mt-1 text-3xl font-extrabold text-alivia-primary sm:text-4xl">Seguimiento de contratación</h1>
            <p className="mt-2 max-w-xl text-sm text-alivia-text-muted sm:text-base">Supervisa el avance de la habilitación del servicio para tu hogar.</p>
          </div>
          {tracking !== null && <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-alivia-primary"><Hash aria-hidden="true" className="size-3.5" />Código: {tracking.code}</span>}
        </div>
        {error !== null && (
          <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{error}</span><button type="button" onClick={refresh} className="font-bold underline underline-offset-2">Reintentar</button>
          </div>
        )}
        {tracking === null ? (
          error === null && <div className="grid min-h-80 place-items-center text-sm text-alivia-text-muted">Consultando el estado de tu solicitud…</div>
        ) : (
          <div className="mt-6 grid gap-6">
            <ContractingStepper current="evaluation" stopped={tracking.stage === 'NOT_VIABLE'} />
            <TrackingStepper steps={tracking.steps} stopped={tracking.stage === 'NOT_VIABLE'} />
            {tracking.stage === 'EVALUATION' ? <EvaluationTrackingCard visit={tracking.evaluation} />
              : tracking.stage === 'CONFIRMATION' ? <ConfirmationTrackingCard tracking={tracking} confirming={confirming} error={confirmError} onConfirm={confirm} />
                : <TrackingStatusCard tracking={tracking} />}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-alivia-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-alivia-primary-dark disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw aria-hidden="true" className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando estado…' : 'Actualizar estado'}
              </button>
            </div>
            <p className="flex flex-wrap items-center justify-center gap-1.5 text-center text-sm text-alivia-text-muted">
              {tracking.stage === 'CONFIRMATION'
                ? <><Lock aria-hidden="true" className="size-4 text-alivia-secondary-deep" />Proceso respaldado por el protocolo de seguridad y cuidado asistencial Alivia</>
                : <><Headphones aria-hidden="true" className="size-4 text-alivia-secondary-deep" />¿Tienes alguna duda con tu cita? Contáctanos de lunes a domingo, de 8:00 a 20:00 hrs.</>}
            </p>
          </div>
        )}
      </main>
      <ContractFooter />
    </div>
  );
}

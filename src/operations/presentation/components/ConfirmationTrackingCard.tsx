import { ArrowRight, BadgeCheck, CircleAlert, CircleCheck, Home, LifeBuoy, MapPin, ShieldCheck } from 'lucide-react';
import type { ContractingTracking } from '../../domain/model/contracting-tracking.ts';

interface ConfirmationTrackingCardProps {
  readonly tracking: ContractingTracking;
  readonly confirming: boolean;
  readonly error: string | null;
  readonly onConfirm: () => void;
}

/** The technician validated the home: the family reviews the result and confirms to continue to the installation. */
export function ConfirmationTrackingCard({ tracking, confirming, error, onConfirm }: ConfirmationTrackingCardProps) {
  const adapted = tracking.evaluationOutcome === 'VIABLE_WITH_ADAPTATION';
  const notes = tracking.evaluation?.notes ?? null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 rounded-full bg-alivia-mint px-3 py-1 text-xs font-bold text-alivia-secondary-deep"><CircleCheck aria-hidden="true" className="size-4" />Evaluación presencial completada</span>
        <span className="flex items-center gap-1 rounded-full bg-alivia-primary-mist px-3 py-1 text-xs font-bold text-alivia-primary"><CircleAlert aria-hidden="true" className="size-4" />Acción requerida</span>
      </div>
      <h2 className="mt-5 text-2xl font-extrabold text-alivia-primary sm:text-3xl">Configuración lista para confirmar</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-alivia-text-muted sm:text-base">Revisa la configuración validada por nuestro equipo antes de continuar con la programación de la instalación.</p>
      <div className="mt-6 flex min-h-40 flex-col justify-end rounded-xl bg-gradient-to-br from-alivia-primary-mid to-alivia-primary p-5 text-white">
        <Home aria-hidden="true" className="mb-auto size-10 text-alivia-secondary-light" />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-3 text-sm font-bold">
          <span className="flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4 text-alivia-secondary-light" />{tracking.evaluation?.directions ?? 'Domicilio evaluado'} · Domicilio certificado</span>
          <span className="rounded-md bg-white/15 px-2 py-1 text-xs">Inspección técnica {tracking.code}</span>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-alivia-primary-mist/60 p-5">
          <p className="text-[0.7rem] font-bold tracking-[0.08em] text-alivia-text-muted">RESULTADO DE LA EVALUACIÓN</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-extrabold text-alivia-primary"><BadgeCheck aria-hidden="true" className="size-6 text-alivia-secondary-deep" />{adapted ? 'Viable con adaptación técnica' : 'Viable'}</p>
          <p className="mt-2 text-sm leading-6 text-alivia-text-muted">{adapted ? 'Realizamos algunos cambios para que la instalación sea compatible con tu hogar.' : 'Tu hogar es compatible con la configuración que elegiste.'}</p>
          {adapted && notes !== null && <p className="mt-3 flex gap-2 text-sm text-alivia-text"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-alivia-secondary-deep" /><span>Adaptación validada en sitio: <strong>{notes}</strong></span></p>}
        </div>
        <div className="rounded-xl bg-alivia-primary-mist/60 p-5">
          <p className="text-[0.7rem] font-bold tracking-[0.08em] text-alivia-text-muted">PLAN RESULTANTE Y COBERTURA</p>
          <p className="mt-2 text-lg font-extrabold text-alivia-primary">{tracking.planName}</p>
          <p className="mt-1 text-sm text-alivia-text-muted">{tracking.rooms} {tracking.rooms === 1 ? 'habitación' : 'habitaciones'} · {tracking.devices} dispositivos con monitoreo activo</p>
          <div className="mt-4 flex items-baseline justify-between gap-3">
            <span className="text-sm font-bold text-alivia-text">Inversión mensual</span>
            <span><strong className="text-3xl font-extrabold text-alivia-primary">{tracking.formattedMonthlyAmount ?? 'Por calcular'}</strong>{tracking.formattedMonthlyAmount !== null && <span className="text-sm text-alivia-text-muted"> / mes</span>}</span>
          </div>
        </div>
      </div>
      {error !== null && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-sm font-bold text-alivia-primary"><LifeBuoy aria-hidden="true" className="size-4" />¿Dudas con la adaptación? Escríbenos desde Ayuda y soporte</span>
        <button type="button" disabled={confirming} onClick={onConfirm} className="inline-flex items-center rounded-lg bg-alivia-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
          {confirming ? 'Confirmando…' : 'Revisar y confirmar'}<ArrowRight aria-hidden="true" className="ml-1.5 size-4" />
        </button>
      </div>
    </section>
  );
}

import { Link, useParams } from 'react-router';
import { ArrowRight, Clock, MapPin, Radio, ShieldCheck, Wrench } from 'lucide-react';
import { formatDateTime } from '@/shared/domain/model/valueobjects/relative-time.ts';
import {
  Bone,
  ErrorState,
  Skeleton,
  StatusDot,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { loadIncident } from '../../application/incidents.store.ts';
import { PROBLEM_LABELS, SUPPORT_PHONE } from '../incident-presentation.ts';

/** Confirmation right after a report is sent; the code is what support will ask for. */
export function IncidentRegisteredView() {
  useDocumentTitle('Incidencia registrada');
  const { id = '' } = useParams();
  const { state, retry } = useLoad(() => loadIncident(id), [id]);

  if (state.status === 'loading') {
    return (
      <Skeleton label="Cargando tu reporte…" className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 rounded-3xl border border-alivia-primary-mist bg-white p-8">
        <Bone className="size-12 rounded-full" />
        <Bone className="h-7 w-56" />
        <Bone className="h-3.5 w-72 max-w-full" />
        <Bone className="mt-3 h-56 w-full rounded-2xl" />
      </Skeleton>
    );
  }
  if (state.status === 'error') {
    return <ErrorState title="No encontramos esta incidencia" message="Vuelve a la lista de incidencias." onRetry={retry} />;
  }
  const incident = state.data;

  return (
    <div className="mx-auto w-full max-w-xl py-4">
      <div className="rounded-3xl border border-alivia-primary-mist bg-white p-6 text-center shadow-sm motion-safe:animate-step-in sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-alivia-secondary text-alivia-primary-dark">
          <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
            <path d="M5 12l5 5L19 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" className="animate-check-draw" />
          </svg>
        </span>
        <p className="mt-4 text-xs font-bold tracking-wide text-alivia-secondary-deep uppercase">Reporte completado</p>
        <h1 className="mt-1 text-2xl font-bold text-alivia-primary-dark">Incidencia registrada</h1>
        <p className="mt-2 text-sm text-alivia-text-muted">
          El equipo de soporte técnico revisará el reporte y asignará la atención correspondiente.
        </p>

        <section className="mt-6 rounded-2xl bg-alivia-page p-5 text-left">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-alivia-text-muted uppercase">Código de ticket</p>
              <p className="text-lg font-bold text-alivia-primary-dark">{incident.code}</p>
            </div>
            <StatusDot tone="success">Registrada</StatusDot>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              { icon: Radio, label: 'Dispositivo afectado', value: `${incident.deviceName} (${incident.deviceCode}) · ${incident.roomName}` },
              { icon: Wrench, label: 'Tipo de problema', value: PROBLEM_LABELS[incident.problemType] },
              { icon: Clock, label: 'Fecha y hora reportadas', value: formatDateTime(incident.reportedAt) },
              { icon: MapPin, label: 'Ubicación del servicio', value: `${incident.address.line}, ${incident.address.district}` },
            ].map((row) => (
              <div key={row.label} className="grid gap-1 sm:grid-cols-[170px_1fr] sm:gap-3">
                <dt className="flex items-center gap-2 text-xs font-semibold text-alivia-text-muted">
                  <row.icon className="size-4 shrink-0" aria-hidden="true" />
                  {row.label}
                </dt>
                <dd className="font-semibold text-alivia-primary-dark sm:text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-white/80 p-3 text-xs text-alivia-text-muted">
            <ShieldCheck className="size-4 shrink-0 text-alivia-secondary-deep" aria-hidden="true" />
            Te avisaremos de cualquier cambio o visita técnica por este portal y al teléfono registrado del hogar.
          </p>
        </section>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link
            to={`/incidents/${incident.id}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-alivia-primary px-4 text-sm font-semibold text-white transition-[background-color,scale] duration-150 hover:bg-alivia-primary-mid active:scale-[0.97]"
          >
            Ver seguimiento
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            to="/incidents"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-alivia-primary-mist px-4 text-sm font-semibold text-alivia-primary-dark transition-[background-color,scale] duration-150 hover:bg-alivia-primary-light/50 active:scale-[0.97]"
          >
            Volver a incidencias
          </Link>
        </div>
        <p className="mt-4 text-xs text-alivia-text-muted">
          ¿Problema crítico con riesgo inmediato? Llama a la Línea de Asistencia Alivia:{' '}
          <a href={`tel:${SUPPORT_PHONE.replace(/\D/g, '')}`} className="font-semibold text-alivia-secondary-deep hover:underline">
            {SUPPORT_PHONE}
          </a>
        </p>
      </div>
    </div>
  );
}

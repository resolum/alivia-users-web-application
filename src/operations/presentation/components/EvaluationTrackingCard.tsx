import { useState, type ReactNode } from 'react';
import { CalendarDays, Clock, Info, MapPin, ShieldCheck, Wrench } from 'lucide-react';
import type { TechnicalVisitProps } from '../../domain/model/contracting-tracking.ts';
import { formatLongDate, initials } from '../../domain/model/evaluation-slot.ts';

const REQUIREMENTS = [
  'Que una persona adulta esté en el hogar durante la visita.',
  'Acceso a los ambientes configurados y al tablero eléctrico.',
  'El nombre y la clave de la red Wi-Fi del hogar.',
] as const;

/**
 * The evaluation visit is pending. The family cannot reschedule it here: the technician decides at the home
 * whether the request moves on to the confirmation.
 */
export function EvaluationTrackingCard({ visit }: { readonly visit: TechnicalVisitProps | null }) {
  const [showRequirements, setShowRequirements] = useState(false);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-extrabold tracking-[0.08em] text-alivia-secondary-deep"><span className="size-2 rounded-full bg-alivia-secondary-deep" />PENDIENTE DE VISITA TÉCNICA</span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-alivia-text-muted"><ShieldCheck aria-hidden="true" className="size-4 text-alivia-secondary-deep" />Inspección certificada</span>
      </div>
      <h2 className="mt-5 text-2xl font-extrabold text-alivia-primary sm:text-3xl">Evaluación técnica presencial</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-alivia-text-muted sm:text-base">Un especialista evaluará la compatibilidad eléctrica, la conectividad de respaldo y los puntos de anclaje de tu hogar para garantizar la asistencia.</p>
      {visit === null ? (
        <p className="mt-6 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Aún no tienes una visita agendada. Te contactaremos para coordinarla.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Detail icon={<CalendarDays aria-hidden="true" className="size-5" />} label="FECHA PROGRAMADA" value={formatLongDate(visit.date)} />
          <Detail icon={<Clock aria-hidden="true" className="size-5" />} label="VENTANA DE LLEGADA" value={`${visit.startTime} – ${visit.endTime} hrs`} />
          <Detail icon={<MapPin aria-hidden="true" className="size-5" />} label="LUGAR DE INSPECCIÓN" value={visit.directions ?? 'Pendiente de confirmación'} wide />
          <div className="flex items-center gap-3 rounded-xl bg-alivia-primary-mist/60 p-4 sm:col-span-2">
            <span className="grid size-11 place-items-center rounded-full bg-alivia-primary text-sm font-bold text-white">{initials(visit.technicianName)}</span>
            <div><p className="font-extrabold text-alivia-primary">{visit.technicianName}</p><p className="flex items-center gap-1 text-xs text-alivia-text-muted"><Wrench aria-hidden="true" className="size-3" />Técnico asignado</p></div>
          </div>
        </div>
      )}
      <button type="button" aria-expanded={showRequirements} onClick={() => setShowRequirements((value) => !value)} className="mt-6 flex items-center gap-1.5 text-sm font-bold text-alivia-primary hover:underline">
        <Info aria-hidden="true" className="size-4" />Ver requerimientos previos
      </button>
      {showRequirements && (
        <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-alivia-text-muted">
          {REQUIREMENTS.map((requirement) => <li key={requirement}>{requirement}</li>)}
        </ul>
      )}
    </section>
  );
}

function Detail({ icon, label, value, wide = false }: { readonly icon: ReactNode; readonly label: string; readonly value: string; readonly wide?: boolean }) {
  return (
    <div className={`flex items-center gap-4 rounded-xl bg-alivia-primary-mist/60 p-4 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white text-alivia-primary shadow-sm">{icon}</span>
      <div><p className="text-[0.7rem] font-bold tracking-[0.08em] text-alivia-text-muted">{label}</p><p className="text-base font-extrabold text-alivia-primary sm:text-lg">{value}</p></div>
    </div>
  );
}

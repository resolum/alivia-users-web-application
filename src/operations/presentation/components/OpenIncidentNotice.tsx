import { Link } from 'react-router';
import { ArrowRight, Info } from 'lucide-react';
import { StatusDot } from '@/shared/presentation/components/ui/index.ts';
import type { Incident } from '../../domain/model/incident.entity.ts';
import { PROBLEM_LABELS, STAGE } from '../incident-presentation.ts';

/** The incident already in course for the chosen device: the family follows that one instead of reporting again. */
export function OpenIncidentNotice({ incident, onOpen }: { readonly incident: Incident; readonly onOpen?: () => void }) {
  return (
    <section role="status" aria-label="Incidencia abierta del dispositivo" className="rounded-xl border border-alivia-warning/30 bg-alivia-warning-soft p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-alivia-warning">
        <Info className="size-4 shrink-0" aria-hidden="true" />
        Este dispositivo ya tiene una incidencia abierta
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-bold text-alivia-primary-dark">{incident.code}</span>
        <StatusDot tone={STAGE[incident.stage].tone}>{STAGE[incident.stage].label}</StatusDot>
      </div>
      <p className="mt-1 text-alivia-text-muted">{PROBLEM_LABELS[incident.problemType]} · {incident.deviceName}</p>
      <p className="mt-1 text-alivia-text-muted">Sigue esa atención en lugar de crear un nuevo reporte.</p>
      <Link
        to={`/incidents/${incident.id}`}
        onClick={onOpen}
        className="mt-3 inline-flex items-center gap-1.5 font-bold text-alivia-primary-dark underline-offset-2 hover:underline"
      >
        Ver seguimiento
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

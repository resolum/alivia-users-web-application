import { Check } from 'lucide-react';
import { INCIDENT_STAGES, type Incident } from '../../domain/model/incident.entity.ts';
import { STAGE } from '../incident-presentation.ts';

const shortDate = (iso: string) =>
  `${new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} · ${new Date(iso).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' })}`;

/** Progress of the ticket. Skipped stages (no visit needed) still read as passed. */
export function IncidentStepper({ incident }: { readonly incident: Incident }) {
  const current = incident.stageIndex;
  return (
    <ol className="grid grid-cols-5 gap-1 rounded-2xl border border-alivia-primary-mist bg-white px-2 py-5 sm:px-6" aria-label="Progreso de la incidencia">
      {INCIDENT_STAGES.map((stage, index) => {
        const done = index < current || (index === current && incident.isResolved);
        const active = index === current && !incident.isResolved;
        const date = incident.stageDates[stage];
        return (
          <li key={stage} aria-current={active ? 'step' : undefined} className="relative flex flex-col items-center text-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                className={`absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2 ${index <= current ? 'bg-alivia-secondary-deep' : 'bg-alivia-primary-mist'}`}
              />
            )}
            <span
              className={[
                'relative grid size-8 place-items-center rounded-full text-xs font-bold',
                done ? 'bg-alivia-primary-dark text-white' : active ? 'bg-alivia-secondary text-alivia-primary-dark ring-4 ring-alivia-mint' : 'bg-alivia-primary-mist text-alivia-text-muted',
              ].join(' ')}
            >
              {done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className={`mt-2 text-[11px] leading-tight font-bold sm:text-xs ${active ? 'text-alivia-secondary-deep' : index <= current ? 'text-alivia-primary-dark' : 'text-alivia-text-muted'}`}>
              {STAGE[stage].label}
            </span>
            <span className="mt-0.5 hidden text-[11px] text-alivia-text-muted sm:block">
              {date ? shortDate(date) : index < current ? 'Omitida' : 'Pendiente'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

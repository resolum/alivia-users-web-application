import type { ReactNode } from 'react';
import { CircleX, PartyPopper, Wrench } from 'lucide-react';
import type { ContractingTracking } from '../../domain/model/contracting-tracking.ts';
import { formatLongDate } from '../../domain/model/evaluation-slot.ts';

/** The stages after the confirmation, and the closed request of a home that is not viable. */
export function TrackingStatusCard({ tracking }: { readonly tracking: ContractingTracking }) {
  if (tracking.stage === 'NOT_VIABLE') {
    return (
      <Card icon={<CircleX aria-hidden="true" className="size-7" />} tone="danger" eyebrow="EVALUACIÓN COMPLETADA" title="Tu hogar no es compatible por ahora">
        El técnico no pudo validar la instalación en tu hogar{tracking.evaluation?.notes ? `: ${tracking.evaluation.notes}` : '.'} Cancelamos la contratación y te contactaremos para la devolución correspondiente.
      </Card>
    );
  }
  if (tracking.stage === 'ACTIVATION') {
    return (
      <Card icon={<PartyPopper aria-hidden="true" className="size-7" />} tone="success" eyebrow="INSTALACIÓN APROBADA" title="Estamos activando tu servicio">
        La instalación terminó con éxito. En breve tu hogar quedará en servicio con el monitoreo de Alivia.
      </Card>
    );
  }
  const installation = tracking.installation;
  return (
    <Card icon={<Wrench aria-hidden="true" className="size-7" />} tone="success" eyebrow="CONFIGURACIÓN CONFIRMADA" title="Coordinamos tu instalación">
      {installation === null
        ? 'Confirmaste tu configuración. Nuestro equipo te contactará para programar la visita de instalación.'
        : `Instalación programada para el ${formatLongDate(installation.date)}, entre ${installation.startTime} y ${installation.endTime} hrs, con ${installation.technicianName}.`}
    </Card>
  );
}

function Card({ icon, tone, eyebrow, title, children }: {
  readonly icon: ReactNode; readonly tone: 'success' | 'danger'; readonly eyebrow: string; readonly title: string; readonly children: ReactNode;
}) {
  const colors = tone === 'success' ? 'border-emerald-200 [&_.badge]:bg-emerald-100 [&_.badge]:text-emerald-700' : 'border-red-200 [&_.badge]:bg-red-50 [&_.badge]:text-alivia-danger';
  return (
    <section className={`rounded-2xl border bg-white p-6 text-center shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-9 ${colors}`}>
      <div className="badge mx-auto grid size-14 place-items-center rounded-full">{icon}</div>
      <p className="mt-4 text-xs font-extrabold tracking-[0.1em] text-alivia-secondary-deep">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-extrabold text-alivia-primary sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-alivia-text-muted">{children}</p>
    </section>
  );
}

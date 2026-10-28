import { CalendarDays, Check, Clock, Wrench } from 'lucide-react';
import type { Appointment } from '../../domain/model/appointment.ts';
import { formatLongDate, initials } from '../../domain/model/evaluation-slot.ts';

export function BookedState({ appointment }: { readonly appointment: Appointment }) {
  return (
    <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-9">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check aria-hidden="true" className="size-7" /></div>
      <p className="mt-4 text-xs font-extrabold tracking-[0.1em] text-alivia-secondary-deep">EVALUACIÓN AGENDADA</p>
      <h1 className="mt-1 text-3xl font-extrabold text-alivia-primary">Te esperamos en tu hogar</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-alivia-text-muted">
        Enviaremos un recordatorio a {appointment.contactName} 2 horas antes. El cobro se confirmará después de la evaluación.
      </p>
      <div className="mx-auto mt-6 grid max-w-md gap-3 rounded-xl bg-alivia-primary-mist/60 p-5 text-left text-sm">
        <p className="flex items-center gap-2.5"><CalendarDays aria-hidden="true" className="size-4 text-alivia-secondary-dark" /><strong className="text-alivia-primary">{formatLongDate(appointment.date)}</strong></p>
        <p className="flex items-center gap-2.5"><Clock aria-hidden="true" className="size-4 text-alivia-secondary-dark" />Llegada entre {appointment.startTime} y {appointment.endTime} hrs</p>
        <div className="mt-1 flex items-center gap-3 border-t border-alivia-primary/10 pt-3">
          <span className="grid size-10 place-items-center rounded-full bg-alivia-primary text-xs font-bold text-white">{initials(appointment.technicianName)}</span>
          <div><p className="font-extrabold text-alivia-primary">{appointment.technicianName}</p><p className="flex items-center gap-1 text-xs text-alivia-text-muted"><Wrench aria-hidden="true" className="size-3" />Técnico asignado</p></div>
        </div>
      </div>
    </section>
  );
}

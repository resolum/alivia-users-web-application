import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, BellRing, Briefcase, CalendarDays, Check, Clock, PieChart, ShieldCheck, UserRound, Wrench } from 'lucide-react';
import { isValidPeruvianMobile, type EvaluationContact } from '../../domain/model/appointment.ts';
import { formatLongDate, initials, type EvaluationSlot } from '../../domain/model/evaluation-slot.ts';

interface ConfirmStepProps {
  readonly slot: EvaluationSlot;
  readonly submitting: boolean;
  readonly error: string | null;
  readonly onChangeSlot: () => void;
  readonly onConfirm: (contact: EvaluationContact) => void;
}

function Card({ icon, eyebrow, title, children }: {
  readonly icon: ReactNode;
  readonly eyebrow: string;
  readonly title: ReactNode;
  readonly children?: ReactNode;
}) {
  return (
    <article className="rounded-2xl bg-alivia-primary-mist/45 p-5">
      <div className="flex items-start gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-alivia-primary-mist text-alivia-primary">{icon}</span>
        <div className="min-w-0">
          <p className="text-[0.7rem] font-extrabold tracking-[0.08em] text-slate-500">{eyebrow}</p>
          <h3 className="mt-0.5 text-lg font-extrabold leading-snug text-alivia-primary">{title}</h3>
        </div>
      </div>
      {children}
    </article>
  );
}

export function ConfirmStep({ slot, submitting, error, onChangeSlot, onConfirm }: ConfirmStepProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [directions, setDirections] = useState('');
  const [adultPresent, setAdultPresent] = useState(false);
  const [touched, setTouched] = useState(false);
  const phoneValid = isValidPeruvianMobile(phone);
  const valid = name.trim() !== '' && phoneValid && adultPresent;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (valid && !submitting) onConfirm({ name, phone, directions });
  };

  return (
    <form onSubmit={submit} className="mx-auto mt-8 max-w-5xl" noValidate>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-alivia-primary-mist px-2.5 py-1 text-xs font-extrabold tracking-wide text-alivia-primary">ÚLTIMO PASO</span>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-alivia-secondary-deep"><ShieldCheck aria-hidden="true" className="size-4" />Garantía Alivia</span>
      </div>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-alivia-primary">Confirma tu visita</h1>
      <p className="mt-2 text-alivia-text-muted">Revisa los detalles de la evaluación presencial antes de programarla.</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-7">
        <div className="grid gap-5 md:grid-cols-2">
          <Card icon={<CalendarDays aria-hidden="true" className="size-5" />} eyebrow="CITA RESERVADA" title={formatLongDate(slot.date)}>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
              <span className="flex items-center gap-2 text-xl font-extrabold text-alivia-primary"><Clock aria-hidden="true" className="size-5 text-alivia-secondary-dark" />{slot.startTime} – {slot.endTime} hrs</span>
              <button type="button" onClick={onChangeSlot} className="text-sm font-bold text-alivia-secondary-deep underline underline-offset-2">Cambiar horario</button>
            </div>
          </Card>

          <Card icon={<Wrench aria-hidden="true" className="size-5" />} eyebrow="TÉCNICO ASIGNADO" title={slot.technicianName}>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-alivia-primary text-sm font-bold text-white">{initials(slot.technicianName)}</span>
              <div className="min-w-0 text-sm">
                <p className="font-bold text-alivia-text">Técnico de soporte Alivia</p>
                <p className="text-alivia-text-muted">Disponible en tu franja según su horario laboral</p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><ShieldCheck aria-hidden="true" className="size-3.5" />Llegará identificado con su credencial de Alivia.</p>
          </Card>

          <Card icon={<Briefcase aria-hidden="true" className="size-5" />} eyebrow="TIPO DE SERVICIO" title="Evaluación técnica presencial">
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-alivia-primary"><PieChart aria-hidden="true" className="size-4" />Duración: 45 a 60 minutos</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-alivia-mint px-3 py-1.5 text-sm font-bold text-alivia-secondary-deep"><span className="size-2 rounded-full bg-alivia-secondary-deep" />Importe preautorizado (S/ 0 cobrados hoy)</span>
            </div>
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-white px-4 py-3 text-sm text-alivia-text-muted"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />No se realizará ningún cobro definitivo hasta validar la viabilidad técnica en tu hogar.</p>
          </Card>

          <Card icon={<UserRound aria-hidden="true" className="size-5" />} eyebrow="RECEPTOR DE LA VISITA" title={name.trim() === '' ? 'Quién recibirá al técnico' : name}>
            <div className="mt-4 grid gap-3">
              <label className="block rounded-xl bg-white px-4 py-2.5">
                <span className="text-xs font-bold text-alivia-text">Nombre completo</span>
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} autoComplete="name" placeholder="Ej. María Elena Villanueva" className="mt-0.5 w-full bg-transparent text-base font-bold text-alivia-primary outline-none placeholder:font-medium placeholder:text-slate-400" />
              </label>
              <label className="block rounded-xl bg-white px-4 py-2.5">
                <span className="text-xs font-bold text-alivia-text">Teléfono de contacto</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="+51 984 123 456" className="mt-0.5 w-full bg-transparent text-base font-bold text-alivia-primary outline-none placeholder:font-medium placeholder:text-slate-400" />
              </label>
              {touched && name.trim() === '' && <p className="text-xs font-semibold text-alivia-danger">Ingresa el nombre de quien recibirá la visita.</p>}
              {touched && !phoneValid && <p className="text-xs font-semibold text-alivia-danger">Ingresa un celular peruano de 9 dígitos.</p>}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><BellRing aria-hidden="true" className="size-3.5" />Se enviará un recordatorio SMS 2 horas antes de la cita.</p>
          </Card>
        </div>


        <label className="mt-7 block">
          <span className="text-sm font-bold text-alivia-primary">Indicaciones para llegar <span className="font-medium text-slate-500">(Opcional)</span></span>
          <textarea value={directions} onChange={(event) => setDirections(event.target.value)} maxLength={300} rows={3} placeholder="Ej. Intercomunicador 401, puerta verde frente al parque olímpico…" className="mt-2 w-full resize-y rounded-xl bg-alivia-primary-mist/45 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-alivia-primary-light" />
        </label>

        <label className="mt-5 flex cursor-pointer items-center gap-4 rounded-2xl bg-alivia-primary-mist/45 p-4">
          <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-white ${touched && !adultPresent ? 'ring-2 ring-alivia-danger' : ''}`}>
            <input type="checkbox" checked={adultPresent} onChange={(event) => setAdultPresent(event.target.checked)} className="size-5 accent-alivia-primary" />
          </span>
          <span className="text-sm font-bold text-alivia-primary">Confirmo que una persona adulta estará disponible en el domicilio durante la visita técnica.</span>
        </label>

        {error !== null && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <button type="button" onClick={onChangeSlot} className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-alivia-primary"><ArrowLeft aria-hidden="true" className="mr-1.5 inline size-4 align-[-3px]" />Cambiar horario</button>
        <button type="submit" disabled={submitting} className="rounded-lg bg-alivia-primary px-7 py-3 text-sm font-bold text-white disabled:opacity-60">
          {submitting ? 'Agendando…' : <>Confirmar evaluación<Check aria-hidden="true" className="ml-2 inline size-4 align-[-3px]" /></>}
        </button>
      </div>
    </form>
  );
}

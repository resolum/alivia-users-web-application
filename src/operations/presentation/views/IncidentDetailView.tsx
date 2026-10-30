import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  CircleCheck,
  ClipboardList,
  Download,
  ImageIcon,
  MapPin,
  Paperclip,
  RotateCw,
  ShieldCheck,
  UserCog,
  Wrench,
} from 'lucide-react';
import { formatDateTime, formatLongDay, formatTime } from '@/shared/domain/model/valueobjects/relative-time.ts';
import {
  Bone,
  Button,
  ConfirmDialog,
  ErrorState,
  Skeleton,
  StatusDot,
  Toast,
  useToast,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { loadIncident, requestVisitReschedule } from '../../application/incidents.store.ts';
import type { Incident, IncidentEvidence } from '../../domain/model/incident.entity.ts';
import { PROBLEM_LABELS, STAGE } from '../incident-presentation.ts';
import { IncidentStepper } from '../components/IncidentStepper.tsx';

const VISIT_RULES = [
  'El técnico llega identificado con fotocheck de Alivia y su nombre coincide con el que ves aquí.',
  'Un adulto del hogar debe estar presente durante toda la visita.',
  'El técnico nunca pide pagos en efectivo: los recambios preventivos están incluidos en tu plan.',
  'Si algo no coincide, no abras la puerta y llama a la Línea de Asistencia.',
];

function Panel({ title, icon, aside, children }: { readonly title: string; readonly icon: ReactNode; readonly aside?: ReactNode; readonly children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-alivia-primary-mist bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-alivia-primary-dark">
          {icon}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, children, wide = false }: { readonly label: string; readonly children: ReactNode; readonly wide?: boolean }) {
  return (
    <div className={`rounded-xl bg-alivia-page p-3 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="text-[11px] font-bold tracking-wide text-alivia-text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-alivia-primary-dark">{children}</dd>
    </div>
  );
}

function EvidenceTile({ evidence }: { readonly evidence: IncidentEvidence }) {
  const caption = evidence.stage === 'report' ? 'Reporte' : 'Resolución';
  return (
    <figure className="overflow-hidden rounded-xl border border-alivia-primary-mist">
      {evidence.url ? (
        <a href={evidence.url} target="_blank" rel="noreferrer" className="block">
          <img src={evidence.url} alt={`Foto de ${caption.toLowerCase()}: ${evidence.name}`} className="aspect-[4/3] w-full object-cover" />
        </a>
      ) : (
        <div className="grid aspect-[4/3] place-items-center bg-alivia-page text-alivia-primary-light">
          <ImageIcon className="size-8" aria-hidden="true" />
        </div>
      )}
      <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
        <span className="truncate font-semibold text-alivia-primary-dark">{evidence.name}</span>
        <span className="shrink-0 text-alivia-text-muted">
          {caption} · {evidence.sizeLabel}
        </span>
      </figcaption>
    </figure>
  );
}

function StagePanel({ incident, onReschedule }: { readonly incident: Incident; readonly onReschedule: () => void }) {
  if (incident.stage === 'visit_scheduled' && incident.visit) {
    return (
      <section className="flex flex-wrap items-center gap-4 rounded-2xl bg-alivia-primary-mist/70 p-5 sm:p-6">
        <span aria-hidden="true" className="grid size-12 place-items-center rounded-xl bg-white text-alivia-secondary-deep">
          <CalendarCheck className="size-6" />
        </span>
        <div className="min-w-0 flex-1 basis-60">
          <p className="text-xs font-bold tracking-wide text-alivia-secondary-deep uppercase">Visita técnica en domicilio</p>
          <p className="mt-1 text-xl font-bold text-alivia-primary-dark">
            {formatLongDay(incident.visit.start)} · {formatTime(incident.visit.start)} – {formatTime(incident.visit.end)}
          </p>
          <p className="mt-1 text-sm text-alivia-text-muted">
            Técnico asignado: <span className="font-semibold text-alivia-primary-dark">{incident.visit.technicianName}</span> ({incident.visit.technicianSpecialty})
          </p>
        </div>
        {incident.visit.rescheduleRequested ? (
          <StatusDot tone="warning">Reprogramación solicitada</StatusDot>
        ) : (
          <Button variant="outline" onClick={onReschedule}>
            <CalendarClock className="size-4" aria-hidden="true" />
            Reprogramar visita
          </Button>
        )}
      </section>
    );
  }
  if (incident.stage === 'in_attention') {
    return (
      <section className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl bg-alivia-primary-mist/70 p-5 sm:p-6">
        <div className="min-w-0 flex-1 basis-60">
          <StatusDot tone="success">Atención técnica en curso</StatusDot>
          <p className="mt-2 text-xl font-bold text-alivia-primary-dark">Trabajando en el dispositivo</p>
          {incident.attentionNote && <p className="mt-1 text-sm text-alivia-text-muted">{incident.attentionNote}</p>}
        </div>
        {incident.stageDates.in_attention && (
          <dl className="text-sm">
            <dt className="text-[11px] font-bold tracking-wide text-alivia-text-muted uppercase">Inicio de atención</dt>
            <dd className="font-bold text-alivia-primary-dark">{formatDateTime(incident.stageDates.in_attention)}</dd>
          </dl>
        )}
      </section>
    );
  }
  if (incident.isResolved) {
    return (
      <section className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-alivia-secondary/40 bg-alivia-mint/60 p-5 sm:p-6">
        <span className="flex items-center gap-3">
          <CircleCheck className="size-8 text-alivia-secondary-deep" aria-hidden="true" />
          <span>
            <span className="block text-[11px] font-bold tracking-wide text-alivia-secondary-deep uppercase">Estado del caso</span>
            <span className="text-xl font-bold text-alivia-primary-dark">Incidencia resuelta</span>
          </span>
        </span>
        {incident.stageDates.resolved && (
          <dl className="text-sm">
            <dt className="text-[11px] font-bold tracking-wide text-alivia-text-muted uppercase">Fecha de cierre</dt>
            <dd className="font-bold text-alivia-primary-dark">{formatDateTime(incident.stageDates.resolved)}</dd>
          </dl>
        )}
        <dl className="text-sm">
          <dt className="text-[11px] font-bold tracking-wide text-alivia-text-muted uppercase">Estado del dispositivo</dt>
          <dd className="font-bold text-alivia-secondary-deep">Operativo</dd>
        </dl>
      </section>
    );
  }
  return (
    <section className="rounded-2xl bg-alivia-primary-mist/70 p-5 sm:p-6">
      <StatusDot tone={STAGE[incident.stage].tone}>{STAGE[incident.stage].label}</StatusDot>
      <p className="mt-2 text-xl font-bold text-alivia-primary-dark">El equipo técnico está revisando tu reporte</p>
      <p className="mt-1 text-sm text-alivia-text-muted">
        {incident.remoteNote ?? 'Te avisaremos si hace falta una visita al hogar.'}
      </p>
    </section>
  );
}

export function IncidentDetailView() {
  const { id = '' } = useParams();
  const { state, retry, setData } = useLoad(() => loadIncident(id), [id]);
  const [rescheduling, setRescheduling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, notify] = useToast();
  useDocumentTitle(state.status === 'ready' ? `Incidencia ${state.data.code}` : 'Incidencia');

  const back = (
    <Link to="/incidents" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-alivia-secondary-deep hover:underline print:hidden">
      <ArrowLeft className="size-4" aria-hidden="true" />
      Volver a incidencias
    </Link>
  );

  if (state.status === 'loading') {
    return (
      <Skeleton label="Cargando la incidencia…" className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <Bone className="h-4 w-40" />
        <Bone className="h-9 w-80 max-w-full" />
        <div className="grid grid-cols-5 gap-2 rounded-2xl border border-alivia-primary-mist bg-white px-4 py-5">
          {[0, 1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center gap-2">
              <Bone className="size-8 rounded-full" />
              <Bone className="h-3 w-16" />
            </div>
          ))}
        </div>
        <Bone className="h-28 w-full rounded-2xl" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Bone className="h-72 rounded-2xl" />
          <Bone className="h-72 rounded-2xl" />
        </div>
      </Skeleton>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-5xl">
        {back}
        <ErrorState title="No encontramos esta incidencia" message="Puede que el enlace esté incompleto." onRetry={retry} />
      </div>
    );
  }
  const incident = state.data;
  const reportEvidence = incident.evidence.filter((item) => item.stage === 'report');
  const resolutionEvidence = incident.evidence.filter((item) => item.stage === 'resolution');

  const confirmReschedule = async () => {
    setBusy(true);
    try {
      setData(await requestVisitReschedule(incident.id));
      notify('Pedimos la reprogramación. Soporte te llamará para elegir otra fecha.');
    } catch {
      notify('No pudimos enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
      setRescheduling(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      {back}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-alivia-primary-dark sm:text-3xl">Incidencia {incident.code}</h1>
            <StatusDot tone={STAGE[incident.stage].tone}>{STAGE[incident.stage].label}</StatusDot>
          </div>
          <p className="text-sm text-alivia-text-muted">
            {incident.deviceName} · {incident.roomName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link
            to={`/devices?device=${incident.deviceId}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-alivia-primary-light/70 bg-white px-4 text-sm font-semibold text-alivia-primary-dark hover:bg-alivia-primary-mist/60"
          >
            Ver dispositivo
          </Link>
          <Button variant="soft" onClick={() => window.print()}>
            <Download className="size-4" aria-hidden="true" />
            Descargar ficha
          </Button>
        </div>
      </header>

      <IncidentStepper incident={incident} />
      <StagePanel incident={incident} onReschedule={() => setRescheduling(true)} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Detalle del reporte" icon={<ClipboardList className="size-5 text-alivia-secondary-deep" aria-hidden="true" />}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="Dispositivo y habitación">
              {incident.deviceName} · {incident.roomName}
            </Fact>
            <Fact label="Tipo de problema">{PROBLEM_LABELS[incident.problemType]}</Fact>
            <Fact label="Fecha y hora del incidente" wide>
              {formatDateTime(incident.reportedAt)}
            </Fact>
          </dl>
          <div>
            <h3 className="text-[11px] font-bold tracking-wide text-alivia-text-muted uppercase">Descripción del cuidador</h3>
            <blockquote className="mt-2 rounded-xl border border-alivia-primary-mist p-4 text-sm text-alivia-text">“{incident.description}”</blockquote>
          </div>
          {reportEvidence.length > 0 && (
            <div>
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-alivia-text-muted uppercase">
                <Paperclip className="size-3.5" aria-hidden="true" />
                Evidencia fotográfica ({reportEvidence.length})
              </h3>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {reportEvidence.map((evidence) => (
                  <EvidenceTile key={evidence.name} evidence={evidence} />
                ))}
              </div>
            </div>
          )}
        </Panel>

        {incident.isResolved ? (
          <Panel
            title="Detalle de resolución"
            icon={<CircleCheck className="size-5 text-alivia-secondary-deep" aria-hidden="true" />}
            aside={<StatusDot tone="success">Dispositivo operativo</StatusDot>}
          >
            {incident.resolutionNote && (
              <div>
                <h3 className="text-[11px] font-bold tracking-wide text-alivia-text-muted uppercase">Trabajo realizado</h3>
                <p className="mt-2 rounded-xl bg-alivia-page p-4 text-sm text-alivia-text">{incident.resolutionNote}</p>
              </div>
            )}
            <dl className="grid gap-3 sm:grid-cols-2">
              {incident.stageDates.resolved && <Fact label="Fecha y hora de cierre">{formatDateTime(incident.stageDates.resolved)}</Fact>}
              <Fact label="Técnico responsable">{incident.visit?.technicianName ?? 'Soporte remoto Alivia'}</Fact>
            </dl>
            {resolutionEvidence.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {resolutionEvidence.map((evidence) => (
                  <EvidenceTile key={evidence.name} evidence={evidence} />
                ))}
              </div>
            )}
          </Panel>
        ) : (
          <Panel title="Atención y ubicación" icon={<UserCog className="size-5 text-alivia-secondary-deep" aria-hidden="true" />}>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Fact label="Técnico asignado">{incident.visit?.technicianName ?? 'Por asignar'}</Fact>
              <Fact label="Estado actual">{STAGE[incident.stage].label}</Fact>
            </dl>
            {incident.attentionNote && (
              <p className="flex items-start gap-2 rounded-xl border border-alivia-primary-mist p-3 text-sm text-alivia-text">
                <Wrench className="mt-0.5 size-4 shrink-0 text-alivia-secondary-deep" aria-hidden="true" />
                {incident.attentionNote}
              </p>
            )}
            <div>
              <h3 className="text-[11px] font-bold tracking-wide text-alivia-text-muted uppercase">Ubicación del servicio</h3>
              <p className="mt-2 flex items-start gap-2 rounded-xl bg-alivia-page p-4 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-alivia-secondary-deep" aria-hidden="true" />
                <span>
                  <span className="block font-bold text-alivia-primary-dark">{incident.address.line}</span>
                  <span className="text-alivia-text-muted">
                    {incident.address.district}
                    {incident.address.reference && ` · Ref.: ${incident.address.reference}`}
                  </span>
                </span>
              </p>
            </div>
          </Panel>
        )}
      </div>

      {incident.isResolved ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-alivia-primary-mist bg-white p-4 print:hidden">
          <Link
            to={`/incidents?report=1&device=${incident.deviceId}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-alivia-primary-dark hover:bg-alivia-page"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            Reportar nuevamente
          </Link>
        </div>
      ) : (
        <details className="group rounded-2xl border border-alivia-primary-mist bg-white p-4 text-sm">
          <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-alivia-text-muted">
              <ShieldCheck className="size-4 shrink-0 text-alivia-secondary-deep" aria-hidden="true" />
              El técnico acudirá identificado con fotocheck oficial y el equipo de recambio verificado.
            </span>
            <span className="font-bold text-alivia-secondary-deep group-open:hidden">Ver normas de visita</span>
            <span className="hidden font-bold text-alivia-secondary-deep group-open:inline">Ocultar normas</span>
          </summary>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-alivia-text">
            {VISIT_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </details>
      )}

      <ConfirmDialog
        open={rescheduling}
        title="¿Reprogramar la visita?"
        confirmLabel="Solicitar reprogramación"
        busy={busy}
        onConfirm={confirmReschedule}
        onCancel={() => setRescheduling(false)}
      >
        Avisaremos al equipo técnico y te llamarán al teléfono del hogar para acordar una nueva fecha. La visita actual
        queda en pie hasta entonces.
      </ConfirmDialog>

      <Toast message={notice} />
    </div>
  );
}

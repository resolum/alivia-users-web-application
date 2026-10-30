import { useEffect, useState, type FormEvent } from 'react';
import { BellRing, Check, Clock, Plus } from 'lucide-react';
import { addDays, formatDateTime, formatTime, toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import {
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  PageHeader,
  SampleDataNotice,
  SkeletonRows,
  StatusDot,
  Toast,
  inputBase,
  useToast,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { loadAssistedPerson } from '../../application/assistance.store.ts';
import {
  isCoordinationSample,
  loadAdministrations,
  loadMedications,
  recordAdministration,
} from '../../application/care-coordination.store.ts';
import { RecordAdministrationCommand, type MedicationAdministration } from '../../domain/model/medication-administration.entity.ts';
import type { MedicationSchedule } from '../../domain/model/medication-schedule.entity.ts';
import { ADMINISTRATION_STATE, FREQUENCY_LABELS, formatSince } from '../assistance-labels.ts';
import { MedicationChangeDrawer, type MedicationChange } from '../components/MedicationChangeDrawer.tsx';
import { MedicationFormDrawer } from '../components/MedicationFormDrawer.tsx';
import { useCareActor } from '../useCareActor.ts';

type Tab = 'today' | 'plans' | 'history';

const TABS: readonly { id: Tab; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'plans', label: 'Programación' },
  { id: 'history', label: 'Historial' },
];

const HISTORY_DAYS = 14;

const SCHEDULE_STATUS = {
  active: { label: 'Vigente', tone: 'success' },
  suspended: { label: 'Suspendida', tone: 'danger' },
  finished: { label: 'Finalizada', tone: 'neutral' },
  upcoming: { label: 'Por iniciar', tone: 'info' },
} as const;

function ResultLine({ item }: { readonly item: MedicationAdministration }) {
  if (!item.recordedAt) return null;
  return (
    <p className="text-sm text-alivia-text-muted">
      {item.result === 'given' ? 'Administrado' : 'Omitido'} a las {formatTime(item.recordedAt)} por {item.recordedByName}
      {item.isLate && ' · registro tardío'}
      {item.reason && <span className="block">Motivo: {item.reason}</span>}
    </p>
  );
}

export function MedicationsView() {
  useDocumentTitle('Medicamentos');
  const { network, actor, status: actorStatus, retry: retryActor } = useCareActor();
  const person = useLoad(loadAssistedPerson, []);
  const [tab, setTab] = useState<Tab>('today');
  const [now, setNow] = useState(() => new Date());
  const [creating, setCreating] = useState(false);
  const [change, setChange] = useState<MedicationChange | null>(null);
  const [omitting, setOmitting] = useState<MedicationAdministration | null>(null);
  const [reason, setReason] = useState('');
  const [reasonMissing, setReasonMissing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, notify] = useToast();

  const plans = useLoad(loadMedications, []);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const doses = useLoad(() => loadAdministrations(addDays(today, -HISTORY_DAYS), today), [toIsoDate(today)]);

  // A dose turns overdue when its window closes; the minute tick re-evaluates it.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const canManage = actor?.can('manage_medications') ?? false;
  const canRecord = actor?.can('record_medications') ?? false;
  // Only those who schedule or give medications see the verifiable history.
  const canSeeHistory = canManage || canRecord;
  const tabs = TABS.filter((item) => item.id !== 'history' || canSeeHistory);
  const all = doses.state.status === 'ready' ? doses.state.data : [];
  const isToday = (item: MedicationAdministration) => toIsoDate(new Date(item.scheduledAt)) === toIsoDate(today);
  // Earlier doses that lapsed without a result stay here until someone records them, late.
  const todays = all
    .filter((item) => isToday(item) || item.stateAt(now) === 'overdue')
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const overdue = all.filter((item) => item.stateAt(now) === 'overdue');
  const history = all.filter((item) => new Date(item.scheduledAt) <= now).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  const replace = (item: MedicationAdministration) => {
    if (doses.state.status === 'ready') doses.setData(doses.state.data.map((dose) => (dose.id === item.id ? item : dose)));
  };

  const record = async (item: MedicationAdministration, result: 'given' | 'omitted', why = '') => {
    if (!actor) return;
    setBusyId(item.id);
    try {
      const outcome = await recordAdministration(new RecordAdministrationCommand(item.id, result, why), actor);
      replace(outcome.administration);
      const saved = outcome.administration;
      notify(
        outcome.status === 'duplicate'
          ? `Ya estaba registrado: ${saved.result === 'given' ? 'administrado' : 'omitido'} por ${saved.recordedByName}.`
          : `${item.medication} ${result === 'given' ? 'registrado como administrado' : 'registrado como omitido'}${saved.isLate ? ' (tardío)' : ''}`,
      );
      setOmitting(null);
    } catch {
      notify('No se registró: verifica que tengas permiso e inténtalo de nuevo.');
    } finally {
      setBusyId(null);
    }
  };

  const submitOmission = (event: FormEvent) => {
    event.preventDefault();
    if (!omitting) return;
    if (reason.trim() === '') {
      setReasonMissing(true);
      return;
    }
    void record(omitting, 'omitted', reason);
  };

  const replacePlan = (schedule: MedicationSchedule, message: string) => {
    if (plans.state.status === 'ready') {
      const rest = plans.state.data.filter((item) => item.id !== schedule.id);
      plans.setData([schedule, ...rest]);
    }
    doses.reload();
    notify(message);
  };

  const loading = actorStatus === 'loading' || plans.state.status === 'loading' || doses.state.status === 'loading';
  const failed = actorStatus === 'error' || plans.state.status === 'error' || doses.state.status === 'error';

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        crumb="Medicamentos"
        title="Medicamentos"
        subtitle="Programación y registro de las administraciones ya indicadas."
        actions={
          canManage && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Programar medicamento
            </Button>
          )
        }
      />
      {isCoordinationSample() && <SampleDataNotice />}

      <div role="tablist" aria-label="Secciones de medicamentos" className="flex self-start rounded-xl bg-alivia-primary-mist/70 p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            id={`tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            onClick={() => setTab(item.id)}
            className={[
              'min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors duration-150',
              tab === item.id ? 'bg-alivia-primary-dark text-white' : 'text-alivia-primary-dark hover:bg-white/70',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <SkeletonRows label="Cargando medicamentos…" rows={4} />}
      {failed && (
        <ErrorState
          title="No pudimos cargar los medicamentos"
          message="Revisa tu conexión e inténtalo de nuevo."
          onRetry={() => {
            retryActor();
            plans.retry();
            doses.retry();
          }}
        />
      )}

      {!loading && !failed && actor && network && tab === 'today' && (
        <section id="panel-today" role="tabpanel" aria-labelledby="tab-today" className="flex flex-col gap-4">
          {overdue.length > 0 && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-alivia-danger/30 bg-alivia-danger/5 px-4 py-3 text-sm">
              <BellRing className="mt-0.5 size-5 shrink-0 text-alivia-danger" aria-hidden="true" />
              <p className="text-alivia-text">
                <strong>{overdue.length === 1 ? 'Una administración venció' : `${overdue.length} administraciones vencieron`} sin confirmación.</strong>{' '}
                Se avisó a sus responsables. Registra el resultado para cerrar la alerta.
              </p>
            </div>
          )}
          {!canRecord && <p className="text-sm text-alivia-text-muted">Puedes consultar las administraciones, pero no tienes permiso para registrarlas.</p>}
          {todays.length === 0 ? (
            <EmptyState title="No hay medicamentos programados para hoy" />
          ) : (
            <ul className="divide-y divide-alivia-primary-mist overflow-hidden rounded-2xl border border-alivia-primary-mist bg-white">
              {todays.map((item) => {
                const state = item.stateAt(now);
                const label = ADMINISTRATION_STATE[state];
                return (
                  <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                    <span className="w-20 shrink-0 text-lg font-bold text-alivia-primary-dark tabular-nums">
                      {formatTime(item.scheduledAt)}
                      {!isToday(item) && (
                        <span className="block text-xs font-semibold text-alivia-danger">
                          {new Date(item.scheduledAt).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1 basis-56">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-alivia-text">
                        {item.medication} · {item.dose}
                        <StatusDot tone={label.tone}>{label.label}</StatusDot>
                        {item.isLate && <StatusDot tone="warning">Tardío</StatusDot>}
                      </p>
                      <p className="text-sm text-alivia-text-muted">Responsable: {item.responsibleName}</p>
                      <ResultLine item={item} />
                    </div>
                    {!item.isFinal && canRecord && (
                      <div className="ml-auto flex flex-wrap gap-2">
                        <Button variant="outline" disabled={busyId !== null} onClick={() => { setReason(''); setReasonMissing(false); setOmitting(item); }}>
                          Registrar omisión
                        </Button>
                        <Button loading={busyId === item.id} disabled={busyId !== null} onClick={() => record(item, 'given')}>
                          <Check className="size-4" aria-hidden="true" />
                          Confirmar
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {!loading && !failed && actor && network && tab === 'plans' && plans.state.status === 'ready' && (
        <section id="panel-plans" role="tabpanel" aria-labelledby="tab-plans" className="flex flex-col gap-4">
          {plans.state.data.length === 0 && (
            <EmptyState title="No hay medicamentos programados" description="Registra los que ya fueron indicados para coordinar quién los da." />
          )}
          {plans.state.data.map((plan) => {
            const status = SCHEDULE_STATUS[plan.statusOn(toIsoDate(now))];
            const current = plan.revisionOn(toIsoDate(now));
            const upcoming = plan.latest !== current && plan.latest.effectiveFrom > toIsoDate(now) ? plan.latest : null;
            return (
              <article key={plan.id} className="rounded-2xl border border-alivia-primary-mist bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-alivia-primary-dark">
                      {plan.medication}
                      <StatusDot tone={status.tone}>{status.label}</StatusDot>
                    </h2>
                    <p className="text-sm text-alivia-text">
                      {current.dose} · {FREQUENCY_LABELS[current.frequency]} · {current.times.join(', ')}
                    </p>
                    {upcoming && (
                      <p className="text-sm font-semibold text-alivia-primary-mid">
                        Desde el {formatSince(upcoming.effectiveFrom)}: {upcoming.dose} · {FREQUENCY_LABELS[upcoming.frequency]} · {upcoming.times.join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-alivia-text-muted">
                      Vigencia: {formatSince(plan.startDate)} {plan.endDate ? `al ${formatSince(plan.endDate)}` : 'sin fecha de fin'} · Responsable: {plan.caregiverName}
                    </p>
                  </div>
                  {canManage && plan.statusOn(toIsoDate(now)) !== 'suspended' && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="soft" onClick={() => setChange({ schedule: plan, mode: 'update' })}>
                        Nueva indicación
                      </Button>
                      <Button variant="ghost" onClick={() => setChange({ schedule: plan, mode: 'responsible' })}>
                        Cambiar responsable
                      </Button>
                      <Button variant="ghost" className="text-alivia-danger" onClick={() => setChange({ schedule: plan, mode: 'suspend' })}>
                        Suspender
                      </Button>
                    </div>
                  )}
                </div>
                <details className="mt-3 text-sm">
                  <summary className="min-h-11 cursor-pointer content-center font-semibold text-alivia-primary-mid">Historial de la programación</summary>
                  <ol className="mt-2 flex flex-col gap-2 border-l-2 border-alivia-primary-mist pl-4">
                    {plan.suspension && (
                      <li>
                        <p className="font-semibold text-alivia-danger">Suspendida desde el {formatSince(plan.suspension.from)}</p>
                        <p className="text-alivia-text-muted">
                          {plan.suspension.source} · registró {plan.suspension.recordedByName}
                        </p>
                      </li>
                    )}
                    {[...plan.revisions].reverse().map((revision) => (
                      <li key={`${revision.effectiveFrom}-${revision.recordedAt}`}>
                        <p className="font-semibold text-alivia-text">
                          Desde el {formatSince(revision.effectiveFrom)}: {revision.dose}, {FREQUENCY_LABELS[revision.frequency].toLowerCase()}, {revision.times.join(', ')}
                        </p>
                        <p className="text-alivia-text-muted">
                          {revision.indicationRef} · registró {revision.recordedByName}
                        </p>
                      </li>
                    ))}
                  </ol>
                </details>
              </article>
            );
          })}
        </section>
      )}

      {!loading && !failed && tab === 'history' && canSeeHistory && (
        <section id="panel-history" role="tabpanel" aria-labelledby="tab-history">
          {history.length === 0 ? (
            <EmptyState title="Aún no hay administraciones registradas" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-alivia-primary-mist bg-white">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <caption className="sr-only">Administraciones de los últimos {HISTORY_DAYS} días</caption>
                <thead className="bg-alivia-page text-alivia-text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Medicamento</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Programado</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Real</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Responsable</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Registró</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-alivia-primary-mist">
                  {history.map((item) => {
                    const label = ADMINISTRATION_STATE[item.stateAt(now)];
                    return (
                      <tr key={item.id} className="align-top">
                        <td className="px-4 py-3 font-semibold text-alivia-text">
                          {item.medication}
                          <span className="block text-xs font-normal text-alivia-text-muted">{item.dose}</span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{formatDateTime(item.scheduledAt)}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {item.recordedAt ? formatDateTime(item.recordedAt) : '—'}
                          {item.isLate && <span className="block text-xs font-semibold text-alivia-warning">Tardío</span>}
                        </td>
                        <td className="px-4 py-3">{item.responsibleName}</td>
                        <td className="px-4 py-3">{item.recordedByName ?? '—'}</td>
                        <td className="px-4 py-3">
                          <StatusDot tone={label.tone}>{label.label}</StatusDot>
                          {item.reason && <span className="mt-1 block text-xs text-alivia-text-muted">{item.reason}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {network && actor && (
        <>
          <MedicationFormDrawer
            open={creating}
            network={network}
            actor={actor}
            assistedPersonId={person.state.status === 'ready' ? person.state.data.id : ''}
            onClose={() => setCreating(false)}
            onSaved={(schedule) => replacePlan(schedule, `${schedule.medication} programado`)}
          />
          <MedicationChangeDrawer
            change={change}
            actor={actor}
            network={network}
            onClose={() => setChange(null)}
            onSaved={(schedule, message) => {
              setChange(null);
              replacePlan(schedule, message);
            }}
          />
        </>
      )}

      <Drawer
        open={omitting !== null}
        onClose={() => setOmitting(null)}
        title="Registrar omisión"
        description={omitting ? `${omitting.medication} ${omitting.dose} de las ${formatTime(omitting.scheduledAt)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOmitting(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="omission-form" loading={busyId !== null}>
              Registrar omisión
            </Button>
          </>
        }
      >
        <form id="omission-form" noValidate onSubmit={submitOmission} className="flex flex-col gap-4">
          <Field id="omission-reason" label="Motivo" required error={reasonMissing ? 'Indica por qué no se administró.' : null}>
            {(describedBy) => (
              <textarea
                id="omission-reason"
                rows={4}
                maxLength={250}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                aria-describedby={describedBy}
                aria-invalid={reasonMissing}
                className={`${inputBase} resize-y`}
              />
            )}
          </Field>
          <p className="flex items-center gap-2 text-xs text-alivia-hint">
            <Clock className="size-3.5" aria-hidden="true" />
            Se guardará con la hora real del registro.
          </p>
        </form>
      </Drawer>

      <Toast message={notice} />
    </div>
  );
}

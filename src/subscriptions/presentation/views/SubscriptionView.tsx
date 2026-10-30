import { useState, type ReactNode } from 'react';
import { CalendarClock, Check, DoorOpen, Download, Radio } from 'lucide-react';
import {
  Bone,
  Button,
  ConfirmDialog,
  ErrorState,
  PageHeader,
  SampleDataNotice,
  Skeleton,
  StatusDot,
  Toast,
  useToast,
  type StatusTone,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { changeSubscriptionStatus, isSubscriptionSample, loadSubscription } from '../../application/subscription.store.ts';
import type { Subscription, SubscriptionStatus } from '../../domain/model/subscription.entity.ts';
import { PlansDrawer } from '../components/PlansDrawer.tsx';

const STATUS: Record<SubscriptionStatus, { label: string; tone: StatusTone }> = {
  active: { label: 'Activa', tone: 'success' },
  suspended: { label: 'Suspendida', tone: 'warning' },
  cancelled: { label: 'Cancelada', tone: 'danger' },
};

const PLAN_NAMES = { MINIMUM: 'Plan Base', CUSTOM: 'Plan Personalizado' } as const;

const formatDay = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

function Line({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 text-sm">
      <dt className="text-alivia-text-muted">{label}</dt>
      <dd className="text-alivia-primary-dark">{children}</dd>
    </div>
  );
}

/** Saves a plain-text receipt of the last payment; the backend has no PDF endpoint yet. */
function downloadReceipt(subscription: Subscription) {
  const payment = subscription.lastPayment;
  if (!payment) return;
  const text = [
    'ALIVIA · Comprobante de pago',
    '',
    `Operación: ${payment.id}`,
    `Plan: ${subscription.planName}`,
    `Monto: ${subscription.currency} ${payment.amount}`,
    `Fecha: ${formatDay(payment.paidAt)}`,
    `Método: ${subscription.paymentMethod.brand} terminada en ${subscription.paymentMethod.last4}`,
    `Titular: ${subscription.paymentMethod.holderName}`,
  ].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: `comprobante-${payment.id}.txt` });
  link.click();
  URL.revokeObjectURL(url);
}

type Pending = 'suspended' | 'cancelled' | 'active' | null;

const CONFIRM: Record<Exclude<Pending, null>, { title: string; body: string; action: string; done: string; danger: boolean }> = {
  suspended: {
    title: '¿Suspender la suscripción?',
    body: 'Los dispositivos dejan de enviar alertas y no se cobra la próxima renovación hasta que la reactives.',
    action: 'Suspender',
    done: 'Suscripción suspendida',
    danger: true,
  },
  cancelled: {
    title: '¿Cancelar la suscripción?',
    body: 'El servicio termina y soporte coordinará el retiro de los dispositivos. Para volver tendrás que contratar de nuevo.',
    action: 'Cancelar suscripción',
    done: 'Suscripción cancelada',
    danger: true,
  },
  active: {
    title: '¿Reactivar la suscripción?',
    body: 'Las alertas vuelven a funcionar y el cobro se retoma en la fecha de renovación.',
    action: 'Reactivar',
    done: 'Suscripción reactivada',
    danger: false,
  },
};

export function SubscriptionView() {
  useDocumentTitle('Suscripción');
  const { state, retry, setData } = useLoad(loadSubscription, []);
  const [plansMode, setPlansMode] = useState<'details' | 'change' | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [notice, notify] = useToast();
  const subscription = state.status === 'ready' ? state.data : null;

  const confirm = async () => {
    if (!subscription || !pending) return;
    setBusy(true);
    try {
      setData(await changeSubscriptionStatus(subscription, pending));
      notify(CONFIRM[pending].done);
    } catch {
      notify('No pudimos actualizar la suscripción. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        crumb="Suscripción"
        title={
          <span className="flex flex-wrap items-center gap-3">
            Suscripción
            {subscription && <StatusDot tone={STATUS[subscription.status].tone}>{STATUS[subscription.status].label}</StatusDot>}
          </span>
        }
        subtitle="Consulta tu plan y administra tus pagos."
        actions={
          subscription?.nextChargeOn && (
            <p className="flex items-center gap-2 rounded-xl border border-alivia-primary-mist bg-white px-3 py-2 text-sm">
              <CalendarClock className="size-4 text-alivia-secondary-deep" aria-hidden="true" />
              <span className="text-alivia-text-muted">Próximo cobro:</span>
              <span className="font-bold text-alivia-primary-dark">
                {formatDay(subscription.nextChargeOn)} · {subscription.currency} {subscription.monthlyAmount}
              </span>
            </p>
          )
        }
      />
      {isSubscriptionSample() && <SampleDataNotice />}

      {state.status === 'loading' && <Skeleton label="Cargando tu suscripción…" className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-5 rounded-2xl border border-alivia-primary-mist bg-white p-6">
            <div className="flex justify-between gap-4 border-b border-alivia-primary-mist pb-5">
              <div className="space-y-2">
                <Bone className="h-3 w-20" />
                <Bone className="h-7 w-36" />
              </div>
              <Bone className="h-9 w-24" />
            </div>
            <Bone className="h-3.5 w-full" />
            <Bone className="h-3.5 w-5/6" />
            <Bone className="h-20 w-full rounded-xl" />
            <Bone className="h-11 w-32 rounded-lg" />
          </div>
          <div className="space-y-4 self-start rounded-2xl border border-alivia-primary-mist bg-white p-6">
            <Bone className="h-6 w-56" />
            <Bone className="h-28 w-full rounded-xl" />
            <Bone className="h-3.5 w-2/3" />
            <Bone className="h-3.5 w-1/2" />
          </div>
        </Skeleton>}
      {state.status === 'error' && (
        <ErrorState title="No pudimos cargar tu suscripción" message="Revisa tu conexión e inténtalo de nuevo." onRetry={retry} />
      )}

      {subscription && (
        <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          <section className="flex flex-col gap-5 rounded-2xl border border-alivia-primary-mist bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-alivia-primary-mist pb-5">
              <div>
                <p className="text-xs font-bold tracking-wide text-alivia-text-muted uppercase">Tu plan</p>
                <h2 className="text-2xl font-bold text-alivia-primary-dark">{subscription.planName}</h2>
              </div>
              <p className="text-right">
                <span className="text-3xl font-bold text-alivia-primary-dark tabular-nums">
                  {subscription.currency} {subscription.monthlyAmount}
                </span>
                <span className="block text-sm text-alivia-text-muted">al mes</span>
              </p>
            </div>

            <dl className="space-y-2">
              <Line label="Fecha de inicio">{formatDay(subscription.startedOn)}</Line>
              <Line label={subscription.status === 'active' ? 'Próxima renovación' : 'Renovación'}>
                {subscription.status === 'active' ? formatDay(subscription.renewsOn) : 'En pausa'}
              </Line>
            </dl>

            {subscription.pendingPlanCode && (
              <p className="rounded-xl bg-alivia-warning-soft px-4 py-3 text-sm text-alivia-warning">
                Pasarás a <strong>{PLAN_NAMES[subscription.pendingPlanCode]}</strong> en la renovación del{' '}
                {formatDay(subscription.renewsOn)}.
              </p>
            )}

            <div className="rounded-xl bg-alivia-primary-mist/60 p-4">
              <p className="text-xs font-bold tracking-wide text-alivia-text-muted uppercase">Cobertura incluida</p>
              <ul className="mt-2 flex flex-wrap gap-2 text-sm font-semibold text-alivia-primary-dark">
                <li className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1">
                  <DoorOpen className="size-4" aria-hidden="true" />
                  {subscription.rooms} {subscription.rooms === 1 ? 'habitación' : 'habitaciones'}
                </li>
                <li className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1">
                  <Radio className="size-4 text-alivia-secondary-deep" aria-hidden="true" />
                  {subscription.devices} {subscription.devices === 1 ? 'dispositivo' : 'dispositivos'}
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setPlansMode('change')} disabled={subscription.status !== 'active'}>
                Cambiar plan
              </Button>
              <Button variant="ghost" onClick={() => setPlansMode('details')} className="text-alivia-primary-dark">
                Ver detalles del plan
              </Button>
            </div>

            {subscription.status !== 'cancelled' && (
              <div className="border-t border-alivia-primary-mist pt-4">
                <p className="text-xs font-bold tracking-wide text-alivia-text-muted uppercase">Administrar suscripción</p>
                <div className="mt-1 flex flex-wrap gap-x-2">
                  {subscription.status === 'active' ? (
                    <Button variant="ghost" onClick={() => setPending('suspended')} className="px-2 text-alivia-text">
                      Suspender suscripción
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={() => setPending('active')} className="px-2 text-alivia-secondary-deep">
                      Reactivar suscripción
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setPending('cancelled')} className="px-2 text-alivia-danger">
                    Cancelar suscripción
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-5 self-start rounded-2xl border border-alivia-primary-mist bg-white p-5 sm:p-6">
            <h2 className="text-xl font-bold text-alivia-primary-dark">Facturación y medio de pago</h2>
            <div className="rounded-xl border border-alivia-primary-mist p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-alivia-primary-mist px-2 py-0.5 text-xs font-bold tracking-wide text-alivia-primary-dark">
                  {subscription.paymentMethod.brand}
                </span>
                <span className="text-sm font-semibold text-alivia-primary-dark">Terminada en {subscription.paymentMethod.last4}</span>
                {subscription.paymentMethod.autoCharge && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-alivia-mint px-2.5 py-0.5 text-xs font-semibold text-alivia-secondary-deep">
                    <Check className="size-3.5" aria-hidden="true" />
                    Cobro automático
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-alivia-text">Titular: {subscription.paymentMethod.holderName}</p>
              <p className="mt-3 border-t border-alivia-primary-mist pt-3 text-xs text-alivia-hint">
                Actualizar la tarjeta estará disponible próximamente. Mientras tanto, pídelo a soporte desde Incidencias.
              </p>
            </div>
            <p className="-mt-2 text-xs text-alivia-text-muted">Pagos procesados por Stripe.</p>

            {subscription.lastPayment ? (
              <div className="border-t border-alivia-primary-mist pt-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold tracking-wide text-alivia-text-muted uppercase">Último pago</p>
                  <StatusDot tone={subscription.lastPayment.status === 'paid' ? 'success' : 'danger'}>
                    {subscription.lastPayment.status === 'paid' ? 'Pagado' : 'Rechazado'}
                  </StatusDot>
                </div>
                <dl className="mt-3 space-y-2">
                  <div className="flex justify-between text-lg font-bold text-alivia-primary-dark">
                    <dt>Monto</dt>
                    <dd className="tabular-nums">
                      {subscription.currency} {subscription.lastPayment.amount}
                    </dd>
                  </div>
                  <Line label="Fecha">{formatDay(subscription.lastPayment.paidAt)}</Line>
                  <Line label="Método">
                    {subscription.paymentMethod.brand} terminada en {subscription.paymentMethod.last4}
                  </Line>
                </dl>
                <Button variant="ghost" onClick={() => downloadReceipt(subscription)} className="mt-2 -ml-4 text-alivia-secondary-deep">
                  <Download className="size-4" aria-hidden="true" />
                  Descargar comprobante
                </Button>
              </div>
            ) : (
              <p className="border-t border-alivia-primary-mist pt-4 text-sm text-alivia-text-muted">Aún no se registra ningún pago.</p>
            )}
          </section>

          <PlansDrawer
            mode={plansMode}
            subscription={subscription}
            onClose={() => setPlansMode(null)}
            onChanged={(saved, plan) => {
              setData(saved);
              setPlansMode(null);
              notify(`Cambio a ${plan.name} solicitado para la próxima renovación`);
            }}
          />
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={pending ? CONFIRM[pending].title : ''}
        confirmLabel={pending ? CONFIRM[pending].action : ''}
        danger={pending ? CONFIRM[pending].danger : false}
        busy={busy}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      >
        {pending && CONFIRM[pending].body}
      </ConfirmDialog>

      <Toast message={notice} />
    </div>
  );
}

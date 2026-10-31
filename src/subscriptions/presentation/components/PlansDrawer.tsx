import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import {
  Button,
  Drawer,
  ErrorState,
  SkeletonRows,
  StatusDot,
} from '@/shared/presentation/components/ui/index.ts';
import { loadActivePlans } from '../../application/plan-catalog.store.ts';
import { requestPlanChange } from '../../application/subscription.store.ts';
import type { Plan } from '../../domain/model/plan.entity.ts';
import type { Subscription } from '../../domain/model/subscription.entity.ts';

type CatalogState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; plans: readonly Plan[] };

interface PlansDrawerProps {
  /** details: what the current plan includes; change: pick another plan. */
  readonly mode: 'details' | 'change' | null;
  readonly subscription: Subscription;
  readonly onClose: () => void;
  readonly onChanged: (subscription: Subscription, plan: Plan) => void;
}

/** Plans come from the real catalog; the change is applied on the next renewal. */
export function PlansDrawer({ mode, subscription, onClose, onChanged }: PlansDrawerProps) {
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (mode === null) return;
    let active = true;
    loadActivePlans().then(
      (plans) => active && setCatalog({ status: 'ready', plans }),
      () => active && setCatalog({ status: 'error' }),
    );
    return () => {
      active = false;
    };
  }, [mode, attempt]);

  const choose = async (plan: Plan) => {
    setSavingCode(plan.code);
    setFailed(false);
    try {
      onChanged(await requestPlanChange(subscription, plan.code), plan);
    } catch {
      setFailed(true);
    } finally {
      setSavingCode(null);
    }
  };

  const plans = catalog.status === 'ready' ? catalog.plans : [];
  const shown = mode === 'details' ? plans.filter((plan) => plan.code === subscription.planCode) : plans;

  return (
    <Drawer
      open={mode !== null}
      onClose={onClose}
      title={mode === 'change' ? 'Cambiar plan' : subscription.planName}
      description={
        mode === 'change'
          ? `El cambio se aplica en la próxima renovación. Hasta entonces sigues con ${subscription.planName}.`
          : 'Lo que incluye tu plan actual.'
      }
      footer={
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {catalog.status === 'loading' && <SkeletonRows label="Cargando planes…" rows={2} />}
      {catalog.status === 'error' && (
        <ErrorState
          title="No pudimos cargar los planes"
          message="Revisa tu conexión e inténtalo de nuevo."
          onRetry={() => {
            setCatalog({ status: 'loading' });
            setAttempt((count) => count + 1);
          }}
        />
      )}
      {catalog.status === 'ready' && (
        <div className="flex flex-col gap-4">
          {mode === 'details' && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-alivia-page p-3">
                <dt className="text-xs text-alivia-text-muted">Habitaciones</dt>
                <dd className="text-lg font-bold text-alivia-primary-dark">{subscription.rooms}</dd>
              </div>
              <div className="rounded-xl bg-alivia-page p-3">
                <dt className="text-xs text-alivia-text-muted">Dispositivos</dt>
                <dd className="text-lg font-bold text-alivia-primary-dark">{subscription.devices}</dd>
              </div>
            </dl>
          )}
          {shown.length === 0 && (
            <p className="text-sm text-alivia-text-muted">El catálogo no tiene información de este plan por ahora.</p>
          )}
          {shown.map((plan) => {
            const current = plan.code === subscription.planCode;
            const pending = plan.code === subscription.pendingPlanCode;
            return (
              <section
                key={plan.code}
                className={`rounded-2xl border p-4 ${current ? 'border-alivia-primary-light bg-alivia-page/60' : 'border-alivia-primary-mist'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-alivia-primary-dark">{plan.name}</h3>
                    <p className="text-sm text-alivia-text-muted">{plan.description}</p>
                  </div>
                  <p className="text-right">
                    <span className="text-xl font-bold text-alivia-primary-dark">
                      {plan.currency === 'PEN' ? 'S/' : plan.currency} {plan.minimumMonthlyAmount}
                    </span>
                    <span className="block text-xs text-alivia-text-muted">{plan.priceQualifier || 'al mes'}</span>
                  </p>
                </div>
                {plan.features.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-sm text-alivia-text">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-alivia-secondary-deep" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                {mode === 'change' && (
                  <div className="mt-4">
                    {current ? (
                      <StatusDot tone="info">Tu plan actual</StatusDot>
                    ) : pending ? (
                      <StatusDot tone="warning">Cambio solicitado</StatusDot>
                    ) : (
                      <Button
                        onClick={() => choose(plan)}
                        loading={savingCode === plan.code}
                        disabled={savingCode !== null || !subscription.canChangePlanTo(plan.code)}
                      >
                        Cambiar a {plan.name}
                      </Button>
                    )}
                  </div>
                )}
              </section>
            );
          })}
          {failed && (
            <p role="alert" className="rounded-lg bg-alivia-danger/10 px-3 py-2 text-sm text-alivia-danger">
              No pudimos registrar el cambio. Inténtalo de nuevo.
            </p>
          )}
        </div>
      )}
    </Drawer>
  );
}

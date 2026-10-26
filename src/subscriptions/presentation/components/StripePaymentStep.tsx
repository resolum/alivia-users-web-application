import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe, type StripeElementStyle } from '@stripe/stripe-js';
import { useNavigate } from 'react-router';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import {
  completePaymentMethodSetup,
  preparePaymentMethod,
  refreshPreauthorization,
  requestPreauthorization,
} from '../../application/payment-authorization.store.ts';
import type { HomeConfiguration } from '../../domain/model/home-configuration.ts';
import type { PaymentSetup, Preauthorization } from '../../domain/model/payment-authorization.ts';

interface StripeFormProps {
  readonly configuration: HomeConfiguration;
  readonly setup: PaymentSetup;
  readonly onAuthorized: (authorization: Preauthorization) => void;
}

const cardStyle: StripeElementStyle = {
  base: {
    color: '#172033',
    fontFamily: 'inherit',
    fontSize: '16px',
    '::placeholder': { color: '#94a3b8' },
  },
  invalid: { color: '#b91c1c' },
};

const fieldClassName = 'rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-colors [&.StripeElement--focus]:border-alivia-primary [&.StripeElement--invalid]:border-red-400';
const inputClassName = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-[#172033] outline-none transition-colors placeholder:text-slate-400 focus:border-alivia-primary';
const labelClassName = 'mb-1.5 block text-xs font-bold tracking-wide text-slate-500';

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos completar la preautorización. Inténtalo nuevamente.';
}

function StripeForm({ configuration, setup, onAuthorized }: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [cardholderName, setCardholderName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (stripe === null || elements === null || !accepted || submitting) return;
    if (cardholderName.trim() === '' || billingEmail.trim() === '') {
      setError('Ingresa el nombre del titular y el correo de facturación.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const card = elements.getElement(CardNumberElement);
      if (card === null) throw new Error('El formulario seguro de tarjeta aún no está listo.');

      const setupResult = await stripe.confirmCardSetup(setup.clientSecret, {
        payment_method: {
          card,
          billing_details: { name: cardholderName.trim(), email: billingEmail.trim() },
        },
      });
      if (setupResult.error !== undefined) throw new Error(setupResult.error.message);

      const paymentMethod = setupResult.setupIntent?.payment_method;
      const paymentMethodId = typeof paymentMethod === 'string' ? paymentMethod : paymentMethod?.id;
      if (paymentMethodId === undefined) throw new Error('Stripe no devolvió el método de pago registrado.');
      completePaymentMethodSetup(configuration.draftId);

      let authorization = await requestPreauthorization(configuration, paymentMethodId);
      if (authorization.needsCustomerAction && authorization.clientSecret !== null) {
        const action = await stripe.handleNextAction({ clientSecret: authorization.clientSecret });
        if (action.error !== undefined) throw new Error(action.error.message);
        authorization = await refreshPreauthorization(configuration.draftId);
      }
      if (!authorization.isHeld) {
        throw new Error('Stripe todavía no confirmó la retención temporal. Puedes volver a intentarlo sin duplicar la operación.');
      }
      onAuthorized(authorization);
    } catch (reason) {
      setError(messageFrom(reason));
    } finally {
      setSubmitting(false);
    }
  };

  return <form onSubmit={submit} className="mt-6">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="cardholder-name" className={labelClassName}>Nombre del titular de la tarjeta</label>
        <input
          id="cardholder-name"
          type="text"
          autoComplete="cc-name"
          required
          value={cardholderName}
          onChange={(event) => setCardholderName(event.target.value)}
          placeholder="Como aparece en la tarjeta"
          className={inputClassName}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClassName}>Número de tarjeta</label>
        <CardNumberElement className={fieldClassName} options={{ style: cardStyle, showIcon: true, disableLink: true }} />
      </div>
      <div>
        <label className={labelClassName}>Fecha de vencimiento</label>
        <CardExpiryElement className={fieldClassName} options={{ style: cardStyle }} />
      </div>
      <div>
        <label className={labelClassName}>CVC</label>
        <CardCvcElement className={fieldClassName} options={{ style: cardStyle }} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="billing-email" className={labelClassName}>Correo de facturación</label>
        <input
          id="billing-email"
          type="email"
          autoComplete="email"
          required
          value={billingEmail}
          onChange={(event) => setBillingEmail(event.target.value)}
          placeholder="correo@ejemplo.com"
          className={inputClassName}
        />
      </div>
    </div>
    <p className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
      <Lock aria-hidden="true" className="size-3.5" /> Los datos de tu tarjeta son procesados directamente por Stripe.
    </p>

    <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-alivia-text-muted">
      <input
        type="checkbox"
        checked={accepted}
        onChange={(event) => setAccepted(event.target.checked)}
        className="mt-0.5 size-4 accent-alivia-primary"
      />
      <span>Acepto los términos y autorizo una retención temporal. El importe no será capturado hasta completar la evaluación técnica.</span>
    </label>

    {error !== null && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

    <div className="mt-6 flex flex-wrap justify-between gap-3">
      <button type="button" onClick={() => navigate('/contract/configuration/summary')} className="rounded-lg bg-alivia-primary-mist px-5 py-3 text-sm font-bold text-alivia-primary"><ArrowLeft aria-hidden="true" className="mr-1.5 inline size-4 align-[-3px]" />Volver al resumen</button>
      <button type="submit" disabled={stripe === null || !accepted || submitting} className="rounded-lg bg-alivia-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
        {submitting ? 'Autorizando con Stripe…' : 'Autorizar temporalmente'}
      </button>
    </div>
  </form>;
}

function AuthorizedState({ authorization }: { readonly authorization: Preauthorization }) {
  const expiry = authorization.captureBefore === null
    ? null
    : new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(authorization.captureBefore));
  return <section className="mx-auto mt-7 max-w-3xl rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-9">
    <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check aria-hidden="true" className="size-7" /></div>
    <p className="mt-4 text-xs font-extrabold tracking-[0.1em] text-alivia-secondary-deep">PREAUTORIZACIÓN CONFIRMADA</p>
    <h1 className="mt-1 text-3xl font-extrabold text-alivia-primary">Tu tarjeta quedó autorizada</h1>
    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-alivia-text-muted">Stripe registró una retención temporal. No hemos realizado el cobro y la suscripción continúa pendiente hasta la evaluación técnica.</p>
    <div className="mx-auto mt-6 max-w-lg rounded-xl bg-alivia-primary-mist/70 p-4 text-left text-sm">
      <div className="flex justify-between gap-4"><span>Estado</span><strong className="text-emerald-700">Retención activa</strong></div>
      <div className="mt-2 flex justify-between gap-4"><span>Referencia</span><strong>{authorization.stripePaymentIntentId}</strong></div>
      {expiry !== null && <div className="mt-2 flex justify-between gap-4"><span>Capturar antes de</span><strong>{expiry}</strong></div>}
    </div>
    <p className="mt-5 text-xs text-slate-500">El paso de evaluación se habilitará cuando implementemos la confirmación final del proceso.</p>
  </section>;
}

export function StripePaymentStep({ configuration }: { readonly configuration: HomeConfiguration }) {
  const [setup, setSetup] = useState<PaymentSetup | null>(null);
  const [authorization, setAuthorization] = useState<Preauthorization | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void preparePaymentMethod(configuration.draftId)
      .then((value) => { if (active) setSetup(value); })
      .catch((reason: unknown) => { if (active) setError(messageFrom(reason)); });
    return () => { active = false; };
  }, [configuration.draftId]);

  const stripe = useMemo(
    () => setup === null ? null : loadStripe(setup.publishableKey),
    [setup],
  );

  if (authorization !== null) return <AuthorizedState authorization={authorization} />;

  if (error !== null) {
    return <section className="mx-auto mt-7 max-w-2xl rounded-2xl border border-red-200 bg-white p-7 text-center">
      <h1 className="text-2xl font-extrabold text-alivia-primary">No pudimos iniciar Stripe</h1>
      <p className="mt-2 text-sm text-red-700">{error}</p>
      <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-lg bg-alivia-primary px-5 py-3 text-sm font-bold text-white">Reintentar</button>
    </section>;
  }

  if (setup === null || stripe === null) {
    return <div className="grid min-h-80 place-items-center text-sm text-alivia-text-muted">Preparando el formulario seguro de Stripe…</div>;
  }

  const amount = configuration.quote?.totalMonthlyAmount;
  return <section className="mx-auto mt-7 max-w-5xl">
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-8">
        <p className="text-xs font-extrabold tracking-[0.1em] text-alivia-secondary-deep">CONFIGURACIÓN — PAGO</p>
        <h1 className="mt-1 text-3xl font-extrabold text-alivia-primary">Registra tu medio de pago</h1>
        <p className="mt-2 text-sm text-alivia-text-muted">Realizaremos una preautorización temporal. El cobro definitivo se confirmará después de la evaluación.</p>
        <Elements
          stripe={stripe}
          options={{
            clientSecret: setup.clientSecret,
            locale: 'es',
            appearance: {
              theme: 'stripe',
              variables: { colorPrimary: '#123278', borderRadius: '10px', fontFamily: 'inherit' },
            },
          }}
        >
          <StripeForm configuration={configuration} setup={setup} onAuthorized={setAuthorization} />
        </Elements>
      </div>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,42,107,0.05)]">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold text-alivia-primary">{configuration.planCode === 'CUSTOM' ? 'Plan Personalizado' : 'Plan Base'}</h2><span className="shrink-0 rounded-full bg-alivia-primary-mist px-2.5 py-1 text-[0.68rem] font-bold text-alivia-primary">Alivia Hogar</span></div>
        <dl className="mt-4 divide-y divide-slate-100 border-y border-slate-100 text-sm">
          <div className="flex items-center justify-between gap-4 py-3"><dt className="text-alivia-text-muted">Ambientes</dt><dd className="font-bold text-alivia-text">{configuration.rooms.length}</dd></div>
          <div className="flex items-center justify-between gap-4 py-3"><dt className="text-alivia-text-muted">Dispositivos</dt><dd className="font-bold text-alivia-text">{configuration.totalDevices}</dd></div>
          <div className="flex items-center justify-between gap-4 py-3"><dt className="text-alivia-text-muted">Cuota estimada</dt><dd className="font-bold text-alivia-text">{amount === undefined ? '—' : <>S/ {amount} <span className="font-medium text-alivia-text-muted">/mes</span></>}</dd></div>
        </dl>
        <div className="mt-5 rounded-xl bg-alivia-primary-mist/70 p-5">
          <p className="text-[0.68rem] font-bold tracking-[0.08em] text-slate-500">AUTORIZACIÓN TEMPORAL</p>
          <div className="mt-3 flex items-baseline justify-between gap-4"><span className="text-sm text-alivia-text">Retención estimada</span><strong className="text-2xl font-extrabold text-alivia-primary">{amount === undefined ? '—' : `S/ ${amount}`}</strong></div>
          <p className="mt-4 border-t border-alivia-primary/10 pt-3 text-xs leading-5 text-alivia-text-muted">No es un cobro. Se liberará si la contratación no continúa.</p>
        </div>
      </aside>
    </div>
  </section>;
}

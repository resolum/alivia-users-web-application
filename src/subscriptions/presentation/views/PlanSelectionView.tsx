import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { loadActivePlans, selectPreliminaryPlan } from '../../application/plan-catalog.store.ts';
import type { BillingPeriod, Plan } from '../../domain/model/plan.entity.ts';
import { readPlanSelection } from '../../infrastructure/plan-selection.storage.ts';
import { ContractBrand } from '../components/ContractBrand.tsx';
import { ContractProgress } from '../components/ContractProgress.tsx';
import { PlanCard } from '../components/PlanCard.tsx';

type CatalogState =
  | { readonly status: 'loading'; readonly plans: readonly Plan[] }
  | { readonly status: 'ready'; readonly plans: readonly Plan[] }
  | { readonly status: 'error'; readonly plans: readonly Plan[] };

export function PlanSelectionView() {
  const navigate = useNavigate();
  const storedSelection = readPlanSelection();
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading', plans: [] });
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(storedSelection?.billingPeriod ?? 'MONTHLY');
  const [pendingCode, setPendingCode] = useState<Plan['code'] | null>(null);
  const [selectedCode, setSelectedCode] = useState<Plan['code'] | null>(storedSelection?.planCode ?? null);
  const [selectionError, setSelectionError] = useState(false);

  const refresh = () => {
    setCatalog({ status: 'loading', plans: [] });
    void loadActivePlans()
      .then((plans) => setCatalog({ status: 'ready', plans }))
      .catch(() => setCatalog({ status: 'error', plans: [] }));
  };

  useEffect(() => {
    let active = true;
    void loadActivePlans()
      .then((plans) => {
        if (active) setCatalog({ status: 'ready', plans });
      })
      .catch(() => {
        if (active) setCatalog({ status: 'error', plans: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSelect = (plan: Plan) => {
    setPendingCode(plan.code);
    setSelectionError(false);
    void selectPreliminaryPlan(plan.code, billingPeriod)
      .then(() => {
        setSelectedCode(plan.code);
        void navigate(plan.code === 'MINIMUM' ? '/contract/configuration/summary' : '/contract/configuration/rooms');
      })
      .catch(() => {
        setSelectionError(true);
        refresh();
      })
      .finally(() => setPendingCode(null));
  };

  return (
    <div className="min-h-screen bg-[#f7f7fc] text-alivia-text">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <ContractBrand />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">¿Ya tienes una cuenta?</span>
            <Link to="/sign-in" className="font-bold text-alivia-primary hover:underline">Iniciar sesión</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-7 lg:px-8 lg:py-10">
        <ContractProgress />

        <section className="mx-auto mt-9 max-w-5xl text-center">
          <p className="text-xs font-bold tracking-[0.12em] text-alivia-secondary-deep">CUIDADO INTELIGENTE PARA TU HOGAR</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-alivia-primary sm:text-4xl">Elige el plan adecuado para tu hogar</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-6 text-alivia-text-muted">
            Selecciona la cobertura que mejor se adapte a las necesidades de autonomía y cuidado de tu familiar.
          </p>

          <div className="mx-auto mt-6 inline-flex rounded-full bg-alivia-primary-mist p-1" role="group" aria-label="Periodicidad de facturación">
            {(['MONTHLY', 'ANNUAL'] as const).map((period) => (
              <button
                key={period}
                type="button"
                aria-pressed={billingPeriod === period}
                onClick={() => {
                  setBillingPeriod(period);
                  setSelectedCode(null);
                }}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${billingPeriod === period ? 'bg-white text-alivia-primary shadow-sm' : 'text-alivia-text-muted'}`}
              >
                {period === 'MONTHLY' ? 'Facturación mensual' : 'Facturación anual'}
                {period === 'ANNUAL' && <span className="ml-2 rounded-full bg-alivia-secondary-light px-2 py-0.5 text-[0.65rem] text-alivia-secondary-deep">Ahorra 2 meses</span>}
              </button>
            ))}
          </div>
        </section>

        {selectionError && (
          <div role="alert" className="mx-auto mt-6 max-w-5xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            El plan seleccionado ya no está disponible. Actualizamos el catálogo con los planes vigentes.
          </div>
        )}

        {selectedCode !== null && !selectionError && (
          <div role="status" aria-live="polite" className="mx-auto mt-6 flex max-w-5xl flex-col gap-2 rounded-xl border border-alivia-secondary bg-alivia-mint px-5 py-4 text-left sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-alivia-secondary-deep"><Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />Selección preliminar guardada</p>
              <p className="mt-1 text-sm text-alivia-text-muted">
                Elegiste el {selectedCode === 'MINIMUM' ? 'Plan Base' : 'Plan Personalizado'} con facturación {billingPeriod === 'MONTHLY' ? 'mensual' : 'anual'}.
              </p>
            </div>
            <p className="text-xs font-semibold text-alivia-primary">La suscripción se activará después de validar la vivienda.</p>
          </div>
        )}

        {catalog.status === 'loading' && (
          <div className="grid min-h-96 place-items-center" role="status">
            <span className="size-10 animate-spin rounded-full border-4 border-alivia-primary-mist border-t-alivia-primary" />
            <span className="sr-only">Cargando planes</span>
          </div>
        )}

        {catalog.status === 'error' && (
          <section className="mx-auto my-16 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-alivia-primary">No pudimos cargar los planes</h2>
            <p className="mt-2 text-sm text-alivia-text-muted">Verifica tu conexión e inténtalo nuevamente.</p>
            <button type="button" onClick={refresh} className="mt-5 rounded-lg bg-alivia-primary px-5 py-2.5 text-sm font-bold text-white">Reintentar</button>
          </section>
        )}

        {catalog.status === 'ready' && (
          <section className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-2" aria-label="Planes disponibles">
            {catalog.plans.map((plan) => (
              <PlanCard
                key={plan.code}
                plan={plan}
                billingPeriod={billingPeriod}
                pending={pendingCode === plan.code}
                selected={selectedCode === plan.code}
                onSelect={handleSelect}
              />
            ))}
          </section>
        )}

        <section className="mx-auto mt-7 grid max-w-5xl overflow-hidden rounded-2xl bg-[#eef2ff] sm:grid-cols-[14rem_1fr]">
          <img src="/casa.png" alt="Hogar adaptado con tecnología Alivia" className="h-48 w-full object-cover sm:h-full" />
          <div className="p-6 sm:p-7">
            <p className="text-xs font-extrabold tracking-[0.1em] text-alivia-secondary-deep">GARANTÍA DE ADAPTACIÓN</p>
            <h2 className="mt-1 text-xl font-extrabold text-alivia-primary">Cuidado seguro que respeta la intimidad</h2>
            <p className="mt-2 text-sm leading-6 text-alivia-text-muted">
              Todos los planes incluyen garantía de devolución y retiro sin costo durante los primeros 7 días si tu familiar no se adapta al servicio. La tecnología de Alivia funciona de forma pasiva sin invadir la privacidad mediante cámaras.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-alivia-secondary-deep">
              <span><Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />Sin permanencia forzosa</span><span><Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />Soporte en Lima Metropolitana</span>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-alivia-text-muted">
          ¿Tienes dudas sobre qué plan necesitas? <a href="mailto:ayuda@alivia.pe" className="font-bold text-alivia-primary underline">Necesito ayuda para elegir</a>
          <span className="mt-1 block text-xs text-slate-400">Atención especializada de lunes a domingo de 7:00 am a 9:00 pm</span>
        </p>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>ALIVIA SALUD © 2026 · Lima Metropolitana, Perú</p>
          <nav className="flex gap-5" aria-label="Enlaces legales"><a href="#terminos">Términos</a><a href="#privacidad">Privacidad</a></nav>
        </div>
      </footer>
    </div>
  );
}

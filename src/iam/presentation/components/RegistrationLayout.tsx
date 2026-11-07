import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ContractingStepper } from '@/shared/presentation/components/contracting-stepper/ContractingStepper.tsx';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

/** Position in the guided contracting flow: 2 = account, 3 = household. */
type RegistrationStep = 2 | 3;

interface RegistrationLayoutProps {
  readonly step: RegistrationStep;
  readonly children: ReactNode;
}

/**
 * Frame of the registration steps of the guided contracting flow. It mirrors
 * the plan and configuration screens so the flow reads as one journey.
 */
export function RegistrationLayout({ step, children }: RegistrationLayoutProps) {
  const t = useIamTranslations();

  return (
    <div className="min-h-dvh bg-[#f7f7fc] text-alivia-text">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-5">
          <Link
            to="/plans"
            className="inline-flex min-h-11 items-center gap-2.5"
            aria-label={t.registration.brandLabel}
          >
            <span className="grid size-9 place-items-center rounded-xl bg-alivia-primary text-sm font-bold text-white">
              A
            </span>
            <span className="text-xl font-extrabold tracking-tight text-alivia-primary">
              Alivia
            </span>
          </Link>
          <p className="flex items-center gap-2 text-sm">
            <span className="hidden text-alivia-text-muted sm:inline">
              {t.registration.haveAccount}
            </span>
            <Link
              to="/sign-in"
              className="inline-flex min-h-11 items-center font-bold text-alivia-primary hover:underline"
            >
              {t.registration.signIn}
            </Link>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-5 sm:py-8">
        <ContractingStepper current={step === 2 ? 'account' : 'household'} planHref="/plans" />
        <section className="mt-5 animate-step-in rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-8">
          {children}
        </section>
      </main>
    </div>
  );
}

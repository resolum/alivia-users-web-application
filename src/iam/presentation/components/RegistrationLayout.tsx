import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Check } from 'lucide-react';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

const STEP_KEYS = ['plan', 'account', 'household', 'configuration', 'evaluation'] as const;

/** Position in the guided contracting flow: 2 = account, 3 = household. */
type RegistrationStep = 2 | 3;

interface RegistrationLayoutProps {
  readonly step: RegistrationStep;
  readonly children: ReactNode;
}

function RegistrationProgress({ step }: { readonly step: RegistrationStep }) {
  const t = useIamTranslations().registration;
  const caption = t.stepOf
    .replace('{current}', String(step))
    .replace('{total}', String(STEP_KEYS.length));

  return (
    <nav
      aria-label={t.progressLabel}
      className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5"
    >
      <ol className="grid grid-cols-5 gap-2">
        {STEP_KEYS.map((key, index) => {
          const position = index + 1;
          const completed = position < step;
          const current = position === step;
          return (
            <li key={key} className="min-w-0" aria-current={current ? 'step' : undefined}>
              <div
                className={`mb-2 h-1 rounded-full ${completed ? 'bg-alivia-primary' : current ? 'bg-alivia-secondary-dark' : 'bg-alivia-primary-mist'}`}
              />
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold ${current ? 'text-alivia-secondary-deep' : completed ? 'text-alivia-primary' : 'text-alivia-text-muted'}`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.65rem] ${current ? 'bg-alivia-secondary text-alivia-primary-dark ring-4 ring-alivia-secondary-light' : completed ? 'bg-alivia-primary text-white' : 'bg-alivia-primary-mist text-alivia-primary'}`}
                >
                  {completed ? <Check aria-hidden="true" className="size-3.5" /> : position}
                </span>
                <span className="hidden truncate sm:block">{t.steps[key]}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs font-semibold text-alivia-primary">
        {t.steps[STEP_KEYS[step - 1]]} · {caption}
      </p>
    </nav>
  );
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
        <RegistrationProgress step={step} />
        <section className="mt-5 animate-step-in rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-8">
          {children}
        </section>
      </main>
    </div>
  );
}

import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { AuthCard } from '../components/AuthCard.tsx';
import { AuthShowcasePanel } from '../components/AuthShowcasePanel.tsx';
import { PortalBadge } from '../components/PortalBadge.tsx';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { SignInForm } from './SignInForm.tsx';

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? '';
const PLANS_URL =
  LANDING_URL.length === 0
    ? ''
    : `${LANDING_URL.endsWith('/') ? LANDING_URL.slice(0, -1) : LANDING_URL}#plans`;

export function SignInView() {
  const t = useIamTranslations();
  useDocumentTitle(t.signIn.title);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-alivia-primary-mist px-4 py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-alivia-secondary-light/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 size-72 rounded-full bg-alivia-primary-light/40 blur-3xl"
      />

      <main className="relative w-full max-w-5xl">
        <AuthCard tone="lavender" className="p-2 sm:p-3">
          <div className="grid overflow-hidden rounded-3xl lg:grid-cols-[1.05fr_0.95fr]">
            <section className="flex flex-col gap-6 bg-white p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <img
                    src="/logo.ico"
                    alt={t.auth.brand}
                    className="h-8 w-auto object-contain"
                  />
                  <p className="text-2xl font-bold tracking-tight text-alivia-primary">
                    {t.auth.brand}
                  </p>
                </div>
                <PortalBadge label={t.auth.portalLabel} withDot />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl leading-tight font-bold text-alivia-primary sm:text-4xl">
                  {t.signIn.title}
                </h1>
                <p className="text-sm text-alivia-text-muted">
                  {t.signIn.subtitle}
                </p>
              </div>

              <SignInForm />

              <p className="mt-auto text-sm text-alivia-text-muted">
                {t.signIn.noAccount}{' '}
                {PLANS_URL ? (
                  <a
                    href={PLANS_URL}
                    className="font-semibold text-alivia-primary-mid underline-offset-4 hover:text-alivia-primary hover:underline"
                  >
                    {t.signIn.plans}
                  </a>
                ) : (
                  <span className="font-semibold text-alivia-primary-mid">
                    {t.signIn.plans}
                  </span>
                )}
              </p>
            </section>

            <AuthShowcasePanel />
          </div>
        </AuthCard>

        <footer className="mt-6 text-center text-xs text-alivia-text-soft">
          {t.auth.footer}
        </footer>
      </main>
    </div>
  );
}

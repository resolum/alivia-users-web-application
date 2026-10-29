import { Link } from 'react-router';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { AuthHeading } from '../components/AuthHeading.tsx';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { SignInForm } from './SignInForm.tsx';

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? '';
const PLANS_URL =
  LANDING_URL.length === 0
    ? ''
    : `${LANDING_URL.endsWith('/') ? LANDING_URL.slice(0, -1) : LANDING_URL}#plans`;

const linkClass =
  'whitespace-nowrap font-semibold text-alivia-primary-mid underline decoration-alivia-primary-light underline-offset-4 transition-colors duration-150 ease-out hover:text-alivia-primary hover:decoration-current';

export function SignInView() {
  const t = useIamTranslations();
  useDocumentTitle(t.signIn.title);

  return (
    <>
      <AuthHeading title={t.signIn.title} description={t.signIn.subtitle} />

      <div className="mt-8 animate-step-in [animation-delay:60ms]">
        <SignInForm />
      </div>

      <p className="mt-8 animate-step-in text-base text-alivia-text-muted [animation-delay:100ms]">
        {t.signIn.noAccount}{' '}
        {PLANS_URL ? (
          <a href={PLANS_URL} className={linkClass}>
            {t.signIn.plans}
          </a>
        ) : (
          <Link to="/plans" className={linkClass}>
            {t.signIn.plans}
          </Link>
        )}
      </p>
    </>
  );
}

import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Check, Eye, EyeOff, Lock } from 'lucide-react';
import { IamError, signIn, SignInCommand } from '@/iam/index.ts';
import {
  Button,
  ErrorState,
  Field,
  inputBase,
  SkeletonDetail,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';
import { answerInvitation, loadInvitation } from '../../application/assistance.store.ts';
import type { Invitation } from '../../domain/model/invitation.ts';
import { RESPONSIBILITY_LABELS } from '../assistance-labels.ts';

const CLOSED_TEXT: Record<Exclude<Invitation['status'], 'active'>, { title: string; body: string }> = {
  expired: {
    title: 'Esta invitación venció',
    body: 'Pide a quien te invitó que te envíe una nueva desde la red de cuidado.',
  },
  accepted: {
    title: 'Ya formas parte de esta red',
    body: 'Inicia sesión para ver las actividades que tienes asignadas.',
  },
  rejected: {
    title: 'Rechazaste esta invitación',
    body: 'No compartiremos ningún dato del hogar contigo. Puedes cerrar esta página.',
  },
};

function signInMessage(error: unknown): string {
  if (error instanceof IamError && error.code === 'invalid_credentials') return 'El correo o la contraseña son incorrectos.';
  return 'No pudimos iniciar sesión. Revisa tu conexión e inténtalo de nuevo.';
}

/** Landing of the invitation e-mail: shows what the household shares and lets the caregiver join. */
export function InvitationView() {
  useDocumentTitle('Invitación a la red de cuidado');
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { status: sessionStatus } = useSession();
  const { state, retry, setData } = useLoad(() => loadInvitation(token), [token]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signedIn = sessionStatus === 'authenticated';

  const accept = async (event: FormEvent, invitation: Invitation) => {
    event.preventDefault();
    setError(null);
    if (!signedIn && password === '') {
      setError('Ingresa tu contraseña para continuar.');
      return;
    }
    setBusy('accept');
    try {
      if (!signedIn) await signIn(new SignInCommand({ emailAddress: invitation.email, password }), false);
      await answerInvitation(token, true);
      void navigate('/home', { replace: true });
    } catch (caught) {
      setError(signInMessage(caught));
      setBusy(null);
    }
  };

  const reject = async () => {
    setBusy('reject');
    try {
      setData(await answerInvitation(token, false));
    } catch {
      setError('No pudimos registrar tu respuesta. Inténtalo de nuevo.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-alivia-page">
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:py-12">
        <div className="w-full max-w-md rounded-3xl border border-alivia-primary-mist bg-white p-6 shadow-sm sm:p-8">
          <p className="text-center text-sm font-bold tracking-wide text-alivia-secondary-deep">alivia</p>

          {state.status === 'loading' && <SkeletonDetail label="Abriendo tu invitación…" rows={3} avatar={false} />}
          {state.status === 'error' && (
            <ErrorState
              title="No encontramos esta invitación"
              message="El enlace puede estar incompleto. Ábrelo de nuevo desde el correo."
              onRetry={retry}
            />
          )}

          {state.status === 'ready' && state.data.status !== 'active' && (
            <div className="mt-6 space-y-3 text-center">
              <h1 className="text-2xl font-bold text-alivia-primary-dark">{CLOSED_TEXT[state.data.status].title}</h1>
              <p className="text-sm text-alivia-text-muted">{CLOSED_TEXT[state.data.status].body}</p>
              {state.data.status === 'accepted' && (
                <Link to="/sign-in" className="inline-flex min-h-11 items-center font-semibold text-alivia-secondary-deep hover:underline">
                  Iniciar sesión
                </Link>
              )}
            </div>
          )}

          {state.status === 'ready' && state.data.status === 'active' && (
            <>
              <header className="mt-6 space-y-1 text-center">
                <h1 className="text-2xl font-bold text-balance text-alivia-primary-dark">Te invitaron a una red de cuidado</h1>
                <p className="text-sm text-alivia-text-muted">Un espacio coordinado para el bienestar en el hogar.</p>
              </header>

              <section className="mt-6 rounded-2xl border border-alivia-primary-mist bg-alivia-page/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-alivia-primary-mist pb-3">
                  <h2 className="text-lg font-bold text-alivia-primary-dark">{state.data.householdAlias}</h2>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-alivia-secondary-deep">
                    Invitación activa
                  </span>
                </div>
                <dl className="space-y-1.5 py-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <dt className="text-alivia-text-muted">Persona asistida</dt>
                    <dd className="font-semibold text-alivia-primary-dark">{state.data.assistedPersonName}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <dt className="text-alivia-text-muted">Invitado por</dt>
                    <dd className="text-alivia-primary-dark">
                      <span className="font-semibold">{state.data.invitedByName}</span> ({state.data.invitedByRelationship})
                    </dd>
                  </div>
                </dl>
                <h3 className="border-t border-alivia-primary-mist pt-3 text-xs font-bold tracking-wide text-alivia-text-muted uppercase">
                  Responsabilidades asignadas
                </h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {state.data.responsibilities.map((item) => (
                    <li key={item} className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs text-alivia-text">
                      <Check className="size-3.5 text-alivia-secondary-deep" aria-hidden="true" />
                      {RESPONSIBILITY_LABELS[item]}
                    </li>
                  ))}
                </ul>
              </section>

              <form noValidate onSubmit={(event) => accept(event, state.data)} className="mt-6 flex flex-col gap-4 border-t border-alivia-primary-mist pt-6">
                <Field id="invitation-email" label="Correo electrónico" hint="La invitación está ligada a este correo.">
                  {(describedBy) => (
                    <div className="relative">
                      <input
                        id="invitation-email"
                        value={state.data.email}
                        readOnly
                        aria-describedby={describedBy}
                        className={`${inputBase} min-h-11 pr-10`}
                      />
                      <Lock className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-alivia-secondary-deep" aria-hidden="true" />
                    </div>
                  )}
                </Field>

                {!signedIn && (
                  <Field
                    id="invitation-password"
                    label="Contraseña"
                    required
                    error={error}
                    aside={
                      <Link to="/recover-password" className="text-xs font-semibold text-alivia-secondary-deep hover:underline">
                        ¿Olvidaste tu contraseña?
                      </Link>
                    }
                  >
                    {(describedBy) => (
                      <div className="relative">
                        <input
                          id="invitation-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          aria-invalid={Boolean(error)}
                          aria-describedby={describedBy}
                          placeholder="Ingresa tu contraseña"
                          className={`${inputBase} min-h-11 pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          className="absolute top-0 right-0 grid size-11 place-items-center text-alivia-hint hover:text-alivia-primary"
                        >
                          {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                        </button>
                      </div>
                    )}
                  </Field>
                )}
                {signedIn && error && (
                  <p role="alert" className="text-sm font-semibold text-alivia-danger">
                    {error}
                  </p>
                )}

                <Button type="submit" loading={busy === 'accept'} disabled={busy !== null} className="w-full">
                  {signedIn ? 'Aceptar invitación' : 'Iniciar sesión y aceptar'}
                </Button>
                <Button variant="ghost" onClick={reject} loading={busy === 'reject'} disabled={busy !== null} className="self-center text-alivia-text-muted">
                  Rechazar invitación
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
      <footer className="border-t border-alivia-primary-mist py-5 text-center text-xs font-semibold text-alivia-text-muted">
        © {new Date().getFullYear()} Alivia
      </footer>
    </div>
  );
}

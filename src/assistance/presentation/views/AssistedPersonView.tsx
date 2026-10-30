import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { House, Lock, Pencil, UserRound } from 'lucide-react';
import {
  Avatar,
  Button,
  ErrorState,
  PageHeader,
  SampleDataNotice,
  SkeletonDetail,
  StatusDot,
  Toast,
  useToast,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';
import { isAssistanceSample, loadAssistedPerson } from '../../application/assistance.store.ts';
import { formatSince } from '../assistance-labels.ts';
import { EditAssistedPersonDrawer } from '../components/EditAssistedPersonDrawer.tsx';

const DOCUMENT_LABEL = { DNI: 'DNI', CE: 'Carné de extranjería', PASSPORT: 'Pasaporte' } as const;

function Row({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-alivia-primary-mist py-3.5 text-sm last:border-0 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-alivia-text-muted">{label}</dt>
      <dd className="flex flex-wrap items-center gap-2 font-semibold break-words text-alivia-primary-dark">{children}</dd>
    </div>
  );
}

function Note({ children }: { readonly children: ReactNode }) {
  return <span className="text-xs font-normal text-alivia-hint">{children}</span>;
}

export function AssistedPersonView() {
  useDocumentTitle('Persona asistida');
  const { accessLevel } = useSession();
  const canEdit = accessLevel === 'principal';
  const { state, retry, setData } = useLoad(loadAssistedPerson, []);
  const [editing, setEditing] = useState(false);
  const [notice, notify] = useToast();
  const person = state.status === 'ready' ? state.data : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        crumb="Persona asistida"
        title="Persona asistida"
        subtitle={canEdit ? 'Consulta y actualiza la información registrada de la persona a tu cargo.' : 'Información de la persona a la que acompañas.'}
      />
      {isAssistanceSample() && <SampleDataNotice />}

      {state.status === 'loading' && <SkeletonDetail label="Cargando la información…" rows={6} />}
      {state.status === 'error' && (
        <ErrorState title="No pudimos cargar a la persona asistida" message="Revisa tu conexión e inténtalo de nuevo." onRetry={retry} />
      )}

      {person && (
        <article className="rounded-3xl border border-alivia-primary-mist bg-white p-5 shadow-sm sm:p-8">
          <header className="flex flex-wrap items-center gap-4 border-b border-alivia-primary-mist pb-6">
            <Avatar name={person.fullName} src={person.photoUrl ?? undefined} size="lg" className="ring-4 ring-alivia-primary-mist" />
            <div className="min-w-0 flex-1 basis-60 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold break-words text-alivia-primary-dark">{person.fullName}</h2>
                {person.isComplete ? (
                  <StatusDot tone="success">Perfil completo</StatusDot>
                ) : (
                  <StatusDot tone="warning">Faltan datos</StatusDot>
                )}
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-alivia-text-muted">
                <span className="inline-flex items-center gap-1">
                  <UserRound className="size-4" aria-hidden="true" />
                  Persona asistida
                </span>
                <span aria-hidden="true">·</span>
                <span>{person.ageAt()} años</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <House className="size-4" aria-hidden="true" />
                  {person.householdAlias}
                </span>
              </p>
            </div>
            {canEdit && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="size-4" aria-hidden="true" />
                Editar información
              </Button>
            )}
          </header>

          <section aria-labelledby="personal-heading" className="pt-6">
            <h3 id="personal-heading" className="text-xs font-bold tracking-wide text-alivia-text-muted uppercase">
              Información personal
            </h3>
            <dl className="mt-2">
              <Row label="Nombres">{person.firstName}</Row>
              <Row label="Apellidos">{person.lastName}</Row>
              <Row label="Tipo de documento">{DOCUMENT_LABEL[person.documentType]}</Row>
              <Row label="Número de documento">
                {person.documentNumber}
                {person.documentValidated && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-alivia-page px-2 py-0.5 text-xs font-semibold text-alivia-text-muted">
                    <Lock className="size-3" aria-hidden="true" />
                    Documento validado
                  </span>
                )}
              </Row>
              <Row label="Fecha de nacimiento">
                {formatSince(person.birthDate)} ({person.ageAt()} años)
              </Row>
              <Row label="Parentesco">
                {person.kinship}
                <Note>({person.kinship} de {person.principalCaregiverName.split(' ')[0]})</Note>
              </Row>
            </dl>
          </section>

          <section aria-labelledby="linked-heading" className="mt-6 border-t border-alivia-primary-mist pt-6">
            <h3 id="linked-heading" className="text-xs font-bold tracking-wide text-alivia-text-muted uppercase">
              Información asociada
            </h3>
            <dl className="mt-2">
              <Row label="Hogar relacionado">
                {canEdit ? (
                  <Link to="/household" className="text-alivia-primary hover:underline">
                    {person.householdAlias}
                  </Link>
                ) : (
                  person.householdAlias
                )}
              </Row>
              <Row label="Cuidador principal">
                {person.principalCaregiverName}
                <span className="rounded-md bg-alivia-page px-2 py-0.5 text-xs font-semibold text-alivia-text-muted">
                  {person.principalCaregiverKinship}
                </span>
              </Row>
              <Row label="Teléfono de contacto">
                {person.phone ? (
                  <>
                    <a href={`tel:${person.phone.replace(/\s/g, '')}`} className="hover:underline">
                      {person.phone}
                    </a>
                    <Note>(línea móvil de la persona asistida)</Note>
                  </>
                ) : (
                  <Note>Sin teléfono propio</Note>
                )}
              </Row>
            </dl>
          </section>

          {canEdit && (
            <EditAssistedPersonDrawer
              open={editing}
              person={person}
              onClose={() => setEditing(false)}
              onSaved={(saved) => {
                setData(saved);
                setEditing(false);
                notify('Información actualizada');
              }}
            />
          )}
        </article>
      )}

      <Toast message={notice} />
    </div>
  );
}

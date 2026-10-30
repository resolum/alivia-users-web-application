import { useState, type ReactNode } from 'react';
import { Check, ExternalLink, House, Pencil } from 'lucide-react';
import {
  Button,
  ErrorState,
  PageHeader,
  SampleDataNotice,
  SkeletonDetail,
  Toast,
  useToast,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { isHouseholdSample, loadHousehold } from '../../application/household.store.ts';
import { EditHouseholdDrawer } from '../components/EditHouseholdDrawer.tsx';

function Row({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-alivia-primary-mist py-3.5 text-sm last:border-0 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-alivia-text-muted">{label}</dt>
      <dd className="break-words text-alivia-primary-dark">{children || '—'}</dd>
    </div>
  );
}

export function HouseholdView() {
  useDocumentTitle('Mi hogar');
  const { state, retry, setData } = useLoad(loadHousehold, []);
  const [editing, setEditing] = useState(false);
  const [notice, notify] = useToast();
  const household = state.status === 'ready' ? state.data : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        crumb="Mi hogar"
        title="Mi hogar"
        subtitle="Consulta y actualiza la información de tu hogar."
        actions={
          household && (
            <Button onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar información
            </Button>
          )
        }
      />
      {isHouseholdSample() && <SampleDataNotice />}

      {state.status === 'loading' && <SkeletonDetail label="Cargando tu hogar…" rows={6} />}
      {state.status === 'error' && (
        <ErrorState title="No pudimos cargar tu hogar" message="Revisa tu conexión e inténtalo de nuevo." onRetry={retry} />
      )}

      {household && (
        <article className="overflow-hidden rounded-3xl border border-alivia-primary-mist bg-white shadow-sm">
          <header className="flex flex-wrap items-center gap-4 border-b border-alivia-primary-mist bg-alivia-page/50 px-5 py-4 sm:px-6">
            <span aria-hidden="true" className="grid size-12 place-items-center rounded-xl bg-alivia-primary-mist text-alivia-primary">
              <House className="size-6" />
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold break-words text-alivia-primary-dark">{household.alias}</h2>
              {household.address.validated && (
                <span className="inline-flex items-center gap-1 rounded-full bg-alivia-mint px-2.5 py-0.5 text-xs font-semibold text-alivia-secondary-deep">
                  <Check className="size-3.5" aria-hidden="true" />
                  Ubicación validada
                </span>
              )}
            </div>
            {(household.principalCaregiverName || household.assistedPersonName) && (
              <dl className="flex gap-6 text-xs">
                {household.principalCaregiverName && (
                  <div>
                    <dt className="font-semibold tracking-wide text-alivia-text-muted uppercase">Cuidador principal</dt>
                    <dd className="mt-0.5 font-bold text-alivia-primary-dark">{household.principalCaregiverName}</dd>
                  </div>
                )}
                {household.assistedPersonName && (
                  <div className="border-l border-alivia-primary-mist pl-6">
                    <dt className="font-semibold tracking-wide text-alivia-text-muted uppercase">Persona asistida</dt>
                    <dd className="mt-0.5 font-bold text-alivia-primary-dark">{household.assistedPersonName}</dd>
                  </div>
                )}
              </dl>
            )}
          </header>

          <div className="px-5 py-6 sm:px-6">
            <h3 className="text-lg font-bold text-alivia-primary-dark">Datos generales</h3>
            <dl className="mt-2">
              <Row label="Alias del hogar">{household.alias}</Row>
              <Row label="Teléfono asociado">{household.phone}</Row>
              <Row label="Correo asociado">{household.email}</Row>
            </dl>

            <h3 className="mt-8 border-t border-alivia-primary-mist pt-6 text-lg font-bold text-alivia-primary-dark">Ubicación</h3>
            <dl className="mt-2">
              <Row label="Dirección">{household.address.line}</Row>
              <Row label="Distrito">{household.address.district}</Row>
              <Row label="Referencia">{household.address.reference}</Row>
            </dl>

            <div className="relative mt-4 overflow-hidden rounded-2xl border border-alivia-primary-mist bg-alivia-page">
              <iframe
                title={`Mapa de ${household.alias}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(household.mapQuery)}&z=15&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-64 w-full sm:h-72"
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(household.mapQuery)}`}
                target="_blank"
                rel="noreferrer"
                className="absolute right-3 bottom-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-alivia-primary-dark shadow-md hover:bg-alivia-page"
              >
                Ver en Google Maps
                <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(se abre en otra pestaña)</span>
              </a>
            </div>
          </div>

          <EditHouseholdDrawer
            open={editing}
            household={household}
            onClose={() => setEditing(false)}
            onSaved={(saved) => {
              setData(saved);
              setEditing(false);
              notify('Información del hogar actualizada');
            }}
          />
        </article>
      )}

      <Toast message={notice} />
    </div>
  );
}

import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts';
import { useSession } from '../../hooks/useSession.ts';
import { useTranslations } from '../../i18n/index.ts';

/** Placeholder card for a home section. */
function SummaryCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-alivia-primary-mist bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-alivia-text-muted">{title}</p>
      <p className="mt-2 text-xs text-alivia-text-soft">Próximamente</p>
    </div>
  );
}

export function HomeView() {
  const t = useTranslations();
  const { accessLevel } = useSession();
  useDocumentTitle(t.nav.home);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-alivia-text">{t.nav.home}</h1>
        <p className="mt-1 text-sm text-alivia-text-soft">
          Acceso actual:{' '}
          <span className="font-semibold text-alivia-primary">{accessLevel}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Alertas" />
        <SummaryCard title="Dispositivos" />
        <SummaryCard title="Actividades" />
        <SummaryCard title="Suscripción" />
      </div>
    </div>
  );
}

import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { AuthCard } from './AuthCard.tsx';
import { PortalBadge } from './PortalBadge.tsx';

export function AuthShowcasePanel() {
  const t = useIamTranslations().signIn.showcase;

  return (
    <aside className="hidden h-full flex-col gap-5 rounded-r-3xl bg-gradient-to-br from-alivia-primary-mist via-alivia-mint to-alivia-primary-mist p-6 lg:flex">
      <div className="flex items-center justify-between gap-3">
        <PortalBadge label={t.connected} tone="white" withLeaf />
        <span className="text-xs font-medium text-alivia-text-muted">
          {t.location}
        </span>
      </div>

      <div
        aria-hidden="true"
        className="relative flex min-h-60 flex-1 items-center justify-center overflow-hidden rounded-3xl bg-white/70"
      >
        <img
          src="/casa.png"
          alt="Ilustración de hogar asistivo"
          className="h-full w-full object-cover"
        />
      </div>

      <AuthCard className="p-6">
        <p className="text-2xl leading-tight font-bold text-alivia-primary">
          {t.autonomy}
        </p>
        <p className="text-2xl leading-tight font-bold text-alivia-secondary-deep">
          {t.tranquility}
        </p>
        <p className="mt-2 text-sm text-alivia-text-muted">
          {t.description}
        </p>
      </AuthCard>
    </aside>
  );
}

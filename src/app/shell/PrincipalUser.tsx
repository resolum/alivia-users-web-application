import { Avatar } from '@/shared/presentation/components/ui/index.ts';
import { useTranslations } from '@/shared/presentation/i18n/index.ts';

interface PrincipalUserProps {
  readonly displayName: string;
}

/**
 * Read-only account summary for the principal top bar.
 */
export function PrincipalUser({ displayName }: PrincipalUserProps) {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right sm:block">
        <p className="max-w-48 truncate text-sm font-bold text-alivia-text">
          {displayName || '—'}
        </p>
        <p className="text-xs font-semibold text-alivia-secondary-deep">
          {t.nav.roles.principal}
        </p>
      </div>
      <Avatar
        name="Alivia"
        size="md"
        className="border-2 border-alivia-secondary-light"
      />
    </div>
  );
}

import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';
import { useTranslations } from '@/shared/presentation/i18n/index.ts';
import { HomeGuestView } from './HomeGuestView.tsx';
import { HomePrincipalView } from './HomePrincipalView.tsx';

/** Chooses the Home variant declared by the current access level. */
export function HomeView() {
  const { accessLevel } = useSession();
  const t = useTranslations();
  useDocumentTitle(t.home.meta.title);

  return accessLevel === 'principal' ? (
    <HomePrincipalView />
  ) : (
    <HomeGuestView />
  );
}

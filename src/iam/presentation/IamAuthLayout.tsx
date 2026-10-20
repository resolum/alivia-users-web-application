import { AuthLayout } from '@/shared/presentation/components/layout/AuthLayout.tsx';
import { useIamTranslations } from './hooks/useIamTranslations.ts';

export function IamAuthLayout() {
  const t = useIamTranslations();

  return (
    <AuthLayout
      brandName={t.auth.brand}
      portalLabel={t.auth.portalLabel}
      footerText={t.auth.footer}
    />
  );
}

import { useTranslations } from '@/shared/presentation/i18n/index.ts';

/** Non-production notice shown only when VITE_DEMO_DATA is enabled. */
export function DemoModeBanner() {
  const t = useTranslations();
  if (import.meta.env.VITE_DEMO_DATA !== 'true') return null;

  return (
    <div
      role="status"
      className="border-b border-alivia-secondary-light bg-alivia-mint px-4 py-2 text-center text-xs font-semibold text-alivia-secondary-deep"
    >
      {t.layout.demoBanner}
    </div>
  );
}

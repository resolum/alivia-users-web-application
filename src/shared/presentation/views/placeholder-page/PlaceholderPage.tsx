import { useTranslations } from '../../i18n/index.ts';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts';

interface PlaceholderPageProps {
  readonly title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  const t = useTranslations();
  useDocumentTitle(title);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div
        aria-hidden="true"
        className="size-20 rounded-full bg-alivia-primary-mist flex items-center justify-center"
      >
        <span className="text-4xl text-alivia-primary-light">◎</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-alivia-text">{title}</h1>
        <p className="text-sm text-alivia-text-soft">
          {t.layout.comingSoon}
        </p>
      </div>
    </div>
  );
}

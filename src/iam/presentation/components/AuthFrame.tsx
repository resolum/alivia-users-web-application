import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/shared/presentation/components/language-switcher/index.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

interface AuthFrameProps {
  readonly children: ReactNode;
}

/**
 * Full-height frame of the auth screens: the task on white at the left, and
 * on wide screens the product's own illustration on its sand ground at the
 * right. Phones get the task alone.
 */
export function AuthFrame({ children }: AuthFrameProps) {
  const t = useIamTranslations();

  return (
    <div className="grid min-h-dvh bg-white text-alivia-text lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex min-h-dvh flex-col px-5 pt-4 pb-6 sm:px-10 sm:pt-6 lg:px-14">
        <header className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2.5">
            {/* The icon has wide padding; the negative margin keeps the mark at ~28px. */}
            <img src="/logo.ico" alt="" className="-m-3 size-14 object-contain" />
            <span className="text-2xl font-semibold tracking-[-0.02em] text-alivia-primary">
              {t.auth.brand}
            </span>
          </span>
          <LanguageSwitcher tone="quiet" />
        </header>

        <main className="flex flex-1 items-center py-10 sm:py-16">
          <div className="mx-auto w-full max-w-[25rem]">{children}</div>
        </main>

        <footer className="text-sm text-alivia-hint">{t.auth.footer}</footer>
      </div>

      <aside className="hidden min-h-dvh flex-col justify-between gap-8 bg-alivia-sand px-14 py-14 lg:flex">
        <div className="max-w-md">
          <p className="text-4xl leading-[1.1] font-semibold tracking-[-0.02em] text-alivia-primary">
            {t.signIn.showcase.autonomy}
            <br />
            {t.signIn.showcase.tranquility}
          </p>
          <p className="mt-5 max-w-sm text-lg leading-relaxed text-alivia-text-muted">
            {t.signIn.showcase.description}
          </p>
        </div>

        <picture className="flex min-h-0 flex-1 items-center justify-center">
          <source srcSet="/casa.webp" type="image/webp" />
          <img
            src="/casa.png"
            alt=""
            width={1000}
            height={976}
            decoding="async"
            className="max-h-[min(34rem,58dvh)] w-auto max-w-full object-contain [mask-image:radial-gradient(closest-side,#000_86%,transparent)]"
          />
        </picture>

        <p className="text-sm text-alivia-hint">{t.signIn.showcase.location}</p>
      </aside>
    </div>
  );
}

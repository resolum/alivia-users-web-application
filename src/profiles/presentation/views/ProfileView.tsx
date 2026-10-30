import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import {
  ErrorState,
  SkeletonDetail,
} from '@/shared/presentation/components/ui/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';
import { useTranslations } from '@/shared/presentation/i18n/index.ts';
import { loadProfile } from '../../application/profiles.store.ts';
import type { PersonProfile } from '../../domain/model/person-profile.entity.ts';
import { ProfileError, type ProfileErrorCode } from '../../domain/model/profile-error.ts';
import { PersonalDataForm } from '../components/PersonalDataForm.tsx';
import { PhotoUploadDialog } from '../components/PhotoUploadDialog.tsx';
import { ProfileHeaderCard } from '../components/ProfileHeaderCard.tsx';

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly code: ProfileErrorCode }
  | { readonly status: 'ready'; readonly profile: PersonProfile };

const NOTICE_MS = 3500;

export function ProfileView() {
  const t = useTranslations().profiles;
  const { accessLevel, user } = useSession();
  const profileId = user?.profileId ?? null;
  useDocumentTitle(t.title);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [photoOpen, setPhotoOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (profileId === null) return;
    let active = true;
    loadProfile(profileId).then(
      (profile) => active && setState({ status: 'ready', profile }),
      (error: unknown) =>
        active &&
        setState({ status: 'error', code: error instanceof ProfileError ? error.code : 'unknown' }),
    );
    return () => {
      active = false;
    };
  }, [profileId, attempt]);

  const retry = () => {
    setState({ status: 'loading' });
    setAttempt((count) => count + 1);
  };

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  // Accounts with no linked profile cannot load one; signing in again refreshes the link.
  const view: LoadState = profileId === null ? { status: 'error', code: 'not_found' } : state;

  const apply = (profile: PersonProfile, message: string) => {
    setState({ status: 'ready', profile });
    setPhotoOpen(false);
    setNotice(message);
  };

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-6">
      <nav aria-label={t.breadcrumbLabel}>
        <ol className="flex items-center gap-1 text-sm text-alivia-text-muted">
          <li>
            <Link to="/home" className="rounded-sm hover:text-alivia-primary hover:underline">
              {t.breadcrumbHome}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-4" />
          </li>
          <li aria-current="page" className="font-semibold text-alivia-primary">
            {t.title}
          </li>
        </ol>
      </nav>

      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-alivia-primary sm:text-4xl">{t.title}</h1>
        <p className="text-sm text-alivia-text-muted">{t.subtitle}</p>
      </header>

      {view.status === 'loading' && <SkeletonDetail label={t.states.loading} rows={5} />}

      {view.status === 'error' && (
        <ErrorState
          title={t.states.errorTitle}
          message={t.errors[view.code]}
          retryLabel={t.states.retry}
          onRetry={retry}
        />
      )}

      {view.status === 'ready' && (
        <>
          {/* Header then form settle in reading order where the skeleton stood. */}
          <div className="animate-reveal">
            <ProfileHeaderCard
              profile={view.profile}
              accessLevel={accessLevel}
              onChangePhoto={() => setPhotoOpen(true)}
            />
          </div>
          <div className="animate-reveal [animation-delay:60ms]">
            <PersonalDataForm
              profile={view.profile}
              onSaved={(profile) => apply(profile, t.form.saved)}
            />
          </div>
          <PhotoUploadDialog
            open={photoOpen}
            profile={view.profile}
            onClose={() => setPhotoOpen(false)}
            onSaved={apply}
          />
        </>
      )}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6">
        {notice && (
          <p
            key={notice}
            className={[
              'rounded-xl bg-alivia-primary-dark px-4 py-3 text-sm font-semibold text-white shadow-lg',
              // Confirms an occasional save: rises 8px with a strong ease-out, no exit motion.
              'transition-[opacity,translate] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
              'starting:translate-y-2 starting:opacity-0',
            ].join(' ')}
          >
            {notice}
          </p>
        )}
      </div>
    </div>
  );
}

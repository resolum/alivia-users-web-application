import { useEffect, useState } from 'react';
import { loadProfile, subscribeToProfile } from '@/profiles/index.ts';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';

export interface ShellData {
  readonly displayName: string;
  readonly photoUrl: string | null;
  readonly householdLabel: string | null;
  readonly assistedPersonName: string | null;
}

const EMPTY_SHELL_DATA: ShellData = {
  displayName: '',
  photoUrl: null,
  householdLabel: null,
  assistedPersonName: null,
};

interface ProfileSummary {
  readonly id: string;
  readonly name: string;
  readonly photoUrl: string | null;
}

/** Name and photo of the signed-in person; they follow edits made on "Mi perfil". */
function useProfileSummary(profileId: string | null): ProfileSummary | null {
  const [summary, setSummary] = useState<ProfileSummary | null>(null);

  useEffect(() => {
    if (profileId === null) return;
    const unsubscribe = subscribeToProfile((profile) => {
      if (profile.id === profileId) setSummary({ id: profileId, name: profile.fullName, photoUrl: profile.photoUrl });
    });
    // A failed load keeps the fallback name; the profile screen reports the error.
    loadProfile(profileId).catch(() => undefined);
    return unsubscribe;
  }, [profileId]);

  // Ignores a name left over from a previous session's profile.
  return summary !== null && summary.id === profileId ? summary : null;
}

/** Shell data for the top bar. It must not use the IAM email as name. */
export function useShellData(): ShellData {
  const { user } = useSession();
  const profile = useProfileSummary(user?.profileId ?? null);
  // shortcut: household and assisted person have no backend source yet, so they stay empty.
  return profile === null ? EMPTY_SHELL_DATA : { ...EMPTY_SHELL_DATA, displayName: profile.name, photoUrl: profile.photoUrl };
}

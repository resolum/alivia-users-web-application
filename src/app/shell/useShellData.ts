import { useEffect, useState } from 'react';
import { loadProfile, subscribeToProfile } from '@/profiles/index.ts';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';

export interface ShellData {
  readonly displayName: string;
  readonly householdLabel: string | null;
  readonly assistedPersonName: string | null;
}

const EMPTY_SHELL_DATA: ShellData = {
  displayName: '',
  householdLabel: null,
  assistedPersonName: null,
};

/** Name of the signed-in person from their profile; it follows edits made on "Mi perfil". */
function useProfileName(profileId: string | null): string | null {
  const [name, setName] = useState<{ id: string; value: string } | null>(null);

  useEffect(() => {
    if (profileId === null) return;
    const unsubscribe = subscribeToProfile((profile) => {
      if (profile.id === profileId) setName({ id: profileId, value: profile.fullName });
    });
    // A failed load keeps the fallback name; the profile screen reports the error.
    loadProfile(profileId).catch(() => undefined);
    return unsubscribe;
  }, [profileId]);

  // Ignores a name left over from a previous session's profile.
  return name !== null && name.id === profileId ? name.value : null;
}

/** Shell data for the top bar. It must not use the IAM email as name. */
export function useShellData(): ShellData {
  const { user } = useSession();
  const profileName = useProfileName(user?.profileId ?? null);
  // shortcut: household and assisted person have no backend source yet, so they stay empty.
  return profileName === null ? EMPTY_SHELL_DATA : { ...EMPTY_SHELL_DATA, displayName: profileName };
}

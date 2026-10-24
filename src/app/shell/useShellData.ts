import { useSession } from '@/shared/presentation/hooks/useSession.ts';
import type { AccessLevel } from '@/shared/presentation/session/session.types.ts';

export interface ShellData {
  readonly displayName: string;
  readonly householdLabel: string | null;
  readonly assistedPersonName: string | null;
  readonly unreadNotifications: number;
}

const EMPTY_SHELL_DATA: ShellData = {
  displayName: '',
  householdLabel: null,
  assistedPersonName: null,
  unreadNotifications: 0,
};

const DEMO_SHELL_DATA: Record<AccessLevel, ShellData> = {
  principal: {
    displayName: 'María Elena Villanueva',
    householdLabel: null,
    assistedPersonName: null,
    unreadNotifications: 4,
  },
  invitado: {
    displayName: 'Carlos Rodríguez',
    householdLabel: 'Hogar San Borja',
    assistedPersonName: 'Alberto',
    unreadNotifications: 1,
  },
};

/** Shell data for the top bar. It must not use the IAM email as name. */
export function useShellData(): ShellData {
  const { accessLevel } = useSession();
  if (import.meta.env.VITE_DEMO_DATA === 'true') {
    return DEMO_SHELL_DATA[accessLevel];
  }
  return EMPTY_SHELL_DATA;
}

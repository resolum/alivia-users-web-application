import { useEffect } from 'react';
import { runCareChecks } from '@/assistance/index.ts';
import { AppLayout } from '@/shared/presentation/components/layout/AppLayout.tsx';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';
import { AppTopBar } from './AppTopBar.tsx';

const CHECK_EVERY_MS = 60_000;

/** App composition of the shared shell and top bar. */
export function AppShell() {
  const { accessLevel, user } = useSession();
  const displayName = user?.displayName;

  // Escalations, overdue-dose alerts and reminders fire on time, whatever screen is open.
  useEffect(() => {
    const check = () => void runCareChecks({ accessLevel, displayName }).catch(() => undefined);
    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    // Reminders held back while offline go out as soon as the connection returns, if still pertinent.
    window.addEventListener('online', check);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', check);
    };
  }, [accessLevel, displayName]);

  return (
    <AppLayout
      topBar={<AppTopBar />}
    />
  );
}

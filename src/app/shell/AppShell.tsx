import { useEffect } from 'react';
import { runCareChecks } from '@/assistance/index.ts';
import { AppLayout } from '@/shared/presentation/components/layout/AppLayout.tsx';
import { AppTopBar } from './AppTopBar.tsx';

const CHECK_EVERY_MS = 60_000;

/** App composition of the shared shell and top bar. */
export function AppShell() {
  // Escalations and overdue-dose alerts fire on time, whatever screen is open.
  useEffect(() => {
    const check = () => void runCareChecks().catch(() => undefined);
    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <AppLayout
      topBar={<AppTopBar />}
    />
  );
}

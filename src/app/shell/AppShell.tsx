import { AppLayout } from '@/shared/presentation/components/layout/AppLayout.tsx';
import { AppTopBar } from './AppTopBar.tsx';

/** App composition of the shared shell and top bar. */
export function AppShell() {
  return (
    <AppLayout
      topBar={<AppTopBar />}
    />
  );
}

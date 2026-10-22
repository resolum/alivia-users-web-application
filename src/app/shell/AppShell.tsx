import { AppLayout } from '@/shared/presentation/components/layout/AppLayout.tsx';
import { AppTopBar } from './AppTopBar.tsx';
import { DemoModeBanner } from './DemoModeBanner.tsx';

/** App composition of the shared shell, top bar and demo banner. */
export function AppShell() {
  return (
    <AppLayout
      topBar={<AppTopBar />}
      banner={<DemoModeBanner />}
    />
  );
}

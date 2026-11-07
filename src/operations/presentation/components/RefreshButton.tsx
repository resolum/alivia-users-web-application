import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/presentation/components/ui/index.ts';

/** "Actualizar estado": reads the incident again to show the step the technician just recorded. */
export function RefreshButton({ refreshing, onRefresh }: { readonly refreshing: boolean; readonly onRefresh: () => void }) {
  return (
    <Button variant="soft" onClick={onRefresh} disabled={refreshing} aria-busy={refreshing}>
      <RefreshCw className={`size-4 ${refreshing ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
      {refreshing ? 'Actualizando…' : 'Actualizar estado'}
    </Button>
  );
}

import { Info } from 'lucide-react';

/** Tells the caregiver the screen shows example data while its backend contract is pending. */
export function SampleDataNotice() {
  return (
    <p className="inline-flex items-center gap-2 self-start rounded-lg bg-alivia-warning-soft px-3 py-1.5 text-xs font-semibold text-alivia-warning">
      <Info className="size-4 shrink-0" aria-hidden="true" />
      Datos de ejemplo: el servicio de esta sección aún no está conectado.
    </p>
  );
}

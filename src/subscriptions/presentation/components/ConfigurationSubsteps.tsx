import { Check } from 'lucide-react';

export type ConfigurationSubstep = 'rooms' | 'devices' | 'summary' | 'payment';

// 'installation' is shown in the stepper but has no route yet: it will hold the installation dates.
const SUBSTEPS: readonly { id: ConfigurationSubstep | 'installation'; label: string; upcoming?: boolean }[] = [
  { id: 'rooms', label: 'Habitaciones' },
  { id: 'devices', label: 'Dispositivos' },
  { id: 'installation', label: 'Instalación', upcoming: true },
  { id: 'summary', label: 'Resumen' },
  { id: 'payment', label: 'Pago' },
];

export function ConfigurationSubsteps({ current }: { readonly current: ConfigurationSubstep }) {
  const currentIndex = SUBSTEPS.findIndex((step) => step.id === current);
  return <nav className="mx-auto mt-5 max-w-4xl" aria-label="Subpasos de configuración"><ol className="grid grid-cols-5 overflow-hidden rounded-xl border border-slate-200 bg-white">{SUBSTEPS.map((step, index) => {
    const active = index === currentIndex;
    const done = index < currentIndex && step.upcoming !== true;
    return <li key={step.id} aria-current={active ? 'step' : undefined} className={`flex items-center justify-center gap-2 border-r border-slate-200 px-2 py-3 text-xs font-bold last:border-r-0 sm:text-sm ${active ? 'bg-alivia-primary text-white' : done ? 'bg-alivia-mint text-alivia-secondary-deep' : 'text-slate-400'}`}><span>{done ? <Check aria-hidden="true" className="size-4" /> : `${index + 1}.`}</span><span className="hidden sm:inline">{step.label}</span></li>;
  })}</ol></nav>;
}

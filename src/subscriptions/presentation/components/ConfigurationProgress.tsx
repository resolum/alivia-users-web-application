import { Check } from 'lucide-react';

const STEPS = ['Plan', 'Cuenta', 'Hogar', 'Configuración', 'Evaluación'] as const;

export function ConfigurationProgress() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_28px_rgba(15,42,107,0.05)]" aria-label="Progreso de contratación">
      <ol className="grid grid-cols-5 gap-2">
        {STEPS.map((step, index) => {
          const completed = index < 3;
          const current = index === 3;
          return (
            <li key={step} className="min-w-0">
              <div className={`mb-2 h-1 rounded-full ${completed ? 'bg-alivia-primary' : current ? 'bg-alivia-secondary-dark' : 'bg-alivia-primary-mist'}`} />
              <div className={`flex items-center gap-1.5 text-[0.68rem] font-semibold sm:text-xs ${current ? 'text-alivia-secondary-deep' : completed ? 'text-alivia-primary' : 'text-slate-400'}`}>
                <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.65rem] ${current ? 'bg-alivia-secondary text-alivia-primary-dark ring-4 ring-alivia-secondary-light' : completed ? 'bg-alivia-primary text-white' : 'bg-alivia-primary-mist text-alivia-primary-light'}`}>
                  {completed ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}
                </span>
                <span className="hidden truncate sm:block">{step}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs font-semibold">
        <span className="text-alivia-primary">Configuración — Paso 4 de 5</span>
        <span className="text-alivia-secondary-deep"><Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />Guardado automático</span>
      </div>
    </section>
  );
}

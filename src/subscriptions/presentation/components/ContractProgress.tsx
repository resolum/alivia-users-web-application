const STEPS = ['Plan', 'Cuenta', 'Hogar', 'Configuración', 'Evaluación'] as const;

export function ContractProgress() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_28px_rgba(15,42,107,0.05)]" aria-label="Progreso de contratación">
      <p className="mb-4 text-xs font-bold tracking-[0.08em] text-alivia-secondary-dark">
        CONTRATACIÓN GUIADA <span className="font-medium text-slate-400">· Paso 1 de 5</span>
      </p>
      <ol className="grid grid-cols-5 gap-2">
        {STEPS.map((step, index) => (
          <li key={step} className="min-w-0">
            <div className={`mb-2 h-1 rounded-full ${index === 0 ? 'bg-alivia-secondary-dark' : 'bg-alivia-primary-mist'}`} />
            <div className={`flex items-center gap-1.5 text-[0.68rem] font-semibold sm:text-xs ${index === 0 ? 'text-alivia-primary' : 'text-slate-400'}`}>
              <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[0.65rem] ${index === 0 ? 'bg-alivia-primary text-white' : 'bg-alivia-primary-mist text-alivia-primary-light'}`}>
                {index + 1}
              </span>
              <span className="hidden truncate sm:block">{step}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

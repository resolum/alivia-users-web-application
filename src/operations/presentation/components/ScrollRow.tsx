import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** A horizontal list the family moves with two buttons when it does not fit, like the days or the windows. */
export function ScrollRow({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const element = row.current;
    if (element === null) return;
    setEdges({
      start: element.scrollLeft <= 1,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, children]);

  const move = (direction: 1 | -1) => {
    const element = row.current;
    if (element === null) return;
    element.scrollBy({ left: direction * Math.max(160, element.clientWidth * 0.75), behavior: 'smooth' });
  };

  const button = 'grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-alivia-primary shadow-sm transition-opacity hover:border-alivia-primary-light disabled:cursor-default disabled:opacity-30';
  const scrollable = !(edges.start && edges.end);
  return (
    <div className="mt-3 flex items-center gap-2">
      {scrollable && <button type="button" aria-label={`Anteriores: ${label}`} disabled={edges.start} onClick={() => move(-1)} className={button}><ChevronLeft aria-hidden="true" className="size-4" /></button>}
      <div ref={row} onScroll={measure} role="radiogroup" aria-label={label} className="flex min-w-0 flex-1 gap-2.5 overflow-x-auto scroll-smooth px-0.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      {scrollable && <button type="button" aria-label={`Siguientes: ${label}`} disabled={edges.end} onClick={() => move(1)} className={button}><ChevronRight aria-hidden="true" className="size-4" /></button>}
    </div>
  );
}

import { Link } from 'react-router';

export function ContractBrand() {
  return (
    <Link to="/plans" className="inline-flex items-center gap-2.5" aria-label="Alivia, inicio de contratación">
      <span className="grid size-9 place-items-center rounded-xl bg-alivia-primary text-sm font-bold text-white shadow-sm">A</span>
      <span className="text-xl font-extrabold tracking-tight text-alivia-primary">Alivia</span>
      <span className="hidden text-[0.68rem] font-bold tracking-[0.16em] text-alivia-secondary-dark sm:inline">CUIDADORES</span>
    </Link>
  );
}

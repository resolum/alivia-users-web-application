/** Footer of the contracting pages, with the legal links. */
export function ContractFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>© {new Date().getFullYear()} Alivia Cuidado &amp; Asistencia. Todos los derechos reservados.</p>
        <nav className="flex flex-wrap gap-5" aria-label="Enlaces legales">
          <a href="#terminos" className="hover:text-alivia-primary">Términos y condiciones</a>
          <a href="#privacidad" className="hover:text-alivia-primary">Política de privacidad</a>
          <a href="#canal-etico" className="hover:text-alivia-primary">Canal ético</a>
        </nav>
      </div>
    </footer>
  );
}

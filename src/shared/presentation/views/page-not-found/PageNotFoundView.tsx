import { Link } from 'react-router';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts';

export function PageNotFoundView() {
  useDocumentTitle('Página no encontrada');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <p
        aria-hidden="true"
        className="text-8xl font-semibold text-alivia-primary-mist"
      >
        404
      </p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-alivia-text">
          Página no encontrada
        </h1>
        <p className="text-sm text-alivia-text-soft">
          La dirección que escribiste no existe o fue movida.
        </p>
      </div>
      <Link
        to="/home"
        className="rounded-lg bg-alivia-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-alivia-primary-mid"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

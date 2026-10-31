import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly actions?: ReactNode;
  /** Current page label in the breadcrumb; omitted when the page has no crumb. */
  readonly crumb?: string;
}

/** Breadcrumb, title and primary actions shared by the caregiver screens. */
export function PageHeader({ title, subtitle, actions, crumb }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {crumb && (
        <nav aria-label="Ruta de navegación">
          <ol className="flex items-center gap-1 text-sm text-alivia-text-muted">
            <li>
              <Link to="/home" className="rounded-sm hover:text-alivia-primary hover:underline">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-4" />
            </li>
            <li aria-current="page" className="font-semibold text-alivia-primary">
              {crumb}
            </li>
          </ol>
        </nav>
      )}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-alivia-primary-dark sm:text-4xl">
            {title}
          </h1>
          {subtitle && <div className="text-sm text-alivia-text-muted sm:text-base">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </header>
    </div>
  );
}

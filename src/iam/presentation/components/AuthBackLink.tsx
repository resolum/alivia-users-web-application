import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

interface AuthBackLinkProps {
  readonly to: string;
  readonly label: string;
}

export function AuthBackLink({ to, label }: AuthBackLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-alivia-primary-mid transition-colors duration-150 hover:text-alivia-primary"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {label}
    </Link>
  );
}

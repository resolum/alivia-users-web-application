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
      className="group inline-flex min-h-11 items-center gap-2 text-base font-semibold text-alivia-primary-mid transition-colors duration-150 ease-out hover:text-alivia-primary"
    >
      <ArrowLeft
        aria-hidden="true"
        className="size-[1.125rem] transition-transform duration-150 ease-out group-hover:-translate-x-0.5"
      />
      {label}
    </Link>
  );
}

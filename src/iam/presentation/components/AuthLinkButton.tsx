import { Link } from 'react-router';

interface AuthLinkButtonProps {
  readonly to: string;
  readonly label: string;
}

export function AuthLinkButton({ to, label }: AuthLinkButtonProps) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-alivia-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-alivia-primary-mid active:bg-alivia-primary-dark"
    >
      {label}
    </Link>
  );
}

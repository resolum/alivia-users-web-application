import { Link } from 'react-router';

type AuthButtonVariant = 'primary' | 'secondary';

interface AuthButtonBaseProps {
  readonly label: string;
  readonly variant?: AuthButtonVariant;
}

interface AuthSubmitProps extends AuthButtonBaseProps {
  readonly to?: undefined;
  readonly loading?: boolean;
  readonly disabled?: boolean;
}

interface AuthLinkProps extends AuthButtonBaseProps {
  readonly to: string;
}

const baseClass = [
  'inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-lg px-5',
  'text-base font-semibold tabular-nums select-none',
  // Press feedback: the button gives way under the finger.
  'transition-[background-color,transform] duration-150 ease-out active:scale-[0.98]',
  'disabled:cursor-not-allowed disabled:active:scale-100',
].join(' ');

const variantClasses: Readonly<Record<AuthButtonVariant, string>> = {
  primary:
    'bg-alivia-primary text-white hover:bg-alivia-primary-mid disabled:bg-alivia-primary-mist disabled:text-alivia-text-muted',
  secondary:
    'bg-alivia-primary-mist text-alivia-primary hover:bg-alivia-primary-light/45 disabled:text-alivia-hint',
};

/** Main action of an auth screen: a submit button, or a link when `to` is set. */
export function AuthButton(props: AuthSubmitProps | AuthLinkProps) {
  const className = `${baseClass} ${variantClasses[props.variant ?? 'primary']}`;

  if (props.to !== undefined) {
    return (
      <Link to={props.to} className={className}>
        {props.label}
      </Link>
    );
  }

  const { loading = false, disabled = false } = props;
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      aria-busy={loading}
      className={className}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-[1.125rem] animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {props.label}
    </button>
  );
}

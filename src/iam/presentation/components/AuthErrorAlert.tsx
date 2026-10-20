interface AuthErrorAlertProps {
  readonly message: string;
}

export function AuthErrorAlert({ message }: AuthErrorAlertProps) {
  return (
    <div
      role="alert"
      className="rounded-xl bg-alivia-danger/10 px-4 py-3 text-sm font-medium text-alivia-danger"
    >
      {message}
    </div>
  );
}

interface AuthFormHeaderProps {
  readonly title: string;
  readonly subtitle: string;
}

export function AuthFormHeader({ title, subtitle }: AuthFormHeaderProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl leading-tight font-bold text-alivia-primary">
        {title}
      </h1>
      <p className="text-sm text-alivia-text-muted">{subtitle}</p>
    </div>
  );
}

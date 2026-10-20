import { Spinner } from '@/shared/presentation/components/ui/Spinner.tsx';

interface SessionLoadingProps {
  readonly label: string;
}

export function SessionLoading({ label }: SessionLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-alivia-primary-mist">
      <Spinner label={label} size="lg" />
    </div>
  );
}

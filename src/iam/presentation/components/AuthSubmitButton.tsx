import { Button } from '@/shared/presentation/components/ui/Button.tsx';

interface AuthSubmitButtonProps {
  readonly label: string;
  readonly loading?: boolean;
  readonly disabled?: boolean;
}

export function AuthSubmitButton({
  label,
  loading = false,
  disabled = false,
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      loading={loading}
      disabled={disabled || loading}
      className="min-h-12 w-full"
    >
      {label}
    </Button>
  );
}

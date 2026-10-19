import type { ReactNode } from 'react';
import { Button } from './Button.tsx';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

/** Shown when a section fails to load. Offers an optional retry action. */
export function ErrorState({
  title = 'Algo salió mal',
  message = 'Por favor, inténtalo de nuevo.',
  onRetry,
  children,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
    >
      <div
        aria-hidden="true"
        className="size-16 rounded-full bg-alivia-primary-mist flex items-center justify-center"
      >
        <span className="text-3xl text-alivia-primary">!</span>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-alivia-text">{title}</p>
        <p className="text-sm text-alivia-text-soft">{message}</p>
      </div>
      {children}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

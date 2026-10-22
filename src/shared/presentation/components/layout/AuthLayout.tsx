import { Outlet } from 'react-router';

interface AuthLayoutProps {
  readonly brandName?: string;
  readonly portalLabel?: string;
  readonly footerText?: string;
}

function WheelchairMark() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-7"
    >
      <circle cx="10" cy="4" r="2" />
      <path d="M10 7v5h5l2 5" />
      <path d="M10 12l-2 4" />
      <circle cx="9" cy="18" r="4" />
      <path d="M13 18h5" />
    </svg>
  );
}

export function AuthLayout({
  brandName,
  portalLabel,
  footerText,
}: AuthLayoutProps) {
  const hasBrand = Boolean(brandName) || Boolean(portalLabel);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-alivia-primary-mist px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-alivia-secondary-light/50 blur-3xl"
      />

      {hasBrand && (
        <header className="relative flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-2xl bg-alivia-primary text-alivia-secondary"
          >
            <WheelchairMark />
          </span>
          <div>
            {brandName && (
              <p className="text-2xl font-bold leading-tight text-alivia-primary">
                {brandName}
              </p>
            )}
            {portalLabel && (
              <p className="text-[11px] font-semibold tracking-[0.18em] text-alivia-text-soft">
                {portalLabel}
              </p>
            )}
          </div>
        </header>
      )}

      <main className="relative w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_24px_60px_-24px_rgba(15,42,107,0.28)] sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 size-48 rounded-full bg-alivia-secondary-light/40 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="relative mb-6 flex size-10 items-center justify-center rounded-xl bg-alivia-primary-mist text-sm font-bold text-alivia-primary"
          >
            A
          </div>
          <div className="relative">
            <Outlet />
          </div>
        </div>
      </main>

      {footerText && (
        <footer className="relative text-center text-xs text-alivia-text-soft">
          {footerText}
        </footer>
      )}
    </div>
  );
}

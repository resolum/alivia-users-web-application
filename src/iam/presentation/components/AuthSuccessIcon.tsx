/**
 * Mark of a finished action (link sent, password changed). The check draws
 * itself once; with reduced motion it simply appears.
 */
export function AuthSuccessIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex size-14 items-center justify-center rounded-2xl bg-alivia-mint text-alivia-secondary-deep"
    >
      <svg
        focusable="false"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-7"
      >
        <path d="m5 12 5 5 9-9" strokeDasharray="24" className="animate-check-draw" />
      </svg>
    </span>
  );
}

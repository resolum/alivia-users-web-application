export function Toast({ message }: { readonly message: string | null }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      {message && (
        <p
          key={message}
          className={[
            'rounded-xl bg-alivia-primary-dark px-4 py-3 text-sm font-semibold text-white shadow-lg',
            'transition-[opacity,translate] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
            'starting:translate-y-2 starting:opacity-0',
          ].join(' ')}
        >
          {message}
        </p>
      )}
    </div>
  );
}

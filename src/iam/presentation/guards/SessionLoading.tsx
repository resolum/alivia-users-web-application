import { Bone, Skeleton } from '@/shared/presentation/components/ui/Skeleton.tsx';

interface SessionLoadingProps {
  readonly label: string;
  /** app: sidebar and page while a private route restores the session; auth: the sign-in card. */
  readonly variant?: 'app' | 'auth';
}

export function SessionLoading({ label, variant = 'app' }: SessionLoadingProps) {
  if (variant === 'auth') {
    return (
      <Skeleton label={label} className="flex min-h-dvh items-center justify-center bg-alivia-page p-4">
        <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-8">
          <Bone className="mx-auto h-5 w-20" />
          <Bone className="h-8 w-3/4" />
          <Bone className="h-3.5 w-1/2" />
          <Bone className="mt-6 h-11 w-full rounded-lg" />
          <Bone className="h-11 w-full rounded-lg" />
          <Bone className="h-11 w-full rounded-lg" />
        </div>
      </Skeleton>
    );
  }

  return (
    <Skeleton label={label} className="flex h-dvh bg-alivia-page">
      <div className="hidden w-64 shrink-0 flex-col gap-3 border-r border-alivia-primary-mist bg-white p-4 lg:flex">
        <Bone className="mb-6 h-10 w-36" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
          <Bone key={item} className={item % 3 === 0 ? 'mt-3 h-3 w-16' : 'h-9 w-full rounded-lg'} />
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center justify-end gap-3 border-b border-alivia-primary-mist bg-white px-6">
          <Bone className="size-9 rounded-lg" />
          <Bone className="h-8 w-40" />
        </div>
        <div className="mx-auto w-full max-w-5xl space-y-5 p-6">
          <Bone className="h-9 w-64" />
          <Bone className="h-4 w-80 max-w-full" />
          <Bone className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </Skeleton>
  );
}

import { Bone, Skeleton } from '@/shared/presentation/components/ui/index.ts';
import { useTranslations } from '../../../i18n/index.ts';

/** Skeleton of the Home layout: greeting, device alert, today's timeline and next event. */
export function HomeLoadingState() {
  const t = useTranslations();

  return (
    <Skeleton label={t.home.states.loading} className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Bone className="h-3 w-28" />
          <Bone className="h-10 w-48" />
          <Bone className="h-3.5 w-40" />
        </div>
        <div className="flex gap-3">
          <Bone className="h-11 w-44 rounded-xl" />
          <Bone className="h-11 w-40 rounded-xl" />
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-alivia-primary-mist bg-white p-4">
        <Bone className="size-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-1/2 max-w-72" />
          <Bone className="h-3 w-1/3 max-w-48" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-alivia-primary-mist bg-white lg:col-span-2">
          <div className="flex items-center gap-3 bg-alivia-primary-mist/50 px-4 py-3">
            <Bone className="size-10 rounded-full" />
            <Bone className="h-4 w-32" />
          </div>
          <div className="space-y-6 p-5">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex gap-3">
                <Bone className="size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Bone className={row % 2 ? 'h-4 w-1/3' : 'h-4 w-1/2'} />
                  <Bone className="h-3 w-1/4" />
                </div>
                <Bone className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3 rounded-2xl bg-alivia-primary-mist/40 p-5">
          <Bone className="h-3 w-28" />
          <Bone className="h-6 w-3/4" />
          <Bone className="h-4 w-2/3" />
          <Bone className="h-14 w-full rounded-xl" />
          <Bone className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </Skeleton>
  );
}

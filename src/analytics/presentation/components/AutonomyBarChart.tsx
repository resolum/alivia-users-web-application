import type { AutonomyBucket } from '../../domain/model/autonomy-summary.ts';

/** Gridline step that leaves 3–5 lines whatever the scale. */
function niceStep(max: number): number {
  const raw = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  return [1, 2, 5, 10].map((factor) => factor * magnitude).find((step) => step >= raw) ?? magnitude * 10;
}

interface AutonomyBarChartProps {
  readonly buckets: readonly AutonomyBucket[];
  /** Index of the bucket to emphasise (the current day), if any. */
  readonly highlight: number | null;
}

/** Stacked bars: autonomous actions at the base, assisted ones on top. */
export function AutonomyBarChart({ buckets, highlight }: AutonomyBarChartProps) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.autonomous + bucket.assisted));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, index) => top - index * step);

  return (
    <figure>
      <div className="flex h-56 gap-3" aria-hidden="true">
        <div className="flex flex-col justify-between text-right text-[11px] text-alivia-text-muted tabular-nums">
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
              {tick}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-0 flex flex-col justify-between">
            {ticks.map((tick) => (
              <span key={tick} className="border-t border-alivia-primary-mist" />
            ))}
          </div>
          <div className="relative flex h-full items-end justify-around gap-2">
            {buckets.map((bucket, index) => {
              const total = bucket.autonomous + bucket.assisted;
              return (
                <div
                  key={bucket.label}
                  className={[
                    'flex w-full max-w-10 origin-bottom flex-col-reverse overflow-hidden rounded-t-md',
                    // Bars rise once when a range loads, staggered so the eye reads left to right.
                    'transition-[scale] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] starting:scale-y-0',
                  ].join(' ')}
                  style={{ height: `${(total / top) * 100}%`, transitionDelay: `${index * 35}ms` }}
                  title={`${bucket.label}: ${bucket.autonomous} autónomas, ${bucket.assisted} con asistencia`}
                >
                  <span className="bg-alivia-secondary-deep" style={{ height: `${(bucket.autonomous / Math.max(total, 1)) * 100}%` }} />
                  <span className="flex-1 bg-alivia-primary-mist" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-2 ml-8 flex justify-around gap-2" aria-hidden="true">
        {buckets.map((bucket, index) => (
          <span
            key={bucket.label}
            className={`w-full max-w-14 text-center text-xs first-letter:uppercase ${index === highlight ? 'font-bold text-alivia-primary-dark' : 'text-alivia-text-muted'}`}
          >
            {bucket.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Acciones autónomas y con asistencia por periodo</caption>
        <thead>
          <tr>
            <th scope="col">Periodo</th>
            <th scope="col">Autónomas</th>
            <th scope="col">Con asistencia</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.label}>
              <th scope="row">{bucket.label}</th>
              <td>{bucket.autonomous}</td>
              <td>{bucket.assisted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

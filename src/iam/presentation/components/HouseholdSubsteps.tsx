import { Check } from 'lucide-react';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

const TOTAL = 2;

/**
 * Pill under the stepper that shows the two substeps of the household step:
 * the location of the home and the assisted person.
 */
export function HouseholdSubsteps({ current }: { readonly current: 1 | 2 }) {
  const t = useIamTranslations();
  const labels = [t.householdSubsteps.location, t.householdSubsteps.assistedPerson];
  const heading = t.householdSubsteps.label
    .replace('{current}', String(current))
    .replace('{total}', String(TOTAL));

  return (
    <nav
      aria-label={heading}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-alivia-primary-mist px-4 py-2 text-xs"
    >
      <span className="font-bold tracking-[0.08em] text-alivia-primary uppercase">{heading}</span>
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {labels.map((label, index) => {
          const position = index + 1;
          const done = position < current;
          const active = position === current;
          return (
            <li
              key={label}
              aria-current={active ? 'step' : undefined}
              className={[
                'inline-flex items-center gap-1',
                active ? 'font-bold text-alivia-primary-dark' : 'font-medium text-alivia-text-muted',
              ].join(' ')}
            >
              <span aria-hidden="true">·</span>
              {done && <Check aria-hidden="true" className="size-3.5 text-alivia-secondary-deep" />}
              {label}
              {done && <span className="sr-only">({t.householdSubsteps.done})</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

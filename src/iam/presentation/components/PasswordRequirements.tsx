import { useId } from 'react';
import type { PasswordRequirement } from '../../domain/model/password-policy.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

interface PasswordRequirementsProps {
  readonly requirements: readonly PasswordRequirement[];
}

interface RequirementRowProps {
  readonly requirement: PasswordRequirement;
  readonly label: string;
}

function RequirementRow({ requirement, label }: RequirementRowProps) {
  const satisfied = requirement.satisfied;

  return (
    <li
      className={[
        'flex items-center gap-2 text-sm',
        satisfied
          ? 'font-medium text-alivia-secondary-deep'
          : 'text-alivia-text-muted',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'flex size-5 shrink-0 items-center justify-center rounded-full border',
          satisfied
            ? 'border-alivia-secondary-deep bg-alivia-secondary-deep text-white'
            : 'border-alivia-text-soft/50 bg-white',
        ].join(' ')}
      >
        {satisfied && (
          <svg
            focusable="false"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3"
          >
            <path d="m3 8 3 3 7-7" />
          </svg>
        )}
      </span>
      {label}
    </li>
  );
}

/**
 * Visual checklist for the password policy.
 *
 * Only the summary is live: it changes when the number of satisfied
 * requirements changes, not on every keystroke.
 */
export function PasswordRequirements({
  requirements,
}: PasswordRequirementsProps) {
  const t = useIamTranslations().resetPassword.requirements;
  const headingId = useId();
  const satisfiedCount = requirements.filter(
    (requirement) => requirement.satisfied,
  ).length;
  const summary = t.summary.replace('{count}', String(satisfiedCount));

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg bg-alivia-primary-mist/50 px-4 py-3.5"
    >
      <h2
        id={headingId}
        className="text-sm font-medium text-alivia-text"
      >
        {t.heading}
      </h2>
      <p aria-live="polite" className="sr-only">
        {summary}
      </p>
      <ul className="mt-3 space-y-2">
        {requirements.map((requirement) => (
          <RequirementRow
            key={requirement.id}
            requirement={requirement}
            label={t.items[requirement.id]}
          />
        ))}
      </ul>
    </section>
  );
}

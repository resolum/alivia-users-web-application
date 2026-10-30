import type { ActivityState } from '../../domain/model/care-activity.entity.ts';
import { GUEST_STATE } from '../assistance-labels.ts';

export function GuestStatePill({ state }: { readonly state: ActivityState }) {
  const meta = GUEST_STATE[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${meta.tone}`}>
      <meta.icon className="size-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

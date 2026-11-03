import { useEffect, useState } from 'react';
import { loadAvailableSlots } from '../../application/evaluation.store.ts';
import type { EvaluationSlot } from '../../domain/model/evaluation-slot.ts';

/** Windows that other families hold disappear, and come back when they are released, so the list refreshes itself. */
const REFRESH_MS = 30_000;

/** Slots are read again each time the family comes to choose, and every 30 seconds while it chooses. */
export function useAvailableSlots(draftId: string | null, enabled = true) {
  const [slots, setSlots] = useState<readonly EvaluationSlot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    const load = () => loadAvailableSlots(draftId)
      .then((value) => { if (active) { setSlots(value); setError(null); } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'No pudimos cargar los horarios.'); });
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => { active = false; window.clearInterval(timer); };
  }, [draftId, enabled, reload]);

  const retry = () => {
    setSlots(null);
    setError(null);
    setReload((value) => value + 1);
  };

  return { slots, error, retry };
}

import { useEffect, useState } from 'react';
import { loadAvailableSlots } from '../../application/evaluation.store.ts';
import type { EvaluationSlot } from '../../domain/model/evaluation-slot.ts';

/** Slots are read again each time the family comes to choose, since other bookings take windows. */
export function useAvailableSlots(enabled = true) {
  const [slots, setSlots] = useState<readonly EvaluationSlot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void loadAvailableSlots()
      .then((value) => { if (active) setSlots(value); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'No pudimos cargar los horarios.'); });
    return () => { active = false; };
  }, [enabled, reload]);

  const retry = () => {
    setSlots(null);
    setError(null);
    setReload((value) => value + 1);
  };

  return { slots, error, retry };
}

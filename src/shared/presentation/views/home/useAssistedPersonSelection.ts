import { useState } from 'react';
import type { HomeAssistedPerson } from './home.view-model.ts';

const STORAGE_KEY = 'alivia.home.selected-assisted-person';

export interface AssistedPersonSelection {
  readonly selectedId: number | null;
  readonly select: (id: number) => void;
}

/** Reads the assisted person remembered for this tab, if any. */
export function readAssistedPersonId(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function persistId(id: number): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, String(id));
  } catch {
    console.error("No se pudo guardar la persona asistida seleccionada");
  }
}

/** Keeps the selected assisted person in memory and session storage. */
export function useAssistedPersonSelection(
  persons: readonly HomeAssistedPerson[],
): AssistedPersonSelection {
  const [storedId, setStoredId] = useState<number | null>(readAssistedPersonId);
  const selectedId = persons.some((person) => person.id === storedId)
    ? storedId
    : (persons[0]?.id ?? null);

  const select = (id: number) => {
    setStoredId(id);
    persistId(id);
  };

  return { selectedId, select };
}

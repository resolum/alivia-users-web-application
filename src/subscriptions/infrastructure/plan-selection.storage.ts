import { PlanSelection } from '../domain/model/plan-selection.ts';

const STORAGE_KEY = 'alivia.preliminary-plan-selection';

export function savePlanSelection(selection: PlanSelection): void {
  // Email verification normally opens in a new tab. sessionStorage is isolated per
  // tab, so the verified household flow would lose its draft and return to /plans.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
}

/** Removes the preliminary choice once the contracting journey is complete. */
export function clearPlanSelection(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function readPlanSelection(): PlanSelection | null {
  // Migrate selections created before they were made available across tabs.
  const stored = window.localStorage.getItem(STORAGE_KEY);
  const legacy = window.sessionStorage.getItem(STORAGE_KEY);
  const raw = stored ?? legacy;
  if (raw === null) return null;
  try {
    const selection = new PlanSelection(JSON.parse(raw) as ConstructorParameters<typeof PlanSelection>[0]);
    if (stored === null) {
      window.localStorage.setItem(STORAGE_KEY, raw);
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
    return selection;
  } catch {
    clearPlanSelection();
    return null;
  }
}

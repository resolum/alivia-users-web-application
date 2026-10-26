import { PlanSelection } from '../domain/model/plan-selection.ts';

const STORAGE_KEY = 'alivia.preliminary-plan-selection';

export function savePlanSelection(selection: PlanSelection): void {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
}

export function readPlanSelection(): PlanSelection | null {
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    return new PlanSelection(JSON.parse(raw) as ConstructorParameters<typeof PlanSelection>[0]);
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

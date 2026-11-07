import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanSelection } from '../domain/model/plan-selection.ts';
import { clearPlanSelection, readPlanSelection, savePlanSelection } from './plan-selection.storage.ts';

const storageKey = 'alivia.preliminary-plan-selection';
const selection = new PlanSelection({
  draftId: 'draft-1',
  planCode: 'MINIMUM',
  billingPeriod: 'MONTHLY',
  amount: 99,
  selectedAt: '2026-11-03T10:00:00Z',
});

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

vi.stubGlobal('window', {
  localStorage: memoryStorage(),
  sessionStorage: memoryStorage(),
});

describe('plan selection storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('persists the selection in storage shared by browser tabs', () => {
    savePlanSelection(selection);

    expect(window.localStorage.getItem(storageKey)).not.toBeNull();
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
    expect(readPlanSelection()).toEqual(selection);
  });

  it('migrates a selection saved by an older version in session storage', () => {
    window.sessionStorage.setItem(storageKey, JSON.stringify(selection));

    expect(readPlanSelection()).toEqual(selection);
    expect(window.localStorage.getItem(storageKey)).not.toBeNull();
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
  });

  it('clears both current and legacy selections after activation', () => {
    window.localStorage.setItem(storageKey, JSON.stringify(selection));
    window.sessionStorage.setItem(storageKey, JSON.stringify(selection));

    clearPlanSelection();

    expect(window.localStorage.getItem(storageKey)).toBeNull();
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
  });
});

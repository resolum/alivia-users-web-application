import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.stubGlobal('window', { localStorage: memoryStorage(), sessionStorage: memoryStorage() });

const { clearContractingInProgress } = await import('./contracting-session.ts');

describe('clearContractingInProgress', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('forgets the plan, its request and the payment keys of the signed-out family', () => {
    window.localStorage.setItem('alivia.preliminary-plan-selection', '{"draftId":"d1"}');
    window.sessionStorage.setItem('alivia.preliminary-plan-selection', '{"draftId":"d0"}');
    window.sessionStorage.setItem('alivia.payment-setup-key.d1', 'k1');
    window.sessionStorage.setItem('alivia.preauthorization-key.d1', 'k2');
    window.sessionStorage.setItem('alivia.other', 'keep');

    clearContractingInProgress();

    expect(window.localStorage.getItem('alivia.preliminary-plan-selection')).toBeNull();
    expect(window.sessionStorage.getItem('alivia.preliminary-plan-selection')).toBeNull();
    expect(window.sessionStorage.getItem('alivia.payment-setup-key.d1')).toBeNull();
    expect(window.sessionStorage.getItem('alivia.preauthorization-key.d1')).toBeNull();
    expect(window.sessionStorage.getItem('alivia.other')).toBe('keep');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../infrastructure/my-contracting-api.ts', () => ({
  myContractingApi: { mine: vi.fn(), claim: vi.fn() },
}));
vi.mock('../infrastructure/plan-selection.storage.ts', () => ({
  clearPlanSelection: vi.fn(),
  readPlanSelection: vi.fn(),
  savePlanSelection: vi.fn(),
}));

import { MyContracting } from '../domain/model/my-contracting.ts';
import { PlanSelection } from '../domain/model/plan-selection.ts';
import { myContractingApi } from '../infrastructure/my-contracting-api.ts';
import { clearPlanSelection, readPlanSelection, savePlanSelection } from '../infrastructure/plan-selection.storage.ts';
import { loadMyContracting } from './my-contracting.store.ts';

const mine = (stage: MyContracting['stage'], active = false) =>
  new MyContracting({ draftId: 'd1', stage, active, planCode: 'CUSTOM', billingCycle: 'MONTHLY' });

describe('MyContracting', () => {
  it('sends the family back to the step it is on until Activación', () => {
    expect(mine('CONFIGURATION').pendingPath).toBe('/contract/configuration');
    expect(mine('EVALUATION').pendingPath).toBe('/contract/tracking');
    expect(mine('INSTALLATION').pendingPath).toBe('/contract/tracking');
    expect(mine('NOT_VIABLE').pendingPath).toBe('/contract/tracking');
    expect(mine('ACTIVATION').pendingPath).toBeNull();
  });
});

describe('loadMyContracting', () => {
  beforeEach(() => vi.clearAllMocks());

  it('links the request of this browser to the account before reading it', async () => {
    vi.mocked(readPlanSelection).mockReturnValue(new PlanSelection({
      draftId: 'd1', planCode: 'CUSTOM', billingPeriod: 'MONTHLY', amount: 179, selectedAt: '2026-11-03T10:00:00Z',
    }));
    vi.mocked(myContractingApi.claim).mockResolvedValue(mine('INSTALLATION'));
    vi.mocked(myContractingApi.mine).mockResolvedValue(mine('INSTALLATION'));

    expect((await loadMyContracting())?.stage).toBe('INSTALLATION');
    expect(myContractingApi.claim).toHaveBeenCalledWith('d1');
    expect(savePlanSelection).not.toHaveBeenCalled();
  });

  it('restores in another browser the request linked to the account, and ignores a request it cannot claim', async () => {
    vi.mocked(readPlanSelection).mockReturnValue(null);
    vi.mocked(myContractingApi.mine).mockResolvedValue(mine('CONFIRMATION'));
    await loadMyContracting();
    expect(myContractingApi.claim).not.toHaveBeenCalled();
    expect(vi.mocked(savePlanSelection).mock.calls[0][0].draftId).toBe('d1');

    vi.mocked(readPlanSelection).mockReturnValue(new PlanSelection({
      draftId: 'other', planCode: 'MINIMUM', billingPeriod: 'MONTHLY', amount: 99, selectedAt: '2026-11-03T10:00:00Z',
    }));
    vi.mocked(myContractingApi.claim).mockRejectedValue(new Error('409'));
    vi.mocked(myContractingApi.mine).mockResolvedValue(null);
    expect(await loadMyContracting()).toBeNull();
  });

  it('clears the preliminary browser draft only after Activación was linked to the account', async () => {
    vi.mocked(readPlanSelection).mockReturnValue(new PlanSelection({
      draftId: 'd1', planCode: 'CUSTOM', billingPeriod: 'MONTHLY', amount: 179, selectedAt: '2026-11-03T10:00:00Z',
    }));
    vi.mocked(myContractingApi.claim).mockResolvedValue(mine('ACTIVATION'));
    vi.mocked(myContractingApi.mine).mockResolvedValue(mine('ACTIVATION'));

    expect((await loadMyContracting())?.pendingPath).toBeNull();
    expect(myContractingApi.claim).toHaveBeenCalledWith('d1');
    expect(clearPlanSelection).toHaveBeenCalledOnce();
  });
});

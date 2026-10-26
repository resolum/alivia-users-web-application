import { describe, expect, it } from 'vitest';
import { Plan } from './plan.entity.ts';

function plan(status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE') {
  return new Plan({
    id: 1,
    code: 'MINIMUM',
    name: 'Plan Base',
    description: 'Plan de prueba',
    status,
    currency: 'PEN',
    basePriceAmount: 99,
    minimumMonthlyAmount: 99,
    priceQualifier: 'FIXED',
    features: [],
    includedDevices: [],
  });
}

describe('Plan', () => {
  it('recognizes whether a plan can be selected', () => {
    expect(plan().isAvailable).toBe(true);
    expect(plan('INACTIVE').isAvailable).toBe(false);
  });

  it('applies the two-month saving to annual billing', () => {
    expect(plan().priceFor('MONTHLY')).toBe(99);
    expect(plan().priceFor('ANNUAL')).toBe(990);
  });
});

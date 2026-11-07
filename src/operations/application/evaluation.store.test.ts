import { describe, expect, it, vi } from 'vitest';

vi.mock('../infrastructure/appointments-api.ts', () => ({
  appointmentsApi: { schedule: vi.fn() },
}));
vi.mock('../infrastructure/evaluation.storage.ts', () => ({
  readChosenSlot: vi.fn(),
  saveBookedAppointment: vi.fn(),
  saveChosenSlot: vi.fn(),
}));

import { EvaluationSlot } from '../domain/model/evaluation-slot.ts';
import { appointmentsApi } from '../infrastructure/appointments-api.ts';
import { confirmEvaluation } from './evaluation.store.ts';

const slot = new EvaluationSlot({
  date: '2026-11-04', startTime: '08:00', endTime: '10:00', technicianId: 1, technicianName: 'Ana Torres', availableTechnicians: 2,
});

describe('confirmEvaluation', () => {
  it('sends one booking when it is called twice at once for the same draft', async () => {
    const schedule = vi.mocked(appointmentsApi.schedule);
    let resolve: (value: never) => void = () => {};
    schedule.mockReturnValue(new Promise((done) => { resolve = done; }));

    const first = confirmEvaluation('d1', slot, { directions: '' });
    const second = confirmEvaluation('d1', slot, { directions: '' });
    resolve({ id: 1 } as never);

    expect(await first).toEqual({ id: 1 });
    expect(await second).toEqual({ id: 1 });
    expect(schedule).toHaveBeenCalledTimes(1);
  });
});

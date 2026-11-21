import { describe, expect, it } from 'vitest';
import { CareActivity } from './care-activity.entity.ts';
import { CareShift } from './care-shift.entity.ts';
import { dueReminders } from './care-reminder.ts';
import { MedicationAdministration } from './medication-administration.entity.ts';

const shift = (caregiverId: string, startsAt: string) =>
  new CareShift({ id: `s-${caregiverId}`, caregiverId, caregiverName: 'Ana', startsAt, endsAt: '2026-11-21T20:00:00', notes: '' });

const activity = new CareActivity({
  id: 'a1', title: 'Almuerzo', type: 'nutrition', date: '2026-11-21', time: '13:00', durationMinutes: 45,
  repetition: 'none', caregiverId: 'c1', caregiverName: 'Ana', reminderMinutes: 10, notes: '', tag: null,
  status: 'scheduled', completedAt: null, completedByName: null,
});

const dose = (result: 'given' | null) =>
  new MedicationAdministration({
    id: 'm1@x', scheduleId: 'm1', medication: 'Losartán', dose: '50 mg', scheduledAt: new Date('2026-11-21T13:00:00').toISOString(),
    responsibleId: 'c1', responsibleName: 'Ana', result, recordedAt: null, recordedByName: null, reason: null, alertedAt: null,
  });

const sources = (overrides = {}) => ({
  caregiverId: 'c1', assistedPersonName: 'Alberto', shifts: [], activities: [], doses: [], ...overrides,
});

describe('dueReminders', () => {
  it('reminds only the responsible caregiver within the lead time', () => {
    const now = new Date('2026-11-21T07:40:00');
    const list = dueReminders(sources({ shifts: [shift('c1', '2026-11-21T08:00:00'), shift('c2', '2026-11-21T08:00:00')] }), now);
    expect(list.map((item) => item.id)).toEqual(['reminder-shift-s-c1']);
    expect(list[0].body).toContain('Alberto');
  });

  it('uses the activity lead time and drops it once started', () => {
    const early = dueReminders(sources({ activities: [activity] }), new Date('2026-11-21T12:45:00'));
    const onTime = dueReminders(sources({ activities: [activity] }), new Date('2026-11-21T12:55:00'));
    const late = dueReminders(sources({ activities: [activity] }), new Date('2026-11-21T13:01:00'));
    expect([early.length, onTime.length, late.length]).toEqual([0, 1, 0]);
  });

  it('skips doses that already have a result and never suggests a change', () => {
    const now = new Date('2026-11-21T12:50:00');
    expect(dueReminders(sources({ doses: [dose('given')] }), now)).toHaveLength(0);
    const [reminder] = dueReminders(sources({ doses: [dose(null)] }), now);
    expect(reminder.body).toMatch(/^Losartán 50 mg para Alberto a las/);
  });
});

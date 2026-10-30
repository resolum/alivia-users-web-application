import { describe, expect, it } from 'vitest';
import { CareActivity, clashingIds, periodOf, type CareActivityProps } from './care-activity.entity.ts';
import { InviteCaregiverCommand } from './invite-caregiver.command.ts';
import { ScheduleActivityCommand } from './schedule-activity.command.ts';

const activity = (id: string, time: string, changes: Partial<CareActivityProps> = {}) =>
  new CareActivity({
    id, title: 'Aseo', type: 'hygiene', date: '2026-10-29', time, durationMinutes: 30, repetition: 'none',
    caregiverId: 'c1', caregiverName: 'María', reminderMinutes: null, notes: '', tag: null,
    status: 'scheduled', completedAt: null, ...changes,
  });

describe('CareActivity', () => {
  const now = new Date('2026-10-29T12:00:00');

  it('derives what the caregiver sees from the clock', () => {
    expect(activity('a', '08:00').stateAt(now)).toBe('overdue');
    expect(activity('a', '15:00').stateAt(now)).toBe('pending');
    expect(activity('a', '09:00', { date: '2026-10-30' }).stateAt(now)).toBe('scheduled');
    expect(activity('a', '08:00', { status: 'completed' }).stateAt(now)).toBe('completed');
  });

  it('places activities in the part of the day', () => {
    expect(periodOf(activity('a', '11:59'))).toBe('morning');
    expect(periodOf(activity('a', '12:00'))).toBe('afternoon');
    expect(periodOf(activity('a', '19:30'))).toBe('night');
  });

  it('flags only live activities that share time', () => {
    const clashes = clashingIds([
      activity('a', '09:00'),
      activity('b', '09:15'),
      activity('c', '10:00'),
      activity('d', '09:00', { status: 'cancelled' }),
    ]);
    expect([...clashes].sort()).toEqual(['a', 'b']);
  });
});

describe('ScheduleActivityCommand', () => {
  const values = {
    title: 'Caminata', type: 'mobility' as const, date: '2026-10-29', time: '16:00', durationMinutes: 30,
    repetition: 'none' as const, caregiverId: 'c1', reminderMinutes: 15, notes: '',
  };

  it('rejects new activities in the past but lets edits keep them', () => {
    const now = new Date('2026-10-29T17:00:00');
    expect(new ScheduleActivityCommand(null, values).validate(now)).toEqual({ time: 'in_past' });
    expect(new ScheduleActivityCommand('act-1', values).validate(now)).toEqual({});
  });

  it('requires the essentials', () => {
    const errors = new ScheduleActivityCommand(null, { ...values, title: ' ', type: '', caregiverId: '' }).validate(new Date('2026-10-01'));
    expect(errors).toEqual({ title: 'required', type: 'required', caregiverId: 'required' });
  });
});

describe('InviteCaregiverCommand', () => {
  it('does not invite someone already in the network', () => {
    const command = new InviteCaregiverCommand(' Lucia.V@uni.edu.pe ', 'family', ['view_activities']);
    expect(command.validate(['lucia.v@uni.edu.pe'])).toEqual({ email: 'already_in_network' });
    expect(new InviteCaregiverCommand('x@y', '', []).validate()).toEqual({
      email: 'invalid_email',
      relationship: 'required',
      responsibilities: 'none_selected',
    });
  });
});

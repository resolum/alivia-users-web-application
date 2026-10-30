import { describe, expect, it } from 'vitest';
import { CareActivity } from '@/assistance/index.ts';
import { statusOf } from './home-data-source.ts';

const at = (time: string, status: 'scheduled' | 'completed' = 'scheduled') =>
  new CareActivity({
    id: 'a', title: 'Almuerzo', type: 'nutrition', date: '2026-10-29', time, durationMinutes: 60, repetition: 'none',
    caregiverId: 'c', caregiverName: 'Carlos', reminderMinutes: null, notes: '', tag: null, status, completedAt: null,
  });

describe('Home agenda status', () => {
  const now = new Date('2026-10-29T12:30:00');

  it('maps the agenda state to the timeline chips', () => {
    expect(statusOf(at('08:00', 'completed'), now)).toBe('COMPLETED');
    expect(statusOf(at('09:00'), now)).toBe('MISSED');
    expect(statusOf(at('12:00'), now)).toBe('IN_PROGRESS');
    expect(statusOf(at('19:00'), now)).toBe('SCHEDULED');
  });
});

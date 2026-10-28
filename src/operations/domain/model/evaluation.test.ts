import { describe, expect, it } from 'vitest';
import { isValidPeruvianMobile, toInternationalPhone } from './appointment.ts';
import { EvaluationSlot, formatLongDate, groupByDate, initials } from './evaluation-slot.ts';

const slot = (date: string, startTime: string) => new EvaluationSlot({
  date, startTime, endTime: `${String(Number(startTime.slice(0, 2)) + 2).padStart(2, '0')}:00`,
  technicianId: 7, technicianName: 'Ana Pérez', availableTechnicians: 1,
});

describe('EvaluationSlot', () => {
  it('groups windows by date and names the part of the day', () => {
    const groups = groupByDate([slot('2026-10-29', '08:00'), slot('2026-10-29', '13:00'), slot('2026-10-30', '10:00')]);
    expect([...groups.keys()]).toEqual(['2026-10-29', '2026-10-30']);
    expect(groups.get('2026-10-29')?.map((item) => item.period)).toEqual(['Mañana', 'Tarde']);
    expect(slot('2026-10-29', '08:00').key).toBe('2026-10-29T08:00');
  });

  it('rejects malformed windows', () => {
    expect(() => new EvaluationSlot({ ...slot('2026-10-29', '10:00').toProps(), endTime: '09:00' })).toThrow();
    expect(() => new EvaluationSlot({ ...slot('2026-10-29', '10:00').toProps(), date: '29/10' })).toThrow();
  });

  it('formats dates and names for the confirmation', () => {
    expect(formatLongDate('2026-10-29')).toBe('Jueves 29 de octubre, 2026');
    expect(initials('Ana María Pérez')).toBe('AM');
  });
});

describe('contact phone', () => {
  it('accepts Peruvian mobiles and adds the country code', () => {
    expect(isValidPeruvianMobile('984 123 456')).toBe(true);
    expect(isValidPeruvianMobile('+51 984123456')).toBe(true);
    expect(isValidPeruvianMobile('12345')).toBe(false);
    expect(toInternationalPhone('984 123 456')).toBe('+51984123456');
    expect(toInternationalPhone('51984123456')).toBe('+51984123456');
  });
});

import { describe, expect, it } from 'vitest';
import { AssignShiftCommand } from './assign-shift.command.ts';
import { CareShift, shiftConflicts } from './care-shift.entity.ts';
import { Caregiver } from './caregiver.entity.ts';
import { Handover, responsibleAt, type HandoverProps } from './handover.entity.ts';
import { dosesFor, MedicationAdministration, RecordAdministrationCommand } from './medication-administration.entity.ts';
import { MedicationSchedule, type MedicationScheduleProps } from './medication-schedule.entity.ts';
import { ScheduleMedicationCommand, SuspendMedicationCommand, UpdateMedicationCommand } from './medication.commands.ts';

const shift = (id: string, caregiverId: string, start: string, end: string) =>
  new CareShift({ id, caregiverId, caregiverName: caregiverId, startsAt: `2026-10-30T${start}:00`, endsAt: `2026-10-30T${end}:00`, notes: '' });

const handover = (status: HandoverProps['status'], changes: Partial<HandoverProps> = {}) =>
  new Handover({
    id: 'h', fromShiftId: 'a', toShiftId: 'b', fromCaregiverId: 'carlos', fromCaregiverName: 'carlos', toCaregiverId: 'maria',
    toCaregiverName: 'maria', status, requestedAt: '', respondedAt: null, escalatedAt: null, attended: [], pending: [], ...changes,
  });

describe('shifts', () => {
  const shifts = [shift('a', 'carlos', '08:00', '14:00'), shift('b', 'maria', '14:00', '22:00')];

  it('flags the same caregiver twice and a period already in someone else’s hands', () => {
    const kinds = shiftConflicts({ id: null, caregiverId: 'carlos', start: new Date('2026-10-30T13:00:00'), end: new Date('2026-10-30T15:00:00') }, shifts)
      .map((item) => item.kind)
      .sort();
    expect(kinds).toEqual(['period_taken', 'same_caregiver']);
    expect(shiftConflicts({ id: null, caregiverId: 'lucia', start: new Date('2026-10-30T22:00:00'), end: new Date('2026-10-30T23:00:00') }, shifts)).toEqual([]);
  });

  it('reads an end before the start as the next day', () => {
    const command = new AssignShiftCommand(null, { caregiverId: 'c', date: '2026-10-30', startTime: '22:00', endTime: '06:00', notes: '' });
    expect(command.end.getDate()).toBe(31);
    expect(new AssignShiftCommand(null, { caregiverId: '', date: '2026-10-30', startTime: '08:00', endTime: '08:00', notes: '' }).validate()).toEqual({
      caregiverId: 'required',
      endTime: 'end_before_start',
    });
  });

  it('keeps the outgoing caregiver in charge until the relief is confirmed', () => {
    const at = new Date('2026-10-30T15:00:00');
    expect(responsibleAt(shifts, [handover('pending')], at)).toMatchObject({ caregiverId: 'carlos', reason: 'holdover' });
    expect(responsibleAt(shifts, [handover('declined')], at)).toMatchObject({ caregiverId: 'carlos', reason: 'holdover' });
    expect(responsibleAt(shifts, [handover('accepted')], at)).toMatchObject({ caregiverId: 'maria', reason: 'shift' });
  });

  it('never hands over on its own when the relief was not even requested', () => {
    expect(responsibleAt(shifts, [], new Date('2026-10-30T15:00:00'))).toMatchObject({ caregiverId: 'carlos', reason: 'holdover' });
    // After the last shift nobody follows, so nobody is held over.
    expect(responsibleAt(shifts, [handover('accepted')], new Date('2026-10-30T23:00:00'))).toBeNull();
    const gap = [shift('a', 'carlos', '08:00', '12:00'), shift('b', 'maria', '14:00', '18:00')];
    expect(responsibleAt(gap, [], new Date('2026-10-30T13:00:00'))).toMatchObject({ caregiverId: 'carlos', reason: 'holdover' });
  });

  it('escalates an open relief once, after the waiting period', () => {
    const end = new Date('2026-10-30T14:00:00');
    expect(handover('pending').needsEscalation(end, new Date('2026-10-30T14:20:00'))).toBe(false);
    expect(handover('pending').needsEscalation(end, new Date('2026-10-30T14:31:00'))).toBe(true);
    expect(handover('pending', { escalatedAt: 'x' }).needsEscalation(end, new Date('2026-10-30T15:00:00'))).toBe(false);
    expect(handover('accepted').needsEscalation(end, new Date('2026-10-30T15:00:00'))).toBe(false);
  });
});

describe('medication schedules', () => {
  const revision = { dose: '500 mg', times: ['08:00'], frequency: 'daily' as const, indicationRef: 'Receta', recordedAt: '', recordedByName: '' };
  const props: MedicationScheduleProps = {
    id: 'm', medication: 'Metformina', assistedPersonId: 'ap', caregiverId: 'c', caregiverName: 'C', startDate: '2026-10-01', endDate: null,
    revisions: [revision, { ...revision, effectiveFrom: '2026-10-20', dose: '850 mg', times: ['08:00', '20:00'] }].map((item, index) => ({
      effectiveFrom: index === 0 ? '2026-10-01' : '2026-10-20',
      ...item,
    })),
    suspension: null,
  };

  it('applies a new indication only from its date and keeps the earlier one', () => {
    const plan = new MedicationSchedule(props);
    expect(plan.revisionOn('2026-10-19').dose).toBe('500 mg');
    expect(plan.dosesOn('2026-10-25')).toEqual(['08:00', '20:00']);
    expect(plan.revisions).toHaveLength(2);
  });

  it('lets the latest recorded indication win from its date, keeping every earlier one', () => {
    const later = { ...props.revisions[1], effectiveFrom: '2026-10-15', dose: '1000 mg', recordedAt: '2026-10-14T10:00:00' };
    const plan = new MedicationSchedule({ ...props, revisions: [...props.revisions, later] });
    expect(plan.revisionOn('2026-10-14').dose).toBe('500 mg');
    expect(plan.revisionOn('2026-10-25').dose).toBe('1000 mg');
    expect(plan.revisions).toHaveLength(3);
  });

  it('stops generating doses from the suspension date', () => {
    const plan = new MedicationSchedule({ ...props, suspension: { from: '2026-10-28', source: 'Dr.', recordedAt: '', recordedByName: '' } });
    expect(plan.dosesOn('2026-10-27')).toHaveLength(2);
    expect(plan.dosesOn('2026-10-28')).toEqual([]);
    expect(dosesFor([plan], new Date('2026-10-29T12:00:00'))).toEqual([]);
  });

  it('skips the off days of an every-other-day plan', () => {
    const plan = new MedicationSchedule({ ...props, revisions: [{ ...props.revisions[0], frequency: 'every_other_day' }] });
    expect(plan.dosesOn('2026-10-03')).toEqual(['08:00']);
    expect(plan.dosesOn('2026-10-04')).toEqual([]);
  });

  it('lists every missing required field and refuses changes without backing', () => {
    const errors = new ScheduleMedicationCommand({
      medication: ' ', dose: '1', times: [], frequency: '', startDate: '2026-10-30', endDate: '', caregiverId: 'c', assistedPersonId: '', indicationRef: 'x',
    }).validate();
    expect(errors).toEqual({ medication: 'required', times: 'required', frequency: 'required', assistedPersonId: 'required' });
    const update = new UpdateMedicationCommand('m', { dose: '1', times: ['08:00'], frequency: 'daily', effectiveFrom: '2026-10-30', indicationRef: '' });
    expect(update.validate('2026-10-30')).toEqual({ indicationRef: 'required' });
    expect(new SuspendMedicationCommand('m', '2026-10-01', 'Dr.').validate('2026-10-30')).toEqual({ effectiveFrom: 'in_past' });
  });
});

describe('administrations', () => {
  const dose = (changes: Partial<ConstructorParameters<typeof MedicationAdministration>[0]> = {}) =>
    new MedicationAdministration({
      id: 'm@x', scheduleId: 'm', medication: 'Losartán', dose: '50 mg', scheduledAt: '2026-10-30T09:00:00', responsibleId: 'c',
      responsibleName: 'C', result: null, recordedAt: null, recordedByName: null, reason: null, alertedAt: null, ...changes,
    });

  it('turns overdue once its window closes and marks late records', () => {
    expect(dose().stateAt(new Date('2026-10-30T09:30:00'))).toBe('pending');
    expect(dose().stateAt(new Date('2026-10-30T10:30:00'))).toBe('overdue');
    expect(dose({ result: 'given', recordedAt: '2026-10-30T11:00:00' }).isLate).toBe(true);
    expect(dose({ result: 'given', recordedAt: '2026-10-30T09:10:00' }).isLate).toBe(false);
  });

  it('needs a reason to omit a dose', () => {
    expect(new RecordAdministrationCommand('m@x', 'omitted', ' ').validate()).toBe('reason_required');
    expect(new RecordAdministrationCommand('m@x', 'given').validate()).toBeNull();
  });
});

describe('caregiver permissions and invitations', () => {
  const base = {
    id: 'c', fullName: 'C', email: 'c@x.pe', phone: null, role: 'additional' as const, relationship: 'family' as const,
    relationshipDetail: '', linkedSince: null, photoUrl: null, responsibilities: ['record_medications' as const],
  };

  it('lets a pending invitation lapse after its validity', () => {
    const invited = new Caregiver({ ...base, status: 'pending', invitedAt: '2026-10-01T10:00:00Z' });
    expect(invited.statusAt(new Date('2026-10-05T10:00:00Z'))).toBe('pending');
    expect(invited.statusAt(new Date('2026-10-09T10:00:00Z'))).toBe('expired');
  });

  it('grants only what was assigned, and nothing before joining', () => {
    const active = new Caregiver({ ...base, status: 'active', invitedAt: '' });
    expect(active.can('record_medications')).toBe(true);
    expect(active.can('manage_medications')).toBe(false);
    expect(new Caregiver({ ...base, status: 'pending', invitedAt: '' }).can('record_medications')).toBe(false);
  });
});

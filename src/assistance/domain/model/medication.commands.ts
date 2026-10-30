import type { Frequency } from './medication-schedule.entity.ts';

export type MedicationField =
  | 'medication'
  | 'dose'
  | 'times'
  | 'frequency'
  | 'startDate'
  | 'endDate'
  | 'caregiverId'
  | 'assistedPersonId'
  | 'indicationRef'
  | 'effectiveFrom'
  | 'source';
export type MedicationFieldError = 'required' | 'invalid_time' | 'duplicate_time' | 'end_before_start' | 'in_past';

type Errors = Partial<Record<MedicationField, MedicationFieldError>>;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateTimes(times: readonly string[], errors: Errors) {
  if (times.length === 0) errors.times = 'required';
  else if (times.some((time) => !TIME.test(time))) errors.times = 'invalid_time';
  else if (new Set(times).size !== times.length) errors.times = 'duplicate_time';
}

export interface ScheduleMedicationValues {
  readonly medication: string;
  readonly dose: string;
  readonly times: readonly string[];
  readonly frequency: Frequency | '';
  readonly startDate: string;
  readonly endDate: string;
  readonly caregiverId: string;
  readonly assistedPersonId: string;
  readonly indicationRef: string;
}

/** Register the schedule of a medication that was already indicated; it never sets the indication itself. */
export class ScheduleMedicationCommand {
  readonly values: ScheduleMedicationValues;

  constructor(values: ScheduleMedicationValues) {
    this.values = {
      ...values,
      medication: values.medication.trim(),
      dose: values.dose.trim(),
      indicationRef: values.indicationRef.trim(),
      times: [...values.times].sort(),
    };
  }

  validate(): Errors {
    const { medication, dose, times, frequency, startDate, endDate, caregiverId, assistedPersonId, indicationRef } = this.values;
    const errors: Errors = {};
    if (medication === '') errors.medication = 'required';
    if (dose === '') errors.dose = 'required';
    validateTimes(times, errors);
    if (frequency === '') errors.frequency = 'required';
    if (startDate === '') errors.startDate = 'required';
    if (endDate !== '' && startDate !== '' && endDate < startDate) errors.endDate = 'end_before_start';
    if (caregiverId === '') errors.caregiverId = 'required';
    if (assistedPersonId === '') errors.assistedPersonId = 'required';
    if (indicationRef === '') errors.indicationRef = 'required';
    return errors;
  }
}

export interface UpdateMedicationValues {
  readonly dose: string;
  readonly times: readonly string[];
  readonly frequency: Frequency | '';
  readonly effectiveFrom: string;
  /** The new indication that backs the change; without it the change is rejected. */
  readonly indicationRef: string;
}

/** A change of dose, frequency or times, applied from `effectiveFrom` without touching earlier days. */
export class UpdateMedicationCommand {
  readonly scheduleId: string;
  readonly values: UpdateMedicationValues;

  constructor(scheduleId: string, values: UpdateMedicationValues) {
    this.scheduleId = scheduleId;
    this.values = { ...values, dose: values.dose.trim(), indicationRef: values.indicationRef.trim(), times: [...values.times].sort() };
  }

  validate(today: string): Errors {
    const { dose, times, frequency, effectiveFrom, indicationRef } = this.values;
    const errors: Errors = {};
    if (dose === '') errors.dose = 'required';
    validateTimes(times, errors);
    if (frequency === '') errors.frequency = 'required';
    if (effectiveFrom === '') errors.effectiveFrom = 'required';
    else if (effectiveFrom < today) errors.effectiveFrom = 'in_past';
    if (indicationRef === '') errors.indicationRef = 'required';
    return errors;
  }
}

/** Stop a schedule because an authorized source suspended the indication. */
export class SuspendMedicationCommand {
  readonly scheduleId: string;
  readonly from: string;
  readonly source: string;

  constructor(scheduleId: string, from: string, source: string) {
    this.scheduleId = scheduleId;
    this.from = from;
    this.source = source.trim();
  }

  validate(today: string): Errors {
    const errors: Errors = {};
    if (this.from === '') errors.effectiveFrom = 'required';
    else if (this.from < today) errors.effectiveFrom = 'in_past';
    if (this.source === '') errors.source = 'required';
    return errors;
  }
}

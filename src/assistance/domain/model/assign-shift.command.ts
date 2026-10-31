export type ShiftField = 'caregiverId' | 'date' | 'startTime' | 'endTime';
export type ShiftFieldError = 'required' | 'end_before_start';

export interface AssignShiftValues {
  readonly caregiverId: string;
  /** Local yyyy-mm-dd the shift starts on. */
  readonly date: string;
  readonly startTime: string;
  /** An end time earlier than the start means the shift ends the next day. */
  readonly endTime: string;
  readonly notes: string;
}

/** Create or edit a shift. `shiftId` is null for a new one. */
export class AssignShiftCommand {
  readonly shiftId: string | null;
  readonly values: AssignShiftValues;

  constructor(shiftId: string | null, values: AssignShiftValues) {
    this.shiftId = shiftId;
    this.values = { ...values, notes: values.notes.trim() };
  }

  get start(): Date {
    return new Date(`${this.values.date}T${this.values.startTime}:00`);
  }

  get end(): Date {
    const end = new Date(`${this.values.date}T${this.values.endTime}:00`);
    if (end <= this.start) end.setDate(end.getDate() + 1);
    return end;
  }

  validate(): Partial<Record<ShiftField, ShiftFieldError>> {
    const { caregiverId, date, startTime, endTime } = this.values;
    const errors: Partial<Record<ShiftField, ShiftFieldError>> = {};
    if (caregiverId === '') errors.caregiverId = 'required';
    if (date === '') errors.date = 'required';
    if (startTime === '') errors.startTime = 'required';
    if (endTime === '') errors.endTime = 'required';
    else if (endTime === startTime) errors.endTime = 'end_before_start';
    return errors;
  }
}

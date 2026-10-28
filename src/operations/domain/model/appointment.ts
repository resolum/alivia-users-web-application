export interface AppointmentProps {
  readonly id: number;
  readonly draftId: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly technicianId: number;
  readonly technicianName: string;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly directions: string | null;
}

/** The technical evaluation already booked, with the technician who will attend it. */
export class Appointment {
  readonly id: number;
  readonly draftId: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly technicianId: number;
  readonly technicianName: string;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly directions: string | null;

  constructor(props: AppointmentProps) {
    this.id = props.id;
    this.draftId = props.draftId;
    this.date = props.date;
    this.startTime = props.startTime;
    this.endTime = props.endTime;
    this.technicianId = props.technicianId;
    this.technicianName = props.technicianName;
    this.contactName = props.contactName;
    this.contactPhone = props.contactPhone;
    this.directions = props.directions;
  }
}

export interface EvaluationContact {
  readonly name: string;
  readonly phone: string;
  readonly directions: string;
}

/** Peruvian mobile: 9 digits starting with 9, with or without the +51 prefix. */
export function isValidPeruvianMobile(value: string): boolean {
  return /^(\+?51)?9\d{8}$/.test(value.replace(/[\s-]/g, ''));
}

/** Sends the mobile with the country code, as the backend stores it. */
export function toInternationalPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('51') && digits.length === 11 ? `+${digits}` : `+51${digits}`;
}

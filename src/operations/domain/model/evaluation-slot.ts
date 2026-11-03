export interface EvaluationSlotProps {
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly technicianId: number;
  readonly technicianName: string;
  readonly availableTechnicians: number;
}

/** A two-hour window in which one technician of Alivia can visit the home for the evaluation. */
export class EvaluationSlot {
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly technicianId: number;
  readonly technicianName: string;
  readonly availableTechnicians: number;

  constructor(props: EvaluationSlotProps) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(props.date)) throw new Error('The slot date is invalid');
    if (props.startTime >= props.endTime) throw new Error('The slot must end after it starts');
    this.date = props.date;
    this.startTime = props.startTime;
    this.endTime = props.endTime;
    this.technicianId = props.technicianId;
    this.technicianName = props.technicianName;
    this.availableTechnicians = props.availableTechnicians;
  }

  /** The window and the technician: what the family picks. */
  get key(): string {
    return `${this.windowKey}#${String(this.technicianId)}`;
  }

  /** The window alone, shared by every technician free in it. */
  get windowKey(): string {
    return `${this.date}T${this.startTime}`;
  }

  /** "Mañana" before 12:00, "Tarde" after. */
  get period(): 'Mañana' | 'Tarde' {
    return this.startTime < '12:00' ? 'Mañana' : 'Tarde';
  }

  toProps(): EvaluationSlotProps {
    return {
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      technicianId: this.technicianId,
      technicianName: this.technicianName,
      availableTechnicians: this.availableTechnicians,
    };
  }
}

/** Slots grouped by date, in the order the backend returned them. */
export function groupByDate(slots: readonly EvaluationSlot[]): ReadonlyMap<string, readonly EvaluationSlot[]> {
  const groups = new Map<string, EvaluationSlot[]>();
  for (const slot of slots) groups.set(slot.date, [...(groups.get(slot.date) ?? []), slot]);
  return groups;
}

/** One arrival window of a day with the technicians free in it, least busy first. */
export interface SlotWindow {
  readonly key: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly period: 'Mañana' | 'Tarde';
  readonly technicians: readonly EvaluationSlot[];
}

/** The slots of one day grouped by window, in time order. */
export function groupByWindow(slots: readonly EvaluationSlot[]): readonly SlotWindow[] {
  const windows = new Map<string, EvaluationSlot[]>();
  for (const slot of slots) windows.set(slot.windowKey, [...(windows.get(slot.windowKey) ?? []), slot]);
  return [...windows.entries()]
    .map(([key, technicians]) => {
      const first = technicians[0] as EvaluationSlot;
      return { key, startTime: first.startTime, endTime: first.endTime, period: first.period, technicians };
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

const LONG_DATE = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** "miércoles, 29 de octubre de 2026" -> "Miércoles 29 de octubre, 2026" */
export function formatLongDate(date: string): string {
  const parts = LONG_DATE.formatToParts(new Date(`${date}T00:00:00Z`));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  const weekday = value('weekday');
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${value('day')} de ${value('month')}, ${value('year')}`;
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase() ?? '').join('');
}

import { addDays, toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { LocalCollection } from '@/shared/infrastructure/local-collection.ts';
import type { AdministrationProps } from '../domain/model/medication-administration.entity.ts';
import { administrationId, dosesFor } from '../domain/model/medication-administration.entity.ts';
import type { CareShiftProps } from '../domain/model/care-shift.entity.ts';
import type { HandoverProps } from '../domain/model/handover.entity.ts';
import { MedicationSchedule, type MedicationScheduleProps } from '../domain/model/medication-schedule.entity.ts';

/** Example data around the current hour, so the relief and the overdue states are visible on any day. */
const MARIA = { caregiverId: 'cg-principal', caregiverName: 'María Elena Villanueva' };
const CARLOS = { caregiverId: 'cg-carlos', caregiverName: 'Carlos Villanueva Carrión' };

const hourFromNow = (hours: number) => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};
const atDay = (days: number, time: string) => new Date(`${toIsoDate(addDays(new Date(), days))}T${time}:00`).toISOString();
const day = (days: number) => toIsoDate(addDays(new Date(), days));

export const shifts = new LocalCollection<CareShiftProps>('alivia.assistance.shifts', () => [
  { id: 'sh-1', ...MARIA, startsAt: atDay(-1, '08:00'), endsAt: atDay(-1, '16:00'), notes: '' },
  { id: 'sh-2', ...CARLOS, startsAt: atDay(-1, '16:00'), endsAt: atDay(-1, '23:00'), notes: '' },
  // The running shift ends in about an hour and its relief is still waiting for María.
  { id: 'sh-3', ...CARLOS, startsAt: hourFromNow(-5), endsAt: hourFromNow(1), notes: 'Cubre la mañana mientras María trabaja.' },
  { id: 'sh-4', ...MARIA, startsAt: hourFromNow(1), endsAt: hourFromNow(9), notes: '' },
  { id: 'sh-5', ...MARIA, startsAt: atDay(1, '08:00'), endsAt: atDay(1, '14:00'), notes: '' },
  { id: 'sh-6', ...CARLOS, startsAt: atDay(1, '14:00'), endsAt: atDay(1, '22:00'), notes: 'Lleva a Don Alberto a terapia a las 16:00.' },
  { id: 'sh-7', ...MARIA, startsAt: atDay(2, '08:00'), endsAt: atDay(2, '20:00'), notes: '' },
]);

export const handovers = new LocalCollection<HandoverProps>('alivia.assistance.handovers', () => [
  {
    id: 'ho-1',
    fromShiftId: 'sh-1',
    toShiftId: 'sh-2',
    fromCaregiverId: MARIA.caregiverId,
    fromCaregiverName: MARIA.caregiverName,
    toCaregiverId: CARLOS.caregiverId,
    toCaregiverName: CARLOS.caregiverName,
    status: 'accepted',
    requestedAt: atDay(-1, '15:30'),
    respondedAt: atDay(-1, '15:41'),
    escalatedAt: null,
    attended: ['Almuerzo nutritivo y balanceado · 13:00 · completada', 'Losartán 50 mg · 09:00 · administrado'],
    pending: ['Metformina 850 mg · 20:00'],
  },
  {
    id: 'ho-2',
    fromShiftId: 'sh-3',
    toShiftId: 'sh-4',
    fromCaregiverId: CARLOS.caregiverId,
    fromCaregiverName: CARLOS.caregiverName,
    toCaregiverId: MARIA.caregiverId,
    toCaregiverName: MARIA.caregiverName,
    status: 'pending',
    requestedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    respondedAt: null,
    escalatedAt: null,
    attended: ['Aseo personal matutino · 08:00 · completada', 'Losartán 50 mg · 09:00 · administrado'],
    pending: ['Caminata asistida en el patio · 16:30', 'Metformina 850 mg · 20:00'],
  },
]);

const revision = (effectiveFrom: string, dose: string, times: string[], indicationRef: string) => ({
  effectiveFrom,
  dose,
  times,
  frequency: 'daily' as const,
  indicationRef,
  recordedAt: new Date(`${effectiveFrom}T10:00:00`).toISOString(),
  recordedByName: MARIA.caregiverName,
});

export const medications = new LocalCollection<MedicationScheduleProps>('alivia.assistance.medications', () => [
  {
    id: 'med-losartan',
    medication: 'Losartán',
    assistedPersonId: 'ap-alberto',
    ...MARIA,
    startDate: day(-60),
    endDate: null,
    revisions: [revision(day(-60), '50 mg, 1 tableta', ['09:00'], 'Receta Dr. Paredes (cardiología)')],
    suspension: null,
  },
  {
    id: 'med-metformina',
    medication: 'Metformina',
    assistedPersonId: 'ap-alberto',
    ...CARLOS,
    startDate: day(-30),
    endDate: null,
    revisions: [
      revision(day(-30), '500 mg, 1 tableta', ['08:00', '20:00'], 'Receta Dra. Salas (endocrinología)'),
      revision(day(-10), '850 mg, 1 tableta', ['08:00', '20:00'], 'Control Dra. Salas: ajuste de dosis'),
    ],
    suspension: null,
  },
  {
    id: 'med-omeprazol',
    medication: 'Omeprazol',
    assistedPersonId: 'ap-alberto',
    ...MARIA,
    startDate: day(-20),
    endDate: day(10),
    revisions: [revision(day(-20), '20 mg, 1 cápsula en ayunas', ['07:30'], 'Receta Dr. Paredes')],
    suspension: { from: day(-3), source: 'Indicación Dr. Paredes por teleconsulta', recordedAt: atDay(-3, '11:00'), recordedByName: MARIA.caregiverName },
  },
]);

const record = (
  scheduleId: string,
  medication: string,
  dose: string,
  scheduledAt: string,
  who: typeof MARIA,
  result: AdministrationProps['result'],
  recordedAt: string | null,
  reason: string | null = null,
): AdministrationProps => ({
  id: administrationId(scheduleId, scheduledAt),
  scheduleId,
  medication,
  dose,
  scheduledAt,
  responsibleId: who.caregiverId,
  responsibleName: who.caregiverName,
  result,
  recordedAt,
  recordedByName: result ? who.caregiverName : null,
  reason,
  alertedAt: null,
});

const SEED_DAYS = 14;

/**
 * Only doses with a result are stored; the rest are derived from the schedules.
 * The past two weeks were given on time except a late one, an omission, and
 * one left without a result so the overdue alert shows.
 */
export const administrations = new LocalCollection<AdministrationProps>('alivia.assistance.administrations.v2', () => {
  const special = [
    record('med-metformina', 'Metformina', '850 mg, 1 tableta', atDay(-1, '08:00'), CARLOS, 'given', atDay(-1, '09:40')),
    record('med-metformina', 'Metformina', '850 mg, 1 tableta', atDay(-1, '20:00'), CARLOS, 'omitted', atDay(-1, '20:10'), 'Don Alberto no cenó y se negó a tomarla.'),
    record('med-losartan', 'Losartán', '50 mg, 1 tableta', atDay(0, '09:00'), MARIA, 'given', atDay(0, '09:02')),
  ];
  const leftOverdue = administrationId('med-metformina', atDay(-2, '20:00'));
  const plans = medications.all().map((props) => new MedicationSchedule(props));
  const past = Array.from({ length: SEED_DAYS }, (_, index) => dosesFor(plans, addDays(new Date(), index - SEED_DAYS))).flat();
  const onTime = past
    .filter((item) => item.id !== leftOverdue && !special.some((done) => done.id === item.id))
    .map((item) => ({
      ...item,
      result: 'given' as const,
      recordedAt: new Date(new Date(item.scheduledAt).getTime() + 5 * 60_000).toISOString(),
      recordedByName: item.responsibleName,
    }));
  return [...onTime, ...special];
});

export interface NetworkLogEntry {
  readonly id: string;
  readonly at: string;
  readonly text: string;
}

/** Audit trail of changes to the care network (invitations, links, removals). */
export const networkLog = new LocalCollection<NetworkLogEntry>('alivia.assistance.network-log', () => [
  { id: 'log-1', at: atDay(-10, '18:20'), text: 'María Elena Villanueva invitó a lucia.v@uni.edu.pe.' },
  { id: 'log-2', at: atDay(-2, '09:12'), text: 'María Elena Villanueva invitó a dra.sofia.mendoza@clinica.pe.' },
]);

export function logNetworkChange(text: string) {
  networkLog.save({ id: crypto.randomUUID(), at: new Date().toISOString(), text });
}

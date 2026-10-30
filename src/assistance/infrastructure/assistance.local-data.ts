import { addDays, toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { LocalCollection } from '@/shared/infrastructure/local-collection.ts';
import type { AssistedPersonProps } from '../domain/model/assisted-person.entity.ts';
import type { CareActivityProps } from '../domain/model/care-activity.entity.ts';
import type { CaregiverProps } from '../domain/model/caregiver.entity.ts';

/** Example household taken from the Figma screens; replaced by the API once its contract exists. */
export const SAMPLE_HOUSEHOLD = {
  householdAlias: 'Hogar Don Alberto',
  assistedPersonName: 'Don Alberto Villanueva',
} as const;

export const assistedPersons = new LocalCollection<AssistedPersonProps>('alivia.assistance.assisted-persons', () => [
  {
    id: 'ap-alberto',
    firstName: 'Alberto',
    lastName: 'Villanueva Carrión',
    documentType: 'DNI',
    documentNumber: '08472910',
    documentValidated: true,
    birthDate: '1942-05-14',
    kinship: 'Padre',
    phone: '+51 912 345 678',
    photoUrl: null,
    householdAlias: SAMPLE_HOUSEHOLD.householdAlias,
    principalCaregiverName: 'María Elena Villanueva',
    principalCaregiverKinship: 'Hija',
  },
]);

const daysAgo = (days: number) => addDays(new Date(), -days).toISOString();

export const caregivers = new LocalCollection<CaregiverProps>('alivia.assistance.caregivers', () => [
  {
    id: 'cg-principal',
    fullName: 'María Elena Villanueva',
    email: 'm.villanueva@gmail.com',
    phone: '+51 984 123 456',
    role: 'principal',
    relationship: 'family',
    relationshipDetail: 'Hija de la persona asistida',
    status: 'active',
    responsibilities: ['view_activities', 'manage_activities', 'receive_notifications', 'view_devices', 'receive_device_alerts'],
    linkedSince: '2024-09-12',
    invitedAt: '2024-09-12',
    photoUrl: null,
  },
  {
    id: 'cg-carlos',
    fullName: 'Carlos Villanueva Carrión',
    email: 'carlos.villanueva@outlook.com',
    phone: '+51 987 654 321',
    role: 'additional',
    relationship: 'family',
    relationshipDetail: 'Hijo',
    status: 'active',
    responsibilities: ['view_activities', 'manage_activities', 'receive_notifications'],
    linkedSince: '2024-10-02',
    invitedAt: '2024-09-30',
    photoUrl: null,
  },
  {
    id: 'cg-sofia',
    fullName: 'Dra. Sofía Mendoza',
    email: 'dra.sofia.mendoza@clinica.pe',
    phone: null,
    role: 'additional',
    relationship: 'health_professional',
    relationshipDetail: 'Cuidadora externa',
    status: 'pending',
    responsibilities: ['view_activities', 'receive_notifications'],
    linkedSince: null,
    invitedAt: daysAgo(2),
    photoUrl: null,
  },
  {
    id: 'cg-lucia',
    fullName: 'Lucía Villanueva Romero',
    email: 'lucia.v@uni.edu.pe',
    phone: null,
    role: 'additional',
    relationship: 'family',
    relationshipDetail: 'Nieta',
    status: 'expired',
    responsibilities: ['view_activities'],
    linkedSince: null,
    invitedAt: daysAgo(10),
    photoUrl: null,
  },
]);

type Seed = Omit<CareActivityProps, 'id' | 'date' | 'status' | 'completedAt' | 'repetition' | 'reminderMinutes'> &
  Partial<Pick<CareActivityProps, 'repetition' | 'reminderMinutes'>> & {
    readonly day: number;
    readonly done?: boolean;
    readonly cancelled?: boolean;
  };

const MARIA = { caregiverId: 'cg-principal', caregiverName: 'María Elena V.' };
const CARLOS = { caregiverId: 'cg-carlos', caregiverName: 'Carlos Rodríguez' };

/** Offsets are relative to today so the agenda always has something to show around the current week. */
const ACTIVITY_SEEDS: readonly Seed[] = [
  { day: -1, time: '08:00', title: 'Aseo personal matutino', type: 'hygiene', durationMinutes: 30, notes: 'Baño asistido y cambio de ropa seca.', tag: null, done: true, ...MARIA },
  { day: -1, time: '13:00', title: 'Almuerzo nutritivo y balanceado', type: 'nutrition', durationMinutes: 45, notes: 'Comedor principal.', tag: null, done: true, ...CARLOS },
  { day: 0, time: '08:00', title: 'Aseo personal matutino', type: 'hygiene', durationMinutes: 30, notes: 'Baño asistido y cambio de ropa seca.', tag: null, done: true, ...MARIA },
  { day: 0, time: '09:00', title: 'Losartán 50 mg', type: 'medication', durationMinutes: null, notes: 'Toma matutina con agua.', tag: 'Previamente indicado', done: true, ...MARIA },
  { day: 0, time: '13:00', title: 'Almuerzo nutritivo y balanceado', type: 'nutrition', durationMinutes: 45, notes: 'Servir comida tibia, verificar agua y evitar sal añadida.', tag: null, repetition: 'daily', reminderMinutes: 15, ...CARLOS },
  { day: 0, time: '15:30', title: 'Hidratación asistida y fruta', type: 'hydration', durationMinutes: 20, notes: 'Vaso con agua y porción pequeña.', tag: null, ...MARIA },
  { day: 0, time: '16:30', title: 'Caminata asistida en el patio', type: 'mobility', durationMinutes: 20, notes: 'Con apoyo. Llevar bastón y calzado ajustado.', tag: null, ...CARLOS },
  { day: 0, time: '19:30', title: 'Cena ligera', type: 'nutrition', durationMinutes: 30, notes: 'Comedor o habitación.', tag: null, ...MARIA },
  { day: 0, time: '21:00', title: 'Sesión de lectura y relajación', type: 'leisure', durationMinutes: 30, notes: 'Pausada por descanso temprano.', tag: null, cancelled: true, ...CARLOS },
  { day: 1, time: '08:30', title: 'Higiene bucal', type: 'hygiene', durationMinutes: 15, notes: '', tag: null, ...MARIA },
  { day: 1, time: '09:00', title: 'Losartán 50 mg', type: 'medication', durationMinutes: null, notes: 'Toma matutina con agua.', tag: 'Previamente indicado', ...MARIA },
  { day: 2, time: '09:00', title: 'Losartán 50 mg', type: 'medication', durationMinutes: null, notes: 'Toma matutina con agua.', tag: 'Previamente indicado', ...MARIA },
  { day: 2, time: '09:00', title: 'Movilidad de piernas', type: 'mobility', durationMinutes: 30, notes: 'Ejercicios suaves sentado.', tag: null, ...CARLOS },
  { day: 2, time: '11:00', title: 'Paseo por el parque', type: 'mobility', durationMinutes: 45, notes: '', tag: null, ...CARLOS },
  { day: 3, time: '08:00', title: 'Aseo personal matutino', type: 'hygiene', durationMinutes: 30, notes: '', tag: null, ...MARIA },
  { day: 3, time: '13:00', title: 'Almuerzo nutritivo y balanceado', type: 'nutrition', durationMinutes: 45, notes: '', tag: null, ...CARLOS },
  { day: 4, time: '10:00', title: 'Reunión familiar', type: 'social', durationMinutes: 60, notes: 'Visita de los nietos.', tag: null, ...MARIA },
  { day: 5, time: '16:00', title: 'Descanso y música', type: 'leisure', durationMinutes: 45, notes: '', tag: null, ...CARLOS },
];

export const activities = new LocalCollection<CareActivityProps>('alivia.assistance.activities', () => {
  const today = new Date();
  return ACTIVITY_SEEDS.map(({ day, done, cancelled, ...seed }, index) => {
    const date = toIsoDate(addDays(today, day));
    return {
      ...seed,
      id: `act-${index + 1}`,
      date,
      repetition: seed.repetition ?? 'none',
      reminderMinutes: seed.reminderMinutes ?? null,
      status: done ? 'completed' : cancelled ? 'cancelled' : 'scheduled',
      completedAt: done ? new Date(`${date}T${seed.time}:00`).toISOString() : null,
    } satisfies CareActivityProps;
  });
});

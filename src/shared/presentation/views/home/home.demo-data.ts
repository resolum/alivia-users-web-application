import type { HomeDataSource } from './home.data-source.ts';
import { addDays, todayInBusinessZone } from './home.dates.ts';
import type {
  GuestHomeSummary,
  HomeAssistedPerson,
  PrincipalHomeSummary,
} from './home.view-model.ts';

const DEMO_DELAY_MS = 450;

const DEMO_ASSISTED_PERSONS: readonly HomeAssistedPerson[] = [
  { id: 1, name: { firstName: 'Alberto', lastName: '' } },
];

function delay(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, DEMO_DELAY_MS);
  });
}

function resolveSelectedId(
  personId: number | undefined,
  persons: readonly HomeAssistedPerson[],
): number | null {
  if (personId !== undefined && persons.some((person) => person.id === personId)) {
    return personId;
  }
  return persons[0]?.id ?? null;
}

async function getPrincipalSummary(
  personId?: number,
): Promise<PrincipalHomeSummary> {
  await delay();
  const today = todayInBusinessZone();
  const selectedAssistedPersonId = resolveSelectedId(
    personId,
    DEMO_ASSISTED_PERSONS,
  );

  return {
    greeting: { name: { firstName: 'María', lastName: 'Elena Villanueva' } },
    assistedPersons: DEMO_ASSISTED_PERSONS,
    selectedAssistedPersonId,
    todayAgenda: [
      {
        careActivityId: 1,
        assignmentId: 101,
        title: 'Medicamento indicado',
        type: 'MEDICATION',
        date: today,
        timeRange: { start: '08:00', end: '08:30' },
        caregiverId: null,
        recurring: false,
        status: 'COMPLETED',
        responsibleName: 'María',
        description: null,
      },
      {
        careActivityId: 2,
        assignmentId: 102,
        title: 'Almuerzo',
        type: 'MEAL',
        date: today,
        timeRange: { start: '12:30', end: '13:30' },
        caregiverId: 2,
        recurring: false,
        status: 'IN_PROGRESS',
        responsibleName: 'Carlos',
        description: null,
      },
      {
        careActivityId: 3,
        assignmentId: 103,
        title: 'Rutina nocturna',
        type: 'OTHER',
        date: today,
        timeRange: { start: '19:00', end: '20:00' },
        caregiverId: null,
        recurring: false,
        status: 'SCHEDULED',
        responsibleName: 'María',
        description: null,
      },
    ],
    deviceAlert: {
      deviceId: 10,
      title: 'Sensor de ventana con batería baja',
      detail: '18 % restante · Dormitorio Alberto',
      extraSituations: 1,
    },
    upcomingEvent: {
      id: 20,
      title: 'Visita por incidencia',
      date: addDays(today, 1),
      timeRange: { start: '10:30', end: '12:00' },
      technicianName: 'Santiago Vega',
    },
    unreadNotifications: 4,
  };
}

async function getGuestSummary(personId?: number): Promise<GuestHomeSummary> {
  await delay();
  const today = todayInBusinessZone();
  const selectedAssistedPersonId = resolveSelectedId(
    personId,
    DEMO_ASSISTED_PERSONS,
  );

  return {
    greeting: { name: { firstName: 'Carlos', lastName: 'Rodríguez' } },
    assistedPersons: DEMO_ASSISTED_PERSONS,
    selectedAssistedPersonId,
    nextActivity: {
      careActivityId: 2,
      assignmentId: 202,
      title: 'Almuerzo asistido',
      type: 'MEAL',
      date: today,
      timeRange: { start: '12:30', end: '13:30' },
      caregiverId: 2,
      recurring: false,
      status: 'IN_PROGRESS',
      responsibleName: 'Carlos',
      description:
        'Apoyar durante el almuerzo según las indicaciones registradas.',
    },
    unreadNotifications: 1,
    householdLabel: 'Hogar San Borja',
  };
}

/** In-memory source used only when VITE_DEMO_DATA is enabled. */
export const demoHomeDataSource: HomeDataSource = {
  getPrincipalSummary,
  getGuestSummary,
};

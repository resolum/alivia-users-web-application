import type { Kinship } from '../../domain/model/register-assisted-person.command.ts';
import { readLocalHouseholdAlias } from '../household/household-account-fallback.ts';
import type { AssistedPersonRequest } from './assisted-person.request.ts';

const LOCAL_ASSISTED_PERSON_KEY = 'alivia.iam.assisted-person';

/** Kinship as the assistance screens show it. */
const KINSHIP_LABELS: Readonly<Record<Kinship, string>> = {
  PARENT: 'Madre / Padre',
  GRANDPARENT: 'Abuela / Abuelo',
  AUNT_UNCLE: 'Tía / Tío',
  SPOUSE: 'Esposa / Esposo',
  SIBLING: 'Hermana / Hermano',
  OTHER: 'Otro',
};

/**
 * Keeps the assisted person in this browser while the backend has no endpoint
 * for the contracting flow, and shows it in the assistance screens.
 * @returns The local identifier of the assisted person.
 */
export async function registerAssistedPersonLocally(request: AssistedPersonRequest): Promise<string> {
  const id = crypto.randomUUID();
  try {
    window.localStorage.setItem(LOCAL_ASSISTED_PERSON_KEY, JSON.stringify({ ...request, id }));
  } catch {
    console.error('Error writing assisted person');
  }

  // Loaded on demand so the registration screens do not pull the assistance views.
  const { showRegisteredAssistedPerson } = await import('@/assistance/index.ts');
  showRegisteredAssistedPerson({
    id,
    firstName: request.firstName,
    lastName: request.lastName,
    documentType: request.documentType ?? 'DNI',
    documentNumber: request.documentNumber ?? '',
    birthDate: request.birthDate,
    kinship: KINSHIP_LABELS[request.kinship],
    phone: request.phoneNumber,
    householdAlias: readLocalHouseholdAlias(),
  });
  return id;
}

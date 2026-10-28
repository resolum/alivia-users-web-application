import type {
  GuestHomeSummary,
  PrincipalHomeSummary,
} from './home.view-model.ts';

/** Port that provides the read models consumed by Home. */
export interface HomeDataSource {
  getPrincipalSummary(personId?: number): Promise<PrincipalHomeSummary>;
  getGuestSummary(personId?: number): Promise<GuestHomeSummary>;
}

const EMPTY_GREETING = {
  name: { firstName: '', lastName: '' },
} as const;

const emptyHomeDataSource: HomeDataSource = {
  async getPrincipalSummary(): Promise<PrincipalHomeSummary> {
    return {
      greeting: EMPTY_GREETING,
      assistedPersons: [],
      selectedAssistedPersonId: null,
      todayAgenda: [],
    };
  },
  async getGuestSummary(): Promise<GuestHomeSummary> {
    return {
      greeting: EMPTY_GREETING,
      assistedPersons: [],
      selectedAssistedPersonId: null,
      nextActivity: null,
    };
  },
};

/**
 * Returns the Home data source.
 * shortcut: Home has no backend read model yet, so it shows its empty states; plug the HTTP source in here.
 */
export function getHomeDataSource(): Promise<HomeDataSource> {
  return Promise.resolve(emptyHomeDataSource);
}

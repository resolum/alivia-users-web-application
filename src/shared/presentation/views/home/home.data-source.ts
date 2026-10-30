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

let registered: HomeDataSource | null = null;

/** The app composes Home from the bounded contexts and registers it here, so shared imports none of them. */
export function registerHomeDataSource(source: HomeDataSource): void {
  registered = source;
}

/** Returns the registered Home data source, or one that shows the empty states. */
export function getHomeDataSource(): Promise<HomeDataSource> {
  return Promise.resolve(registered ?? emptyHomeDataSource);
}

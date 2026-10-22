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

let dataSourcePromise: Promise<HomeDataSource> | null = null;

async function createHomeDataSource(): Promise<HomeDataSource> {
  if (import.meta.env.VITE_DEMO_DATA !== 'true') {
    return emptyHomeDataSource;
  }

  const module = await import('./home.demo-data.ts');
  return module.demoHomeDataSource;
}

/** Returns the singleton Home data source. */
export function getHomeDataSource(): Promise<HomeDataSource> {
  if (dataSourcePromise === null) {
    dataSourcePromise = createHomeDataSource();
  }
  return dataSourcePromise;
}

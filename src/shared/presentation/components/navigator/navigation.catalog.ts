import type { NavLabelKey } from '../../i18n/es.ts';
import type { AccessLevel } from '../../session/session.types.ts';
import type { NavIconName } from './icon-paths.ts';

/** A single destination. It is the source of truth for sidebar and route guards. */
export interface NavItem {
  readonly id: string;
  readonly labelKey: NavLabelKey;
  readonly route: string;
  readonly icon: NavIconName;
  readonly accessLevels: readonly AccessLevel[];
}

const BOTH_ACCESS_LEVELS = ['principal', 'invitado'] as const;
const PRINCIPAL_ACCESS_LEVELS = ['principal'] as const;

/**
 * Unique navigation catalog.
 * Bounded context is noted above each item because items may aggregate
 * destinations owned by different contexts.
 */
export const NAV_ITEMS = [
  // app composition
  {
    id: 'home',
    labelKey: 'home',
    route: '/home',
    icon: 'home',
    accessLevels: BOTH_ACCESS_LEVELS,
  },
  // assistance
  {
    id: 'assistedPerson',
    labelKey: 'assistedPerson',
    route: '/assisted-person',
    icon: 'assistedPerson',
    accessLevels: BOTH_ACCESS_LEVELS,
  },
  // assistance
  {
    id: 'careNetwork',
    labelKey: 'careNetwork',
    route: '/care-network',
    icon: 'careNetwork',
    accessLevels: PRINCIPAL_ACCESS_LEVELS,
  },
  // assistance
  {
    id: 'activities',
    labelKey: 'activities',
    route: '/activities',
    icon: 'activities',
    accessLevels: BOTH_ACCESS_LEVELS,
  },
  // assistance
  {
    id: 'shifts',
    labelKey: 'shifts',
    route: '/shifts',
    icon: 'shifts',
    accessLevels: BOTH_ACCESS_LEVELS,
  },
  // assistance
  {
    id: 'medications',
    labelKey: 'medications',
    route: '/medications',
    icon: 'medications',
    accessLevels: BOTH_ACCESS_LEVELS,
  },
  // profiles (household data; PENDING(confirm) once the backend owns it)
  {
    id: 'household',
    labelKey: 'household',
    route: '/household',
    icon: 'household',
    accessLevels: PRINCIPAL_ACCESS_LEVELS,
  },
  // tracking
  {
    id: 'devices',
    labelKey: 'devices',
    route: '/devices',
    icon: 'devices',
    // Guests reach it too; the screen checks their "view devices" responsibility.
    accessLevels: BOTH_ACCESS_LEVELS,
  },
  // subscriptions
  {
    id: 'subscription',
    labelKey: 'subscription',
    route: '/subscription',
    icon: 'subscription',
    accessLevels: PRINCIPAL_ACCESS_LEVELS,
  },
  // support
  {
    id: 'incidents',
    labelKey: 'incidents',
    route: '/incidents',
    icon: 'incidents',
    accessLevels: PRINCIPAL_ACCESS_LEVELS,
  },
  // analytics
  {
    id: 'metrics',
    labelKey: 'metrics',
    route: '/metrics',
    icon: 'metrics',
    accessLevels: PRINCIPAL_ACCESS_LEVELS,
  },
  // profiles
  {
    id: 'profile',
    labelKey: 'profile',
    route: '/profile',
    icon: 'profile',
    accessLevels: BOTH_ACCESS_LEVELS,
  },
  // communication
  {
    id: 'notifications',
    labelKey: 'notifications',
    route: '/notifications',
    icon: 'notifications',
    accessLevels: BOTH_ACCESS_LEVELS,
  },
] as const satisfies readonly NavItem[];

export type NavItemId = (typeof NAV_ITEMS)[number]['id'];

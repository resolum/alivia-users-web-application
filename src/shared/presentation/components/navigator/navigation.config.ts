import type { AccessLevel } from '../../session/session.types.ts';
import type { Translations } from '../../i18n/es.ts';

export interface NavItem {
  key: string;
  route: string;
  labelKey: keyof Translations['nav'];
  accessLevels?: AccessLevel[];
}

export interface NavGroup {
  key: string;
  items: NavItem[];
}

export function getNavigationGroups(): NavGroup[] {
  return [
    {
      key: 'PRINCIPAL',
      items: [
        { key: 'home', route: '/home', labelKey: 'home' },
        { key: 'assisted-person', route: '/assisted-person', labelKey: 'assistedPerson' },
        { key: 'activities', route: '/activities', labelKey: 'activities' },
      ],
    },
    {
      key: 'CUIDADO',
      items: [
        {
          key: 'care-network',
          route: '/care-network',
          labelKey: 'careNetwork',
          accessLevels: ['principal'],
        },
        {
          key: 'household',
          route: '/household',
          labelKey: 'household',
          accessLevels: ['principal'],
        },
        {
          key: 'subscription',
          route: '/subscription',
          labelKey: 'subscription',
          accessLevels: ['principal'],
        },
        {
          key: 'devices',
          route: '/devices',
          labelKey: 'devices',
          accessLevels: ['principal'],
        },
        {
          key: 'incidents',
          route: '/incidents',
          labelKey: 'incidents',
          accessLevels: ['principal'],
        },
        {
          key: 'metrics',
          route: '/metrics',
          labelKey: 'metrics',
          accessLevels: ['principal'],
        },
      ],
    },
    {
      key: 'CUENTA',
      items: [
        { key: 'notifications', route: '/notifications', labelKey: 'notifications' },
        { key: 'profile', route: '/profile', labelKey: 'profile' },
      ],
    },
  ];
}

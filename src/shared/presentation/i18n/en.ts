import type { Translations } from './es.ts';

export const en: Translations = {
  nav: {
    home: 'Home',
    assistedPerson: 'Assisted person',
    careNetwork: 'Care network',
    activities: 'Activities',
    household: 'Household',
    subscription: 'Subscription',
    devices: 'Devices',
    incidents: 'Incidents',
    metrics: 'Metrics',
    notifications: 'Notifications',
    profile: 'My profile',
    signOut: 'Sign out',
  },  
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    retry: 'Try again',
    back: 'Back',
    loading: 'Loading…',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    notFound: 'We could not find what you were looking for.',
    unauthorized: 'You do not have permission to view this section.',
    network: 'Connection error. Check your network and try again.',
    empty: 'Nothing here yet.',
  },
  layout: {
    skipToContent: 'Skip to content',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    userMenu: 'User menu',
    notifications: 'Notifications',
  },
};

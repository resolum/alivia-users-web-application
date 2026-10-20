/**
 * Outline icon path data.
 * Each entry is a list of SVG path `d` values drawn on a 24x24 viewBox.
 */
export const ICON_PATHS = {
  home: [
    'M4 4h6v6H4z',
    'M14 4h6v6h-6z',
    'M4 14h6v6H4z',
    'M14 14h6v6h-6z',
  ],
  assistedPerson: [
    'M14 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
    'M12 7v6',
    'M8 10l4 1 4-2',
    'M12 13l-3 5',
    'M12 13l3 3 1 3',
  ],
  careNetwork: [
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M2 20a7 7 0 0 1 14 0',
    'M17 11a2.5 2.5 0 1 0 0-5',
    'M22 20a5 5 0 0 0-4-4.9',
  ],
  activities: [
    'M4 5h16v16H4z',
    'M6 3v4',
    'M18 3v4',
    'M4 9h16',
    'M8 14l3 3 5-5',
  ],
  household: [
    'M3 11l9-7 9 7',
    'M5 10v10h14V10',
    'M10 20v-6h4v6',
  ],
  devices: [
    'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
    'M4 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
    'M20 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
    'M11 6l-5 9',
    'M13 6l5 9',
    'M6 18h12',
  ],
  contracting: [
    'M9 3h6a1 1 0 0 1 1 1v2H8V4a1 1 0 0 1 1-1Z',
    'M8 5H5v16h14V5h-3',
    'M9 11h6',
    'M9 15h6',
  ],
  subscription: [
    'M3 6h18v12H3z',
    'M3 10h18',
    'M7 15h3',
  ],
  incidents: [
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z',
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    'M4.9 4.9l4.2 4.2',
    'M14.9 14.9l4.2 4.2',
    'M19.1 4.9l-4.2 4.2',
    'M9.1 14.9l-4.2 4.2',
  ],
  metrics: ['M3 12h4l3-7 4 14 3-7h4'],
  profile: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
    'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M6.5 19.5a6 6 0 0 1 11 0',
  ],
  notifications: [
    'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9',
    'M10 21h4',
  ],
  signOut: [
    'M10 3H5v18h5',
    'M14 8l4 4-4 4',
    'M9 12h9',
  ],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
} as const;

export type NavIconName = keyof typeof ICON_PATHS;

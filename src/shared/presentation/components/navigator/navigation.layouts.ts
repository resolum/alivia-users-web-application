import type { NavGroupLabelKey, NavHeaderLabelKey } from '../../i18n/es.ts';
import type { AccessLevel } from '../../session/session.types.ts';
import { NAV_ITEMS, type NavItem, type NavItemId } from './navigation.catalog.ts';

/**
 * Layout definitions reference catalog ids only; labels, routes and icons
 * stay in the catalog and the shared i18n dictionaries.
 */
export type ActiveIndicator = 'barra' | 'fondo';

/** PENDING(design-confirm): principal labels are smaller than guest labels. */
export type GroupLabelVariant = 'compact' | 'wide';

export interface NavLayoutHeader {
  readonly titleKey: NavHeaderLabelKey;
  readonly subtitleKey: NavHeaderLabelKey;
  readonly badgeKey?: NavHeaderLabelKey;
}

export interface NavLayoutGroup {
  readonly labelKey: NavGroupLabelKey;
  readonly itemIds: readonly NavItemId[];
}

export interface NavLayout {
  readonly header: NavLayoutHeader;
  readonly groups: readonly NavLayoutGroup[];
  readonly footerItems: readonly NavItemId[];
  readonly activeIndicator: ActiveIndicator;
  readonly groupLabelVariant: GroupLabelVariant;
  readonly navLabel: 'mainNavigation';
}

const PRINCIPAL_LAYOUT: NavLayout = {
  header: {
    titleKey: 'appName',
    subtitleKey: 'principalSubtitle',
  },
  groups: [
    { labelKey: 'principal', itemIds: ['home'] },
    { labelKey: 'care', itemIds: ['assistedPerson', 'careNetwork', 'activities'] },
    { labelKey: 'home', itemIds: ['household', 'devices'] },
    { labelKey: 'service', itemIds: ['subscription', 'incidents'] },
    { labelKey: 'analytics', itemIds: ['metrics'] },
  ],
  footerItems: ['profile'],
  activeIndicator: 'barra',
  groupLabelVariant: 'compact',
  navLabel: 'mainNavigation',
};

const GUEST_LAYOUT: NavLayout = {
  header: {
    titleKey: 'appName',
    subtitleKey: 'guestSubtitle',
    badgeKey: 'guestBadge',
  },
  groups: [
    { labelKey: 'principal', itemIds: ['home'] },
    { labelKey: 'care', itemIds: ['assistedPerson', 'activities'] },
    { labelKey: 'account', itemIds: ['profile'] },
  ],
  footerItems: [],
  activeIndicator: 'fondo',
  groupLabelVariant: 'wide',
  navLabel: 'mainNavigation',
};

const LAYOUT_ENTRIES = [
  ['principal', PRINCIPAL_LAYOUT],
  ['invitado', GUEST_LAYOUT],
] as const;

/** Keyed by the accessLevel exposed by SessionContext. */
export const NAV_LAYOUTS: Record<AccessLevel, NavLayout> = {
  principal: PRINCIPAL_LAYOUT,
  invitado: GUEST_LAYOUT,
};

function collectItemIds(layout: NavLayout): readonly NavItemId[] {
  return [...layout.groups.flatMap((group) => group.itemIds), ...layout.footerItems];
}

function validateLayout(level: AccessLevel, layout: NavLayout): void {
  for (const itemId of collectItemIds(layout)) {
    const item: NavItem | undefined = NAV_ITEMS.find(
      (candidate) => candidate.id === itemId,
    );
    if (!item) {
      throw new Error(
        `Navigation layout "${level}" references unknown item "${itemId}".`,
      );
    }
    if (!item.accessLevels.includes(level)) {
      throw new Error(
        `Navigation layout "${level}" cannot include item "${itemId}".`,
      );
    }
  }
}

if (import.meta.env.DEV) {
  for (const [level, layout] of LAYOUT_ENTRIES) {
    validateLayout(level, layout);
  }
}

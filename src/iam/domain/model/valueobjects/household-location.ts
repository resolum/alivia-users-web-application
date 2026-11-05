/** One part of an address as Google Maps returns it (street, district, city...). */
export interface GeoAddressComponent {
  readonly longText: string;
  readonly types: readonly string[];
}

/** Point the client picked on the map, as the backend Address stores it. */
export interface HouseholdLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly placeId: string;
  readonly formattedAddress: string;
}

/** Address, district and city to fill the household form with. */
export interface HouseholdAddressFields {
  readonly address: string;
  readonly district: string;
  readonly city: string;
}

/** Lima, used to center the map before the client picks a point. */
export const DEFAULT_MAP_CENTER = { lat: -12.0464, lng: -77.0428 } as const;

const ADMIN_PREFIXES = [
  'Municipalidad Metropolitana de ',
  'Provincia Constitucional del ',
  'Provincia de ',
  'Departamento de ',
  'Distrito de ',
];

function stripAdminPrefix(value: string): string {
  const prefix = ADMIN_PREFIXES.find((candidate) => value.startsWith(candidate));
  return prefix === undefined ? value : value.slice(prefix.length);
}

function firstOf(components: readonly GeoAddressComponent[], ...types: string[]): string {
  for (const type of types) {
    const match = components.find((component) => component.types.includes(type));
    if (match && match.longText.trim() !== '') return stripAdminPrefix(match.longText.trim());
  }
  return '';
}

/**
 * Splits a Google Maps address into the household form fields. In Peru the
 * district comes as the locality (the sublocality is the urbanization, such as
 * El Derby) and the city as the province.
 * @param components - Address components of the picked place.
 * @param formattedAddress - Full address, used when there is no street name.
 */
export function toHouseholdAddressFields(
  components: readonly GeoAddressComponent[],
  formattedAddress: string,
): HouseholdAddressFields {
  const route = firstOf(components, 'route');
  const number = firstOf(components, 'street_number');
  const street = [route, number].filter(Boolean).join(' ');
  const firstLine = formattedAddress.split(',')[0]?.trim() ?? '';

  return {
    address: street || firstOf(components, 'premise', 'point_of_interest', 'establishment') || firstLine,
    district: firstOf(components, 'locality', 'administrative_area_level_3', 'sublocality_level_1', 'sublocality'),
    city: firstOf(components, 'administrative_area_level_2', 'administrative_area_level_1', 'locality'),
  };
}

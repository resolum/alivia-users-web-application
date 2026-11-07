/** Browser key for the Maps JavaScript, Places (New) and Geocoding APIs. */
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? '';

/** Map ID for the advanced marker; DEMO_MAP_ID works for development. */
export const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID';

/** True when the key is set, so the household form shows the map. */
export function isGoogleMapsConfigured(): boolean {
  return GOOGLE_MAPS_API_KEY !== '';
}

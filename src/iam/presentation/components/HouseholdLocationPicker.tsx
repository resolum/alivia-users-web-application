import { useEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { LoaderCircle, LocateFixed, MapPin, Search } from 'lucide-react';
import { inputBase } from '@/shared/presentation/components/base-form/Inputs.tsx';
import {
  DEFAULT_MAP_CENTER,
  toHouseholdAddressFields,
  type GeoAddressComponent,
  type HouseholdAddressFields,
  type HouseholdLocation,
} from '../../domain/model/valueobjects/household-location.ts';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from '../google-maps.config.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { AuthField } from './AuthField.tsx';

const SEARCH_DELAY_MS = 300;
const MIN_QUERY_LENGTH = 3;
const PICKED_ZOOM = 17;

/** What the form receives when the client picks a point. */
export interface PickedHouseholdLocation {
  readonly location: HouseholdLocation;
  readonly fields: HouseholdAddressFields;
}

interface HouseholdLocationPickerProps {
  readonly id: string;
  readonly error?: string;
  readonly location: HouseholdLocation | null;
  readonly onPick: (picked: PickedHouseholdLocation) => void;
}

type Feedback = 'locating' | 'noResults' | 'lookupFailed' | 'denied' | null;

function fromGeocoder(components: readonly google.maps.GeocoderAddressComponent[]): GeoAddressComponent[] {
  return components.map((component) => ({ longText: component.long_name, types: component.types }));
}

function fromPlace(components: readonly google.maps.places.AddressComponent[]): GeoAddressComponent[] {
  return components.map((component) => ({ longText: component.longText ?? '', types: component.types }));
}

/** Prefer a result that is an exact street address over a whole district. */
function bestResult(results: readonly google.maps.GeocoderResult[]): google.maps.GeocoderResult | undefined {
  return (
    results.find((result) => result.types.includes('street_address') || result.types.includes('premise')) ??
    results[0]
  );
}

function PickerContent({ id, error, location, onPick }: HouseholdLocationPickerProps) {
  const translations = useIamTranslations();
  const t = translations.household;
  const map = useMap();
  const places = useMapsLibrary('places');
  const geocoding = useMapsLibrary('geocoding');
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [query, setQuery] = useState('');
  // Text of the suggestion just picked, so it does not open the list again.
  const [pickedText, setPickedText] = useState('');
  const [found, setFound] = useState<google.maps.places.PlacePrediction[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(
    location ? { lat: location.latitude, lng: location.longitude } : null,
  );

  // Suggestions while typing, limited to Peru.
  useEffect(() => {
    if (!places || query.trim().length < MIN_QUERY_LENGTH || query === pickedText) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      sessionToken.current ??= new places.AutocompleteSessionToken();
      places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query.trim(),
        sessionToken: sessionToken.current,
        includedRegionCodes: ['pe'],
        language: 'es',
        ...(map?.getCenter() ? { locationBias: map.getCenter() } : {}),
      })
        .then(({ suggestions }) => {
          if (cancelled) return;
          const predictions = suggestions.flatMap((s) => (s.placePrediction ? [s.placePrediction] : []));
          setFound(predictions);
          setFeedback(predictions.length === 0 ? 'noResults' : null);
        })
        .catch(() => {
          if (!cancelled) setFound([]);
        });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [places, map, query, pickedText]);

  const suggestions = query.trim().length >= MIN_QUERY_LENGTH && query !== pickedText ? found : [];

  function focusMap(point: google.maps.LatLngLiteral): void {
    setMarker(point);
    map?.panTo(point);
    if ((map?.getZoom() ?? 0) < PICKED_ZOOM) map?.setZoom(PICKED_ZOOM);
  }

  /** Reads the address of a point on the map and fills the form with it. */
  function pickPoint(point: google.maps.LatLngLiteral): void {
    setMarker(point);
    setFeedback(null);
    if (!geocoding) return;
    new geocoding.Geocoder()
      .geocode({ location: point, language: 'es' })
      .then(({ results }) => {
        const result = bestResult(results);
        if (!result) {
          setFeedback('lookupFailed');
          return;
        }
        onPick({
          location: {
            latitude: point.lat,
            longitude: point.lng,
            placeId: result.place_id,
            formattedAddress: result.formatted_address,
          },
          fields: toHouseholdAddressFields(fromGeocoder(result.address_components), result.formatted_address),
        });
      })
      .catch(() => setFeedback('lookupFailed'));
  }

  async function pickSuggestion(prediction: google.maps.places.PlacePrediction): Promise<void> {
    setFound([]);
    setQuery(prediction.text.text);
    setPickedText(prediction.text.text);
    sessionToken.current = null;
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['id', 'location', 'formattedAddress', 'addressComponents'] });
      const point = place.location?.toJSON();
      if (!point) {
        setFeedback('lookupFailed');
        return;
      }
      focusMap(point);
      const formattedAddress = place.formattedAddress ?? prediction.text.text;
      onPick({
        location: {
          latitude: point.lat,
          longitude: point.lng,
          placeId: place.id,
          formattedAddress,
        },
        fields: toHouseholdAddressFields(fromPlace(place.addressComponents ?? []), formattedAddress),
      });
      setFeedback(null);
    } catch {
      setFeedback('lookupFailed');
    }
  }

  function locateMe(): void {
    if (!('geolocation' in navigator)) {
      setFeedback('denied');
      return;
    }
    setFeedback('locating');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        focusMap(point);
        pickPoint(point);
      },
      () => setFeedback('denied'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  const feedbackText: Record<Exclude<Feedback, null>, string> = {
    locating: t.locating,
    noResults: t.locationNoResults,
    lookupFailed: t.locationLookupFailed,
    denied: t.locationDenied,
  };
  const listId = `${id}-suggestions`;

  return (
    <AuthField
      id={id}
      label={t.locationLabel}
      required
      requiredLabel={translations.common.required}
      error={error}
      hint={t.locationHint}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-alivia-text-muted"
            />
            <input
              id={id}
              type="search"
              role="combobox"
              autoComplete="off"
              aria-expanded={suggestions.length > 0}
              aria-controls={listId}
              aria-invalid={error !== undefined}
              aria-describedby={error ? `${id}-error` : `${id}-hint`}
              placeholder={t.locationSearchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                // Enter picks the first suggestion instead of sending the form.
                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (suggestions[0]) void pickSuggestion(suggestions[0]);
                }
              }}
              className={[inputBase, 'min-h-12 pl-9'].join(' ')}
            />
            {suggestions.length > 0 && (
              <ul
                id={listId}
                role="listbox"
                className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-alivia-primary-mist bg-white shadow-lg"
              >
                {suggestions.map((prediction) => (
                  <li key={prediction.placeId} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => void pickSuggestion(prediction)}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-alivia-primary-mist/60 focus:bg-alivia-primary-mist/60 focus:outline-none"
                    >
                      <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-alivia-primary" />
                      <span>
                        <span className="block font-semibold text-alivia-text">
                          {prediction.mainText?.text ?? prediction.text.text}
                        </span>
                        {prediction.secondaryText && (
                          <span className="block text-xs text-alivia-text-muted">
                            {prediction.secondaryText.text}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={locateMe}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-alivia-primary-mist px-4 text-sm font-semibold text-alivia-primary hover:bg-alivia-primary-mist/60"
          >
            {feedback === 'locating' ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <LocateFixed aria-hidden="true" className="size-4" />
            )}
            {t.useMyLocation}
          </button>
        </div>

        <div
          className={[
            'h-72 overflow-hidden rounded-lg border',
            error ? 'border-alivia-danger' : 'border-alivia-primary-mist',
          ].join(' ')}
        >
          <Map
            mapId={GOOGLE_MAPS_MAP_ID}
            defaultCenter={marker ?? DEFAULT_MAP_CENTER}
            defaultZoom={marker ? PICKED_ZOOM : 12}
            gestureHandling="cooperative"
            disableDefaultUI
            zoomControl
            clickableIcons={false}
            onClick={(event) => {
              if (event.detail.latLng) pickPoint(event.detail.latLng);
            }}
          >
            {marker && (
              <AdvancedMarker
                position={marker}
                draggable
                onDragEnd={(event) => {
                  const point = event.latLng?.toJSON();
                  if (point) pickPoint(point);
                }}
              />
            )}
          </Map>
        </div>

        <p aria-live="polite" className="text-xs text-alivia-text-muted">
          {feedback !== null ? (
            feedbackText[feedback]
          ) : location ? (
            <>
              <span className="font-semibold text-alivia-text">{t.locationPicked}</span>{' '}
              {location.formattedAddress}
            </>
          ) : null}
        </p>
      </div>
    </AuthField>
  );
}

/**
 * Google Maps picker for the household location: search an address, use the
 * device location, or tap and drag the pin. Each pick fills the address,
 * district and city fields and keeps the coordinates and place id.
 */
export function HouseholdLocationPicker(props: HouseholdLocationPickerProps) {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="es" region="PE">
      <PickerContent {...props} />
    </APIProvider>
  );
}

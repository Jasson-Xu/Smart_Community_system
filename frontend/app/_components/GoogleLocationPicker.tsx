"use client";

import { useEffect, useRef, useState } from "react";

export type LocationSelection = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string | null;
};

type LatLng = { lat(): number; lng(): number };
type MapClickEvent = { latLng?: LatLng };
type MapListener = { remove(): void };
type GoogleMap = {
  addListener(name: string, listener: (event: MapClickEvent) => void): MapListener;
  panTo(position: { lat: number; lng: number }): void;
  setZoom(zoom: number): void;
};
type AdvancedMarker = {
  map: GoogleMap | null;
  position: { lat: number; lng: number };
  addListener(name: string, listener: (event: MapClickEvent) => void): MapListener;
};
type GeocoderResult = { formatted_address?: string; place_id?: string };
type GoogleGeocoder = {
  geocode(request: { location: { lat: number; lng: number }; language?: string }): Promise<{ results: GeocoderResult[] }>;
};
type GooglePlace = {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  location?: LatLng;
  fetchFields(options: { fields: string[] }): Promise<void>;
};
type PlaceSelectEvent = Event & { placePrediction: { toPlace(): GooglePlace } };
type PlaceAutocomplete = HTMLElement & { placeholder: string };
type MapsNamespace = { importLibrary(name: string): Promise<unknown> };

declare global {
  interface Window {
    google?: { maps: MapsNamespace };
    smartCommunityGoogleMapsReady?: () => void;
  }
}

let googleMapsPromise: Promise<MapsNamespace> | null = null;

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps.importLibrary) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    window.smartCommunityGoogleMapsReady = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps did not initialise."));
    };
    const script = document.createElement("script");
    script.id = "smart-community-google-maps";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=smartCommunityGoogleMapsReady&v=weekly&language=en`;
    script.onerror = () => reject(new Error("Google Maps could not be loaded."));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

export function GoogleLocationPicker({ value, latitude, longitude, invalid, onChange }: {
  value: string;
  latitude: number | null;
  longitude: number | null;
  invalid?: boolean;
  onChange(selection: LocationSelection): void;
}) {
  const mapElement = useRef<HTMLDivElement>(null);
  const autocompleteElement = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const initialCoordinates = useRef({ latitude, longitude });
  const [mapState, setMapState] = useState<"disabled" | "loading" | "ready" | "error">(
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "loading" : "disabled",
  );
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!apiKey || !mapElement.current || !autocompleteElement.current) return;
    let disposed = false;
    let mapListener: MapListener | null = null;
    let markerListener: MapListener | null = null;
    let marker: AdvancedMarker | null = null;
    let reverseGeocodeSequence = 0;

    loadGoogleMaps(apiKey).then(async maps => {
      const mapsLibrary = await maps.importLibrary("maps") as {
        Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap;
      };
      const placesLibrary = await maps.importLibrary("places") as {
        PlaceAutocompleteElement: new (options?: Record<string, unknown>) => PlaceAutocomplete;
      };
      const markerLibrary = await maps.importLibrary("marker") as {
        AdvancedMarkerElement: new (options: Record<string, unknown>) => AdvancedMarker;
      };
      const geocodingLibrary = await maps.importLibrary("geocoding") as {
        Geocoder: new () => GoogleGeocoder;
      };
      if (disposed || !mapElement.current || !autocompleteElement.current) return;

      const initial = initialCoordinates.current;
      const initialPosition = initial.latitude !== null && initial.longitude !== null
        ? { lat: initial.latitude, lng: initial.longitude } : { lat: -33.8688, lng: 151.2093 };
      const map = new mapsLibrary.Map(mapElement.current, {
        center: initialPosition, zoom: initial.latitude !== null ? 16 : 11,
        mapId: "DEMO_MAP_ID", mapTypeControl: false, streetViewControl: false,
      });
      const geocoder = new geocodingLibrary.Geocoder();
      marker = new markerLibrary.AdvancedMarkerElement({
        map, position: initialPosition, title: "Selected report location", gmpDraggable: true,
      });

      const updateFromMapPosition = async (position: { lat: number; lng: number }) => {
        if (marker) marker.position = position;
        const sequence = ++reverseGeocodeSequence;
        const coordinateAddress = `Map pin ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
        onChangeRef.current({
          address: coordinateAddress,
          latitude: position.lat,
          longitude: position.lng,
          googlePlaceId: null,
        });
        try {
          const { results } = await geocoder.geocode({ location: position, language: "en" });
          if (disposed || sequence !== reverseGeocodeSequence) return;
          const closestAddress = results[0];
          onChangeRef.current({
            address: closestAddress?.formatted_address ?? coordinateAddress,
            latitude: position.lat,
            longitude: position.lng,
            googlePlaceId: closestAddress?.place_id ?? null,
          });
        } catch {
          // The coordinate fallback already replaced the previous location.
        }
      };
      const autocomplete = new placesLibrary.PlaceAutocompleteElement();
      autocomplete.placeholder = "Search for a street, park, or public place";
      autocomplete.setAttribute("aria-label", "Search Google Maps for the issue location");
      autocompleteElement.current.replaceChildren(autocomplete);
      autocomplete.addEventListener("gmp-select", async event => {
        const place = (event as PlaceSelectEvent).placePrediction.toPlace();
        await place.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location"] });
        if (!place.location) return;
        const position = { lat: place.location.lat(), lng: place.location.lng() };
        if (marker) marker.position = position;
        map.panTo(position);
        map.setZoom(17);
        onChangeRef.current({
          address: place.formattedAddress ?? place.displayName ?? "Selected Google Maps location",
          latitude: position.lat, longitude: position.lng, googlePlaceId: place.id ?? null,
        });
      });
      mapListener = map.addListener("click", event => {
        if (!event.latLng) return;
        const position = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        void updateFromMapPosition(position);
      });
      markerListener = marker.addListener("dragend", event => {
        if (!event.latLng) return;
        void updateFromMapPosition({ lat: event.latLng.lat(), lng: event.latLng.lng() });
      });
      setMapState("ready");
    }).catch(() => { if (!disposed) setMapState("error"); });

    return () => {
      disposed = true;
      mapListener?.remove();
      markerListener?.remove();
      if (marker) marker.map = null;
    };
  }, [apiKey]);

  return (
    <div className="location-picker">
      <label htmlFor="report-location">Location</label>
      <input id="report-location" value={value} maxLength={300} aria-invalid={invalid}
        onChange={event => onChange({ address: event.target.value, latitude: null, longitude: null, googlePlaceId: null })}
        placeholder="Street, intersection, park, or public place" />
      {mapState === "disabled" && <p className="field-help">Google Maps is not configured locally. You can enter the location manually.</p>}
      {mapState !== "disabled" && <>
        <div className="place-search" ref={autocompleteElement} />
        <div className="google-map" ref={mapElement} role="region" aria-label="Google map location picker" />
        {mapState === "loading" && <p className="field-help" role="status">Loading Google Maps...</p>}
        {mapState === "error" && <p className="field-error" role="status">Google Maps could not load. Check the API key and its website/API restrictions; manual entry remains available.</p>}
        {mapState === "ready" && <p className="field-help">Search for a place or click the map to position the report marker.</p>}
      </>}
      {latitude !== null && longitude !== null && <p className="coordinate-value">Selected coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>}
    </div>
  );
}

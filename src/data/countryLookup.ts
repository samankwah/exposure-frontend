import westAfricaBoundary from "./westAfricaBoundary.json";
import westAfricaPlaces from "./westAfricaPlaces.json";

type LonLat = [number, number];
export type PlaceCandidate = { name: string; country: string; lon: number; lat: number };

// Towns of 15k+ people from GeoNames; regenerate with the same field order if replaced.
const PLACES: PlaceCandidate[] = (westAfricaPlaces.places as Array<[string, number, number, string, number]>).map(
  ([name, lon, lat, country]) => ({ name, lon, lat, country })
);
export const DEFAULT_PLACE_MAX_DISTANCE_KM = 60;
const KM_PER_DEGREE = 111.32;
type BoundaryFeature = {
  properties?: { name?: string };
  geometry?: { type: string; coordinates: any } | null;
};
type BoundaryCollection = { features?: BoundaryFeature[] };

// Natural Earth spells a few names differently from the city/country datasets.
const DISPLAY_COUNTRY_NAMES: Record<string, string> = {
  "Cote d'Ivoire": "Côte d'Ivoire"
};

const COUNTRY_FEATURES = ((westAfricaBoundary as BoundaryCollection).features ?? []).map((feature) => ({
  feature,
  bbox: getGeometryBounds(feature.geometry)
}));
const COUNTRY_AT_POINT_CACHE = new Map<string, string | null>();
const MAX_COUNTRY_CACHE_ENTRIES = 20_000;

// Returns the West African country whose boundary contains the point, or null
// for points in the ocean or outside the 15-country region.
export function getCountryAtPoint(point: LonLat): string | null {
  const [longitude, latitude] = point;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

  const cacheKey = `${longitude.toFixed(4)}:${latitude.toFixed(4)}`;
  const cached = COUNTRY_AT_POINT_CACHE.get(cacheKey);
  if (cached !== undefined) return cached;

  let country: string | null = null;
  for (const { feature, bbox } of COUNTRY_FEATURES) {
    if (!bbox || longitude < bbox[0] || longitude > bbox[2] || latitude < bbox[1] || latitude > bbox[3]) continue;
    if (pointInGeometry(point, feature.geometry)) {
      const name = feature.properties?.name ?? null;
      country = name ? DISPLAY_COUNTRY_NAMES[name] ?? name : null;
      break;
    }
  }

  if (COUNTRY_AT_POINT_CACHE.size >= MAX_COUNTRY_CACHE_ENTRIES) COUNTRY_AT_POINT_CACHE.clear();
  COUNTRY_AT_POINT_CACHE.set(cacheKey, country);
  return country;
}

// Study cities win within this distance so their urban cells read "Lagos", not a
// GeoNames neighbourhood such as "Makoko".
const PREFERRED_PLACE_DISTANCE_KM = 15;
// Coastal cells can fall just outside the simplified 1:50m country outlines.
const OFFSHORE_PLACE_MAX_DISTANCE_KM = 25;

// Nearest town in the given country (any country when null), so a hover never
// names a place across a border.
export function getNearestPlace(
  point: LonLat,
  country: string | null,
  places: PlaceCandidate[] = PLACES,
  maxDistanceKm = DEFAULT_PLACE_MAX_DISTANCE_KM
): PlaceCandidate | null {
  const [longitude, latitude] = point;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

  const countryKey = country ? normalizeCountry(country) : null;
  const longitudeScale = Math.cos((latitude * Math.PI) / 180);
  let nearest: PlaceCandidate | null = null;
  let nearestDistanceKm = maxDistanceKm;

  for (const place of places) {
    if (countryKey && normalizeCountry(place.country) !== countryKey) continue;
    const dx = (place.lon - longitude) * longitudeScale;
    const dy = place.lat - latitude;
    const distanceKm = Math.sqrt(dx * dx + dy * dy) * KM_PER_DEGREE;
    if (distanceKm <= nearestDistanceKm) {
      nearest = place;
      nearestDistanceKm = distanceKm;
    }
  }

  return nearest;
}

// "Town, Country" for a point, falling back to the country alone when no town
// is close enough, and null outside the 15 West African countries.
export function getLocationLabelAtPoint(point: LonLat, preferredPlaces: PlaceCandidate[] = []): string | null {
  const country = getCountryAtPoint(point);
  if (!country) {
    const offshorePlace =
      getNearestPlace(point, null, preferredPlaces, PREFERRED_PLACE_DISTANCE_KM) ??
      getNearestPlace(point, null, PLACES, OFFSHORE_PLACE_MAX_DISTANCE_KM);
    return offshorePlace ? `${offshorePlace.name}, ${offshorePlace.country}` : null;
  }

  const place =
    getNearestPlace(point, country, preferredPlaces, PREFERRED_PLACE_DISTANCE_KM) ??
    getNearestPlace(point, country, PLACES);
  return place ? `${place.name}, ${country}` : country;
}

function normalizeCountry(country: string) {
  return country
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export function pointInGeoJsonFeatureCollection(point: LonLat, collection: any) {
  return Boolean(collection.features?.some((feature: any) => pointInGeometry(point, feature.geometry)));
}

export function pointInPolygonWithHoles(point: LonLat, polygon: LonLat[][]) {
  if (!polygon[0] || !pointInPolygon(point, polygon[0])) return false;
  return !polygon.slice(1).some((hole) => pointInPolygon(point, hole));
}

export function pointInPolygon(point: LonLat, polygon: LonLat[]) {
  const [longitude, latitude] = point;
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const [currentLongitude, currentLatitude] = polygon[index];
    const [previousLongitude, previousLatitude] = polygon[previous];
    const intersects =
      currentLatitude > latitude !== previousLatitude > latitude &&
      longitude <
        ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
          (previousLatitude - currentLatitude) +
          currentLongitude;

    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInGeometry(point: LonLat, geometry: BoundaryFeature["geometry"]) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") return pointInPolygonWithHoles(point, geometry.coordinates);
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon: LonLat[][]) => pointInPolygonWithHoles(point, polygon));
  }
  return false;
}

function getGeometryBounds(geometry: BoundaryFeature["geometry"]): [number, number, number, number] | null {
  if (!geometry) return null;
  const rings: LonLat[][] =
    geometry.type === "Polygon"
      ? geometry.coordinates
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates.flat()
        : [];
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const ring of rings) {
    for (const [longitude, latitude] of ring) {
      if (longitude < west) west = longitude;
      if (longitude > east) east = longitude;
      if (latitude < south) south = latitude;
      if (latitude > north) north = latitude;
    }
  }
  return Number.isFinite(west) ? [west, south, east, north] : null;
}

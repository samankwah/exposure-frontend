import {
  getLocalWebDataSnapshot,
  type CityPweValue,
  type CityNpweiRow,
  type CountryPweValue,
  type CountryPweRow,
  type HealthSeasonSummary,
  type WebDataSeason,
  type WebDataSnapshot,
  type WebDataSummary,
  normalizeWebDataSnapshot
} from "@/data/webData";

export const DEFAULT_API_BASE_URL = "http://localhost:8000";
export const PRODUCTION_API_BASE_URL = "https://exposure-backend-eta.vercel.app";

const PRODUCTION_FRONTEND_HOSTNAMES = new Set(["no2exposure.netlify.app"]);

type BackendDatasetResponse = {
  citiesPwe?: Record<string, CityPweValue>;
  countryPwe?: Record<string, CountryPweValue>;
  cityRows?: Record<WebDataSeason, CityNpweiRow[]>;
  countryRows?: Record<WebDataSeason, CountryPweRow[]>;
  healthImpact?: Record<WebDataSeason, HealthSeasonSummary>;
  seasonalTrend?: Record<string, Record<WebDataSeason, number | null>>;
  summary?: WebDataSummary;
};

export type NumericRange = {
  min: number;
  max: number;
};

export type No2MapValueRanges = {
  no2Column: NumericRange;
  populationCount: NumericRange;
  pixelExposure: NumericRange;
  log10PixelExposure: NumericRange;
};

export type No2MapTileMetadata = {
  availableYears: number[];
  availableSeasons: WebDataSeason[];
  tileUrlTemplate: string;
  bounds: [number, number, number, number];
  minzoom: number;
  maxzoom: number;
  layerName: string;
  valueField: "log10_pixel_exposure";
  no2Column: NumericRange;
  populationCount: NumericRange;
  pixelExposure: NumericRange;
  log10PixelExposure: NumericRange;
  rangesBySeasonYear?: Partial<Record<WebDataSeason, Record<string, No2MapValueRanges>>>;
  units: {
    no2Column: string;
    populationCount: string;
    pixelExposure: string;
    log10PixelExposure: string;
    npwei: string;
  };
  generatedAt: string;
  seasonYearDefinition?: string;
};

export type No2MapGridMetadata = Omit<No2MapTileMetadata, "tileUrlTemplate" | "minzoom" | "maxzoom"> & {
  dataUrlTemplate: string;
};

export type No2MapGridFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties?: Record<string, unknown>;
    geometry?: Record<string, unknown>;
  }>;
};

export type No2MapDataLoadResult =
  | { source: "tile"; metadata: No2MapTileMetadata }
  | { source: "grid"; metadata: No2MapGridMetadata; data: No2MapGridFeatureCollection };

export type LoadNo2MapDataOptions = {
  retries?: number;
  retryDelayMs?: number;
};

export type WebDataLoadResult = {
  snapshot: WebDataSnapshot;
  source: "backend" | "local";
};

const DEFAULT_NO2_MAP_DATA_RETRIES = 2;
const DEFAULT_NO2_MAP_DATA_RETRY_DELAY_MS = 400;
const NO2_MAP_TILE_PREFLIGHT_LIMIT = 24;
const no2MapDataLoadCache = new Map<string, Promise<No2MapDataLoadResult>>();
const no2TileMetadataRequestCache = new Map<string, Promise<No2MapTileMetadata>>();
const no2GridMetadataRequestCache = new Map<string, Promise<No2MapGridMetadata>>();
const no2GridDataRequestCache = new Map<string, Promise<No2MapGridFeatureCollection>>();

export function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    getBrowserProductionApiBaseUrl() ||
    DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");
}

export async function fetchBackendWebDataSnapshot(
  fetcher: typeof fetch = fetch,
  apiBaseUrl: string = getApiBaseUrl()
): Promise<WebDataSnapshot> {
  const response = await fetcher(`${apiBaseUrl}/api/dataset/adapted`, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Dataset request failed with ${response.status}`);
  }

  return normalizeBackendSnapshot((await response.json()) as BackendDatasetResponse);
}

export async function loadWebDataSnapshot(fetcher: typeof fetch = fetch, apiBaseUrl: string = getApiBaseUrl()): Promise<WebDataLoadResult> {
  try {
    return {
      snapshot: await fetchBackendWebDataSnapshot(fetcher, apiBaseUrl),
      source: "backend"
    };
  } catch {
    return {
      snapshot: getLocalWebDataSnapshot(),
      source: "local"
    };
  }
}

export async function fetchNo2MapTileMetadata(
  fetcher: typeof fetch = fetch,
  apiBaseUrl: string = getApiBaseUrl()
): Promise<No2MapTileMetadata> {
  const response = await fetcher(`${apiBaseUrl}/api/map/no2/metadata`, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`NO2 map metadata request failed with ${response.status}`);
  }
  if (response.status === 204) {
    throw new Error("NO2 map tiles are unavailable");
  }

  return normalizeNo2MapTileMetadata(await response.json());
}

export async function fetchNo2MapGridMetadata(
  fetcher: typeof fetch = fetch,
  apiBaseUrl: string = getApiBaseUrl()
): Promise<No2MapGridMetadata> {
  const response = await fetcher(`${apiBaseUrl}/api/map/no2/grid/metadata`, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`NO2 grid metadata request failed with ${response.status}`);
  }
  if (response.status === 204) {
    throw new Error("NO2 grid cache is unavailable");
  }

  return normalizeNo2MapGridMetadata(await response.json());
}

export async function fetchNo2MapGridData(
  fetcher: typeof fetch = fetch,
  metadata: No2MapGridMetadata,
  season: WebDataSeason,
  year: number,
  apiBaseUrl: string = getApiBaseUrl()
): Promise<No2MapGridFeatureCollection> {
  const response = await fetcher(buildNo2GridDataUrl(metadata, season, year, apiBaseUrl), {
    cache: "force-cache",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`NO2 grid data request failed with ${response.status}`);
  }

  return normalizeNo2MapGridFeatureCollection(await response.json());
}

export async function loadNo2MapData(
  fetcher: typeof fetch,
  apiBaseUrl: string,
  season: WebDataSeason,
  year: number,
  options: LoadNo2MapDataOptions = {}
): Promise<No2MapDataLoadResult> {
  const cacheKey = getNo2MapDataCacheKey(apiBaseUrl, season, year);
  const cachedLoad = no2MapDataLoadCache.get(cacheKey);
  if (cachedLoad) return cachedLoad;

  const loadPromise = loadNo2MapDataWithRetries(fetcher, apiBaseUrl, season, year, options).catch((error) => {
    no2MapDataLoadCache.delete(cacheKey);
    throw error;
  });
  no2MapDataLoadCache.set(cacheKey, loadPromise);
  return loadPromise;
}

export function clearNo2MapDataCache() {
  no2MapDataLoadCache.clear();
  no2TileMetadataRequestCache.clear();
  no2GridMetadataRequestCache.clear();
  no2GridDataRequestCache.clear();
}

async function loadNo2MapDataWithRetries(
  fetcher: typeof fetch,
  apiBaseUrl: string,
  season: WebDataSeason,
  year: number,
  options: LoadNo2MapDataOptions
): Promise<No2MapDataLoadResult> {
  const retries = Math.max(0, options.retries ?? DEFAULT_NO2_MAP_DATA_RETRIES);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? DEFAULT_NO2_MAP_DATA_RETRY_DELAY_MS);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await loadNo2MapDataOnce(fetcher, apiBaseUrl, season, year);
    } catch (error) {
      if (!isRetryableNo2MapDataError(error) || attempt >= retries) throw error;
      await waitForNo2MapDataRetry(retryDelayMs);
    }
  }

  throw new Error("NO2 map data is unavailable");
}

export function normalizeBackendSnapshot(body: BackendDatasetResponse): WebDataSnapshot {
  if (!body.citiesPwe || !body.countryPwe || !body.healthImpact || !body.seasonalTrend || !body.summary) {
    throw new Error("Dataset response is missing required web_data keys");
  }

  return normalizeWebDataSnapshot({
    citiesPwe: body.citiesPwe,
    countryPwe: body.countryPwe,
    cityRows: body.cityRows,
    countryRows: body.countryRows,
    healthImpact: body.healthImpact,
    seasonalTrend: body.seasonalTrend,
    summary: body.summary
  });
}

export function normalizeNo2MapTileMetadata(body: unknown): No2MapTileMetadata {
  if (!isRecord(body)) throw new Error("NO2 map metadata is malformed");
  const common = normalizeNo2MapMetadataCommon(body);
  const tileUrlTemplate = asString(body.tileUrlTemplate, "tileUrlTemplate");

  return {
    ...common,
    tileUrlTemplate,
    minzoom: asNumber(body.minzoom, "minzoom"),
    maxzoom: asNumber(body.maxzoom, "maxzoom")
  };
}

export function normalizeNo2MapGridMetadata(body: unknown): No2MapGridMetadata {
  if (!isRecord(body)) throw new Error("NO2 grid metadata is malformed");
  return {
    ...normalizeNo2MapMetadataCommon(body),
    dataUrlTemplate: asString(body.dataUrlTemplate, "dataUrlTemplate")
  };
}

export function normalizeNo2MapGridFeatureCollection(body: unknown): No2MapGridFeatureCollection {
  if (!isRecord(body) || body.type !== "FeatureCollection" || !Array.isArray(body.features)) {
    throw new Error("NO2 grid data must be a GeoJSON FeatureCollection");
  }
  return body as No2MapGridFeatureCollection;
}

export function buildNo2TileUrlTemplate(metadata: No2MapTileMetadata, season: WebDataSeason, year: number, apiBaseUrl: string = getApiBaseUrl()) {
  const template = metadata.tileUrlTemplate.startsWith("http") ? metadata.tileUrlTemplate : `${apiBaseUrl}${metadata.tileUrlTemplate}`;
  return template
    .replace("{season}", encodeURIComponent(season))
    .replace("{year}", String(year));
}

export function buildNo2GridDataUrl(metadata: No2MapGridMetadata, season: WebDataSeason, year: number, apiBaseUrl: string = getApiBaseUrl()) {
  const template = metadata.dataUrlTemplate.startsWith("http") ? metadata.dataUrlTemplate : `${apiBaseUrl}${metadata.dataUrlTemplate}`;
  return template
    .replace("{season}", encodeURIComponent(season))
    .replace("{year}", String(year));
}

export function getNo2MapSeasonYearRanges(
  metadata: No2MapTileMetadata | No2MapGridMetadata,
  season: WebDataSeason,
  year: number
): No2MapValueRanges | null {
  return metadata.rangesBySeasonYear?.[season]?.[String(year)] ?? null;
}

async function loadNo2MapDataOnce(
  fetcher: typeof fetch,
  apiBaseUrl: string,
  season: WebDataSeason,
  year: number
): Promise<No2MapDataLoadResult> {
  const tileMetadata = await fetchSupportedNo2MapTileMetadata(fetcher, apiBaseUrl, season, year);
  if (tileMetadata) return { source: "tile", metadata: tileMetadata };

  return loadNo2MapGridFallback(fetcher, apiBaseUrl, season, year);
}

async function loadNo2MapGridFallback(
  fetcher: typeof fetch,
  apiBaseUrl: string,
  season: WebDataSeason,
  year: number
): Promise<No2MapDataLoadResult> {
  const metadata = await fetchCachedNo2MapGridMetadata(fetcher, apiBaseUrl, season, year);
  assertNo2MapMetadataSupports(metadata, season, year);
  const data = await fetchCachedNo2MapGridData(fetcher, metadata, season, year, apiBaseUrl);
  return { source: "grid", metadata, data };
}

async function fetchSupportedNo2MapTileMetadata(
  fetcher: typeof fetch,
  apiBaseUrl: string,
  season: WebDataSeason,
  year: number
) {
  try {
    const metadata = await fetchCachedNo2MapTileMetadata(fetcher, apiBaseUrl, season, year);
    if (!metadata.availableSeasons.includes(season) || !metadata.availableYears.includes(year)) return null;
    const gridFallback = settleNo2MapGridFallback(loadNo2MapGridFallback(fetcher, apiBaseUrl, season, year));
    if (await hasNo2MapInitialTileCoverage(fetcher, metadata, season, year, apiBaseUrl)) return metadata;
    await unwrapSettledNo2MapGridFallback(gridFallback);
  } catch (error) {
    if (!isNo2MapTileUnavailableError(error)) throw error;
  }

  return null;
}

async function hasNo2MapInitialTileCoverage(
  fetcher: typeof fetch,
  metadata: No2MapTileMetadata,
  season: WebDataSeason,
  year: number,
  apiBaseUrl: string
) {
  const urls = buildNo2InitialTileProbeUrls(metadata, season, year, apiBaseUrl);
  if (urls.length === 0) return false;

  return new Promise<boolean>((resolve, reject) => {
    let remaining = urls.length;
    let settled = false;

    urls.forEach((url) => {
      probeNo2MapTileCoverage(fetcher, url).then(
        (covered) => {
          if (settled) return;
          if (!covered) {
            settled = true;
            resolve(false);
            return;
          }

          remaining -= 1;
          if (remaining === 0) {
            settled = true;
            resolve(true);
          }
        },
        (error: unknown) => {
          if (settled) return;
          settled = true;
          reject(error);
        }
      );
    });
  });
}

async function probeNo2MapTileCoverage(fetcher: typeof fetch, url: string) {
  const response = await fetcher(url, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.mapbox-vector-tile"
    }
  });

  await cancelNo2MapTileProbeBody(response);
  if (response.status === 204 || response.status === 404) return false;
  if (!response.ok) throw new Error(`NO2 map tile probe request failed with ${response.status}`);
  return true;
}

async function cancelNo2MapTileProbeBody(response: Response) {
  try {
    await response.body?.cancel();
  } catch {
    // The probe only needs headers; ignore browsers or mocks that cannot cancel the stream.
  }
}

function buildNo2InitialTileProbeUrls(
  metadata: No2MapTileMetadata,
  season: WebDataSeason,
  year: number,
  apiBaseUrl: string
) {
  const zoom = metadata.minzoom;
  const [west, south, east, north] = metadata.bounds;
  const minX = lonToTileX(west, zoom);
  const maxX = lonToTileX(east, zoom);
  const minY = latToTileY(north, zoom);
  const maxY = latToTileY(south, zoom);
  const tileCount = (maxX - minX + 1) * (maxY - minY + 1);
  if (tileCount <= 0 || tileCount > NO2_MAP_TILE_PREFLIGHT_LIMIT) return [];

  const template = buildNo2TileUrlTemplate(metadata, season, year, apiBaseUrl);
  const urls: string[] = [];
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      urls.push(template.replace("{z}", String(zoom)).replace("{x}", String(x)).replace("{y}", String(y)));
    }
  }
  return urls;
}

function lonToTileX(longitude: number, zoom: number) {
  const scale = 2 ** zoom;
  return clampTileCoordinate(Math.floor(((longitude + 180) / 360) * scale), scale);
}

function latToTileY(latitude: number, zoom: number) {
  const scale = 2 ** zoom;
  const latitudeRadians = (Math.max(-85.05112878, Math.min(85.05112878, latitude)) * Math.PI) / 180;
  const value =
    ((1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2) * scale;
  return clampTileCoordinate(Math.floor(value), scale);
}

function clampTileCoordinate(value: number, scale: number) {
  return Math.min(scale - 1, Math.max(0, value));
}

function assertNo2MapMetadataSupports(metadata: No2MapTileMetadata | No2MapGridMetadata, season: WebDataSeason, year: number) {
  if (!metadata.availableSeasons.includes(season)) {
    throw new Error(`Backend NO2 population grid is unavailable for ${season}.`);
  }
  if (!metadata.availableYears.includes(year)) {
    throw new Error(`Backend NO2 population grid is unavailable for ${year}.`);
  }
}

function fetchCachedNo2MapTileMetadata(
  fetcher: typeof fetch,
  apiBaseUrl: string,
  season: WebDataSeason,
  year: number
) {
  const cacheKey = getNo2MapDataCacheKey(apiBaseUrl, season, year);
  const cachedRequest = no2TileMetadataRequestCache.get(cacheKey);
  if (cachedRequest) return cachedRequest;

  const request = fetchNo2MapTileMetadata(fetcher, apiBaseUrl).catch((error) => {
    no2TileMetadataRequestCache.delete(cacheKey);
    throw error;
  });
  no2TileMetadataRequestCache.set(cacheKey, request);
  return request;
}

function fetchCachedNo2MapGridMetadata(
  fetcher: typeof fetch,
  apiBaseUrl: string,
  season: WebDataSeason,
  year: number
) {
  const cacheKey = getNo2MapDataCacheKey(apiBaseUrl, season, year);
  const cachedRequest = no2GridMetadataRequestCache.get(cacheKey);
  if (cachedRequest) return cachedRequest;

  const request = fetchNo2MapGridMetadata(fetcher, apiBaseUrl).catch((error) => {
    no2GridMetadataRequestCache.delete(cacheKey);
    throw error;
  });
  no2GridMetadataRequestCache.set(cacheKey, request);
  return request;
}

function fetchCachedNo2MapGridData(
  fetcher: typeof fetch,
  metadata: No2MapGridMetadata,
  season: WebDataSeason,
  year: number,
  apiBaseUrl: string
) {
  const cacheKey = getNo2MapDataCacheKey(apiBaseUrl, season, year);
  const cachedRequest = no2GridDataRequestCache.get(cacheKey);
  if (cachedRequest) return cachedRequest;

  const request = fetchNo2MapGridData(fetcher, metadata, season, year, apiBaseUrl).catch((error) => {
    no2GridDataRequestCache.delete(cacheKey);
    throw error;
  });
  no2GridDataRequestCache.set(cacheKey, request);
  return request;
}

function settleNo2MapGridFallback(promise: Promise<No2MapDataLoadResult>) {
  return promise.then(
    (value) => ({ status: "fulfilled" as const, value }),
    (reason: unknown) => ({ status: "rejected" as const, reason })
  );
}

async function unwrapSettledNo2MapGridFallback(promise: ReturnType<typeof settleNo2MapGridFallback>) {
  const result = await promise;
  if (result.status === "rejected") throw result.reason;
  return result.value;
}

function getNo2MapDataCacheKey(apiBaseUrl: string, season: WebDataSeason, year: number) {
  return `${apiBaseUrl.replace(/\/+$/, "")}|${season}|${year}`;
}

function isNo2MapTileUnavailableError(error: unknown) {
  return error instanceof Error && error.message === "NO2 map tiles are unavailable";
}

function isRetryableNo2MapDataError(error: unknown) {
  if (!(error instanceof Error)) return true;

  const message = error.message;
  if (
    /NO2 map tiles are unavailable|NO2 grid cache is unavailable|Backend NO2 population grid is unavailable for/i.test(message) ||
    /malformed|must be|contains an unsupported|missing required|log10_pixel_exposure/i.test(message)
  ) {
    return false;
  }

  const status = message.match(/request failed with (\d+)/i)?.[1];
  if (!status) return true;

  const statusCode = Number(status);
  return statusCode === 408 || statusCode === 409 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
}

function waitForNo2MapDataRetry(delayMs: number) {
  if (delayMs <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function getBrowserProductionApiBaseUrl() {
  if (typeof window === "undefined") return "";
  return PRODUCTION_FRONTEND_HOSTNAMES.has(window.location.hostname) ? PRODUCTION_API_BASE_URL : "";
}

function normalizeNo2MapMetadataCommon(body: Record<string, unknown>) {
  const availableYears = asNumberArray(body.availableYears, "availableYears");
  const availableSeasons = asSeasonArray(body.availableSeasons, "availableSeasons");
  const bounds = asBounds(body.bounds);
  const valueField = asString(body.valueField, "valueField");
  if (valueField !== "log10_pixel_exposure") {
    throw new Error("NO2 map metadata must use log10_pixel_exposure as its value field");
  }

  return {
    availableYears,
    availableSeasons,
    bounds,
    layerName: asString(body.layerName, "layerName"),
    valueField: "log10_pixel_exposure" as const,
    no2Column: asRange(body.no2Column, "no2Column"),
    populationCount: asRange(body.populationCount, "populationCount"),
    pixelExposure: asRange(body.pixelExposure, "pixelExposure"),
    log10PixelExposure: asRange(body.log10PixelExposure, "log10PixelExposure"),
    rangesBySeasonYear: asOptionalRangesBySeasonYear(body.rangesBySeasonYear),
    units: {
      no2Column: asString(asRecord(body.units, "units").no2Column, "units.no2Column"),
      populationCount: asString(asRecord(body.units, "units").populationCount, "units.populationCount"),
      pixelExposure: asString(asRecord(body.units, "units").pixelExposure, "units.pixelExposure"),
      log10PixelExposure: asString(asRecord(body.units, "units").log10PixelExposure, "units.log10PixelExposure"),
      npwei: asString(asRecord(body.units, "units").npwei, "units.npwei")
    },
    generatedAt: asString(body.generatedAt, "generatedAt"),
    seasonYearDefinition:
      body.seasonYearDefinition === undefined || body.seasonYearDefinition === null
        ? undefined
        : asString(body.seasonYearDefinition, "seasonYearDefinition")
  };
}

function asOptionalRangesBySeasonYear(value: unknown): Partial<Record<WebDataSeason, Record<string, No2MapValueRanges>>> | undefined {
  if (value === undefined) return undefined;
  const record = asRecord(value, "rangesBySeasonYear");
  const output: Partial<Record<WebDataSeason, Record<string, No2MapValueRanges>>> = {};

  for (const [season, years] of Object.entries(record)) {
    if (season !== "Annual" && season !== "DJF" && season !== "JJA") {
      throw new Error("NO2 map metadata rangesBySeasonYear contains an unsupported season");
    }
    const yearRanges = asRecord(years, `rangesBySeasonYear.${season}`);
    output[season] = {};
    for (const [year, ranges] of Object.entries(yearRanges)) {
      output[season]![year] = asValueRanges(ranges, `rangesBySeasonYear.${season}.${year}`);
    }
  }

  return output;
}

function asValueRanges(value: unknown, field: string): No2MapValueRanges {
  const record = asRecord(value, field);
  return {
    no2Column: asRange(record.no2Column, `${field}.no2Column`),
    populationCount: asRange(record.populationCount, `${field}.populationCount`),
    pixelExposure: asRange(record.pixelExposure, `${field}.pixelExposure`),
    log10PixelExposure: asRange(record.log10PixelExposure, `${field}.log10PixelExposure`)
  };
}

function asRange(value: unknown, field: string): NumericRange {
  const record = asRecord(value, field);
  return {
    min: asNumber(record.min, `${field}.min`),
    max: asNumber(record.max, `${field}.max`)
  };
}

function asBounds(value: unknown): [number, number, number, number] {
  const values = asNumberArray(value, "bounds");
  if (values.length !== 4) throw new Error("NO2 map metadata bounds must contain four numbers");
  return [values[0], values[1], values[2], values[3]];
}

function asSeasonArray(value: unknown, field: string): WebDataSeason[] {
  if (!Array.isArray(value)) throw new Error(`NO2 map metadata ${field} must be an array`);
  const seasons = value.map((item) => asString(item, field));
  if (!seasons.every((item): item is WebDataSeason => item === "Annual" || item === "DJF" || item === "JJA")) {
    throw new Error(`NO2 map metadata ${field} contains an unsupported season`);
  }
  return seasons;
}

function asNumberArray(value: unknown, field: string): number[] {
  if (!Array.isArray(value)) throw new Error(`NO2 map metadata ${field} must be an array`);
  return value.map((item, index) => asNumber(item, `${field}.${index}`));
}

function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`NO2 map metadata ${field} must be an object`);
  return value;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`NO2 map metadata ${field} must be a string`);
  return value;
}

function asNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`NO2 map metadata ${field} must be a finite number`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

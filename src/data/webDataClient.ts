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

type BackendDatasetResponse = {
  citiesPwe?: Record<string, CityPweValue>;
  countryPwe?: Record<string, CountryPweValue>;
  cityRows?: Record<WebDataSeason, CityNpweiRow[]>;
  countryRows?: Record<WebDataSeason, CountryPweRow[]>;
  healthImpact?: Record<WebDataSeason, HealthSeasonSummary>;
  seasonalTrend?: Record<string, Record<WebDataSeason, number | null>>;
  summary?: WebDataSummary;
};

export type WebDataLoadResult = {
  snapshot: WebDataSnapshot;
  source: "backend" | "local";
};

export function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
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

export type Season = "all" | "dry" | "wet";
export type LayerKey = "no2" | "fire" | "population";
export type MapMetricMode = "npwei" | "no2";

export interface Country {
  id: string;
  iso3: string;
  name: string;
  region: string;
  population: number;
  centroid: [number, number];
  baselineNo2: number;
  polygon: [number, number][];
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  population: number;
  coordinates: [number, number];
}

export interface AnnualMetric {
  countryId: string;
  year: number;
  no2: number;
  dryNo2: number;
  wetNo2: number;
  populationExposure: number;
  fireCount: number;
}

export interface MonthlyMetric {
  countryId: string;
  year: number;
  month: number;
  season: Exclude<Season, "all">;
  no2: number;
  fireCount: number;
  populationExposure: number;
}

export interface Hotspot {
  id: string;
  countryId: string;
  cityId?: string;
  label: string;
  coordinates: [number, number];
  no2: number;
  fireIntensity: number;
  populationExposure: number;
  category: "urban" | "industrial" | "fire" | "transport";
}

export interface FireActivityPoint {
  id: string;
  countryId: string;
  label: string;
  coordinates: [number, number];
  frp: number;
  month: number;
  season: Exclude<Season, "all">;
}

export interface InterpolatedNo2Cell {
  id: string;
  countryId: string;
  countryName: string;
  centroid: [number, number];
  column: number;
  polygon: [number, number][];
}

export interface Filters {
  regionId?: string;
  countryId: string;
  cityId: string;
  year: number;
  startYear?: number;
  endYear?: number;
  month: number | "all";
  season: Season;
}

export interface SummaryMetric {
  label: string;
  value: string;
  delta: number;
  tone: "cyan" | "lime" | "amber" | "rose";
  detail: string;
}

export interface RankingRow {
  id: string;
  name: string;
  no2: number;
  exposure: number;
  fireCount: number;
  hotspotShare: number;
}

export interface MapCityRankingRow {
  id: string;
  city: string;
  country: string;
  countryId: string;
  value: number;
  population: number;
}

export interface TrendPoint {
  label: string;
  year?: number;
  month?: number;
  no2?: number;
  fireCount?: number;
  exposure?: number;
  dry?: number;
  wet?: number;
}

import citiesPweJson from "@/data/web_data/cities_pwe.json";
import countryPweJson from "@/data/web_data/country_pwe.json";
import healthImpactJson from "@/data/web_data/health_impact.json";
import seasonalTrendJson from "@/data/web_data/seasonal_trend.json";
import summaryJson from "@/data/web_data/summary.json";

export type WebDataSeason = "Annual" | "DJF" | "JJA";
export type RiskTierLabel = "Minimal" | "Low" | "Moderate" | "High" | "Very High";
export type LegacyRiskTierLabel = "Elevated" | "Severe" | "Critical" | "Severe/Critical";
export type RiskTone = "minimal" | "low" | "moderate" | "high" | "very-high";
type LegacyRiskTone = "elevated" | "severe" | "critical";

export type CityPweValue = {
  lon: number;
  lat: number;
  country: string;
  DJF_pwe: number;
  JJA_pwe: number;
  Annual_pwe: number;
  urban_pop: number;
  DJF_npwei: number;
  JJA_npwei: number;
  Annual_npwei: number;
};

export type CountryPweValue = {
  DJF: number;
  JJA: number;
  Annual: number;
  urban_population_millions: number;
  total_population_millions: number | null;
};

type HealthRiskItem = {
  country?: string;
  city?: string;
  npwei: number;
};

export type HealthSeasonSummary = {
  wa_npwei: number;
  wa_risk_tier: RiskTierLabel;
  tier_populations_millions: Partial<Record<RiskTierLabel | LegacyRiskTierLabel, number>>;
  high_risk_population_millions: number;
  high_risk_pct_urban: number;
  high_risk_countries: Array<HealthRiskItem & { country: string }>;
  n_high_risk_countries: number;
  high_risk_cities: Array<HealthRiskItem & { city: string; country: string }>;
};

export type CityNpweiRow = {
  annualNpwei: number;
  country: string;
  djfNpwei: number;
  jjaNpwei: number;
  lat: number;
  lon: number;
  name: string;
  npwei: number;
  pwe: number;
  rank: number;
  riskColor: string;
  riskLabel: RiskTierLabel;
  riskTone: RiskTone;
  seasonGap: number;
  urbanPop: number;
};

export type CountryPweRow = {
  country: string;
  npwei: number;
  pwe: number;
  rank: number;
  riskColor: string;
  riskLabel: RiskTierLabel;
  riskTone: RiskTone;
  urbanPopulationMillions: number;
};

export type HealthRiskTierRow = {
  color: string;
  label: RiskTierLabel;
  populationMillions: number;
  share: number;
  tone: RiskTone;
};

export type SeasonalTrendRow = {
  year: string;
  Annual: number | null;
  DJF: number | null;
  JJA: number | null;
};

export type WebDataSummary = {
  wa_pwe_djf: number;
  wa_pwe_jja: number;
  wa_pwe_annual: number;
  years_covered: number[];
  urban_threshold_people_per_km2: number;
  total_urban_population: number;
  total_population: number;
  months_by_year?: Record<string, number[]>;
  partial_years?: Record<string, { expected_months: number; months: number[]; observed_months: number }>;
  no2_units?: string;
  no2_variable?: string;
  population_source?: string;
  formula?: string;
  npwei_formula?: string;
  normalization_scope?: string;
  runtime_source?: string;
};

export type WebDataSnapshot = {
  citiesPwe: Record<string, CityPweValue>;
  countryPwe: Record<string, CountryPweValue>;
  cityRows?: Record<WebDataSeason, CityNpweiRow[]>;
  countryRows?: Record<WebDataSeason, CountryPweRow[]>;
  healthImpact: Record<WebDataSeason, HealthSeasonSummary>;
  seasonalTrend: Record<string, Record<WebDataSeason, number | null>>;
  summary: WebDataSummary;
};

const riskLabelAliases: Record<LegacyRiskTierLabel, RiskTierLabel> = {
  Critical: "Very High",
  Elevated: "Low",
  Severe: "Very High",
  "Severe/Critical": "Very High"
};

const riskToneAliases: Record<LegacyRiskTone, RiskTone> = {
  critical: "very-high",
  elevated: "low",
  severe: "very-high"
};

export const WEB_DATA_SEASONS = ["Annual", "DJF", "JJA"] as const satisfies readonly WebDataSeason[];

const riskTiers: Array<{ color: string; label: RiskTierLabel; min: number; tone: RiskTone }> = [
  { label: "Very High", min: 80, color: "#ef4444", tone: "very-high" },
  { label: "High", min: 60, color: "#f97316", tone: "high" },
  { label: "Moderate", min: 40, color: "#eab308", tone: "moderate" },
  { label: "Low", min: 20, color: "#84cc16", tone: "low" },
  { label: "Minimal", min: 0, color: "#22c55e", tone: "minimal" }
];

export const RISK_TIER_ORDER = riskTiers.map((tier) => tier.label);

const localWebDataSnapshot: WebDataSnapshot = normalizeWebDataSnapshot({
  citiesPwe: citiesPweJson as Record<string, CityPweValue>,
  countryPwe: countryPweJson as Record<string, CountryPweValue>,
  healthImpact: healthImpactJson as Record<WebDataSeason, HealthSeasonSummary>,
  seasonalTrend: seasonalTrendJson as Record<string, Record<WebDataSeason, number>>,
  summary: summaryJson as WebDataSummary
});

let activeWebDataSnapshot = localWebDataSnapshot;
let activeWebDataVersion = 0;
const webDataListeners = new Set<() => void>();

export const webDataSummary = localWebDataSnapshot.summary;

export function getLocalWebDataSnapshot() {
  return localWebDataSnapshot;
}

export function getActiveWebDataSnapshot() {
  return activeWebDataSnapshot;
}

export function getWebDataSummary() {
  return activeWebDataSnapshot.summary;
}

export function setActiveWebDataSnapshot(snapshot: WebDataSnapshot) {
  activeWebDataSnapshot = normalizeWebDataSnapshot(snapshot);
  activeWebDataVersion += 1;
  webDataListeners.forEach((listener) => listener());
}

export function resetActiveWebDataSnapshot() {
  setActiveWebDataSnapshot(localWebDataSnapshot);
}

export function subscribeWebData(listener: () => void) {
  webDataListeners.add(listener);
  return () => webDataListeners.delete(listener);
}

export function getWebDataVersion() {
  return activeWebDataVersion;
}

export const SEASON_LABELS: Record<WebDataSeason, string> = {
  Annual: "Annual Mean",
  DJF: "Dry Season (DJF)",
  JJA: "Wet Season (JJA)"
};

export function getRiskTier(score: number) {
  return riskTiers.find((tier) => score >= tier.min) ?? riskTiers[riskTiers.length - 1];
}

export function getCityRows(season: WebDataSeason): CityNpweiRow[] {
  const snapshot = getActiveWebDataSnapshot();
  const backendRows = snapshot.cityRows?.[season];
  if (backendRows) return backendRows.map(normalizeCityRow);

  const citiesPwe = snapshot.citiesPwe;
  const annualScores = normalizePweScores(citiesPwe, "Annual", (city, itemSeason) => city[`${itemSeason}_pwe`]);
  const djfScores = normalizePweScores(citiesPwe, "DJF", (city, itemSeason) => city[`${itemSeason}_pwe`]);
  const jjaScores = normalizePweScores(citiesPwe, "JJA", (city, itemSeason) => city[`${itemSeason}_pwe`]);
  const selectedScores = season === "Annual" ? annualScores : season === "DJF" ? djfScores : jjaScores;

  return Object.entries(citiesPwe)
    .map(([name, city]) => {
      const npwei = selectedScores.get(name) ?? 0;
      const annualNpwei = annualScores.get(name) ?? city.Annual_npwei;
      const djfNpwei = djfScores.get(name) ?? city.DJF_npwei;
      const jjaNpwei = jjaScores.get(name) ?? city.JJA_npwei;
      const risk = getRiskTier(npwei);

      return {
        annualNpwei,
        country: city.country,
        djfNpwei,
        jjaNpwei,
        lat: city.lat,
        lon: city.lon,
        name,
        npwei,
        pwe: city[`${season}_pwe`],
        rank: 0,
        riskColor: risk.color,
        riskLabel: risk.label,
        riskTone: risk.tone,
        seasonGap: djfNpwei - jjaNpwei,
        urbanPop: city.urban_pop
      };
    })
    .sort((a, b) => b.npwei - a.npwei || b.urbanPop - a.urbanPop)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function getCityRow(name: string, season: WebDataSeason) {
  return getCityRows(season).find((row) => row.name === name) ?? getCityRows(season)[0];
}

export function getCountryRows(season: WebDataSeason): CountryPweRow[] {
  const snapshot = getActiveWebDataSnapshot();
  const backendRows = snapshot.countryRows?.[season];
  if (backendRows) return backendRows.map(normalizeCountryRow);

  const countryPwe = snapshot.countryPwe;
  const entries = Object.entries(countryPwe);
  const values = entries.map(([, country]) => country[season]);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return entries
    .map(([country, value]) => {
      const npwei = normalize(value[season], min, max) ?? 0;
      const risk = getRiskTier(npwei);

      return {
        country,
        npwei,
        pwe: value[season],
        rank: 0,
        riskColor: risk.color,
        riskLabel: risk.label,
        riskTone: risk.tone,
        urbanPopulationMillions: value.urban_population_millions
      };
    })
    .sort((a, b) => b.npwei - a.npwei || b.urbanPopulationMillions - a.urbanPopulationMillions)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function getHealthSeasonSummary(season: WebDataSeason) {
  return getActiveWebDataSnapshot().healthImpact[season];
}

export function getHealthRiskTierRows(season: WebDataSeason): HealthRiskTierRow[] {
  const summary = getHealthSeasonSummary(season);
  const total = RISK_TIER_ORDER.reduce((sum, label) => sum + (summary.tier_populations_millions[label] ?? 0), 0);

  return RISK_TIER_ORDER.map((label) => {
    const risk = riskTiers.find((tier) => tier.label === label) ?? riskTiers[riskTiers.length - 1];
    const populationMillions = summary.tier_populations_millions[label] ?? 0;

    return {
      color: risk.color,
      label,
      populationMillions,
      share: total > 0 ? (populationMillions / total) * 100 : 0,
      tone: risk.tone
    };
  });
}

export function getHealthHighRiskCountries(season: WebDataSeason) {
  return [...getHealthSeasonSummary(season).high_risk_countries].sort((a, b) => b.npwei - a.npwei);
}

export function getHealthHighRiskCities(season: WebDataSeason) {
  const listed = [...getHealthSeasonSummary(season).high_risk_cities].sort((a, b) => b.npwei - a.npwei);
  if (listed.length > 0) return listed;

  return getCityRows(season)
    .filter((row) => row.npwei >= 60)
    .map((row) => ({ city: row.name, country: row.country, npwei: row.npwei }));
}

export function getAverageCityNpwei(season: WebDataSeason) {
  const rows = getCityRows(season);
  return rows.reduce((total, row) => total + row.npwei, 0) / Math.max(1, rows.length);
}

export function getHighRiskCityCount(season: WebDataSeason) {
  return getCityRows(season).filter((row) => row.npwei >= 60).length;
}

export function getHighRiskCountryCount(season: WebDataSeason) {
  return getCountryRows(season).filter((row) => row.npwei >= 60).length;
}

export function getHighRiskCityPopulation(season: WebDataSeason) {
  return getCityRows(season)
    .filter((row) => row.npwei >= 60)
    .reduce((total, row) => total + row.urbanPop, 0);
}

export function getSeasonalTrendRows(): SeasonalTrendRow[] {
  const seasonalTrend = getActiveWebDataSnapshot().seasonalTrend;
  const allValues = Object.values(seasonalTrend)
    .flatMap((year) => WEB_DATA_SEASONS.map((season) => year[season]))
    .filter(isFiniteNumber);
  if (allValues.length === 0) return [];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  return Object.entries(seasonalTrend)
    .sort(([yearA], [yearB]) => Number(yearA) - Number(yearB))
    .map(([year, values]) => ({
      year,
      Annual: normalize(values.Annual, min, max),
      DJF: normalize(values.DJF, min, max),
      JJA: normalize(values.JJA, min, max)
    }));
}

export function formatPwe(value: number) {
  if (!Number.isFinite(value)) return "No data";
  const [mantissa, exponent] = value.toExponential(2).split("e");
  return `${mantissa} x 10^${Number(exponent)} molec cm^-2`;
}

export function buildCitiesCsv(season: WebDataSeason) {
  const rows = [
    ["City", "Country", "Latitude", "Longitude", "NPWEI_Annual", "NPWEI_DJF", "NPWEI_JJA", "NPWEI_Selected", "Risk_Level", "Urban_Pop_M"],
    ...getCityRows(season).map((row) => [
      row.name,
      row.country,
      row.lat,
      row.lon,
      row.annualNpwei,
      row.djfNpwei,
      row.jjaNpwei,
      row.npwei,
      row.riskLabel,
      row.urbanPop.toFixed(2)
    ])
  ];

  return toCsv(rows);
}

export function buildHealthCsv(season: WebDataSeason) {
  const rows = [
    ["City", "Country", "NPWEI", "Risk_Level", "Urban_Pop_M", "NPWEI_DJF", "NPWEI_JJA", "Season"],
    ...getCityRows(season).map((row) => [
      row.name,
      row.country,
      row.npwei,
      row.riskLabel,
      row.urbanPop.toFixed(2),
      row.djfNpwei,
      row.jjaNpwei,
      season
    ])
  ];

  return toCsv(rows);
}

export function canonicalRiskLabel(label: string): RiskTierLabel {
  if (label in riskLabelAliases) return riskLabelAliases[label as LegacyRiskTierLabel];
  if (RISK_TIER_ORDER.includes(label as RiskTierLabel)) return label as RiskTierLabel;
  return "Minimal";
}

export function canonicalRiskTone(tone: string): RiskTone {
  if (tone in riskToneAliases) return riskToneAliases[tone as LegacyRiskTone];
  if (["minimal", "low", "moderate", "high", "very-high"].includes(tone)) return tone as RiskTone;
  return "minimal";
}

export function normalizeWebDataSnapshot(snapshot: WebDataSnapshot): WebDataSnapshot {
  return {
    ...snapshot,
    cityRows: normalizeRowsBySeason(snapshot.cityRows, normalizeCityRow),
    countryRows: normalizeRowsBySeason(snapshot.countryRows, normalizeCountryRow),
    healthImpact: Object.fromEntries(
      WEB_DATA_SEASONS.map((season) => [season, normalizeHealthSummary(snapshot.healthImpact[season])])
    ) as Record<WebDataSeason, HealthSeasonSummary>
  };
}

function normalizeRowsBySeason<T>(rows: Record<WebDataSeason, T[]> | undefined, normalizeRow: (row: T) => T) {
  if (!rows) return undefined;
  return Object.fromEntries(WEB_DATA_SEASONS.map((season) => [season, rows[season]?.map(normalizeRow) ?? []])) as Record<WebDataSeason, T[]>;
}

function normalizeCityRow(row: CityNpweiRow): CityNpweiRow {
  return {
    ...row,
    riskLabel: canonicalRiskLabel(String(row.riskLabel)),
    riskTone: canonicalRiskTone(String(row.riskTone))
  };
}

function normalizeCountryRow(row: CountryPweRow): CountryPweRow {
  return {
    ...row,
    riskLabel: canonicalRiskLabel(String(row.riskLabel)),
    riskTone: canonicalRiskTone(String(row.riskTone))
  };
}

function normalizeHealthSummary(summary: HealthSeasonSummary): HealthSeasonSummary {
  const tier_populations_millions = Object.fromEntries(RISK_TIER_ORDER.map((label) => [label, 0])) as Record<RiskTierLabel, number>;
  Object.entries(summary.tier_populations_millions ?? {}).forEach(([label, population]) => {
    tier_populations_millions[canonicalRiskLabel(label)] += Number(population ?? 0);
  });

  return {
    ...summary,
    wa_risk_tier: canonicalRiskLabel(String(summary.wa_risk_tier)),
    tier_populations_millions
  };
}

function normalize(value: number | null | undefined, min: number, max: number) {
  if (!isFiniteNumber(value)) return null;
  const span = max - min;
  if (span === 0) return 0;
  return Math.round(((value - min) / span) * 100);
}

function normalizePweScores<T>(
  rows: Record<string, T>,
  season: WebDataSeason,
  getValue: (row: T, season: WebDataSeason) => number
) {
  const entries = Object.entries(rows);
  const values = entries.map(([, row]) => getValue(row, season));
  const min = Math.min(...values);
  const max = Math.max(...values);

  return new Map(entries.map(([name, row]) => [name, normalize(getValue(row, season), min, max)]));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toCsv(rows: Array<Array<number | string>>) {
  return rows
    .map((row) =>
      row
        .map((value) => String(value).replaceAll("\"", "\"\""))
        .map((value) => (/[",\n]/.test(value) ? `"${value}"` : value))
        .join(",")
    )
    .join("\n");
}

"use client";

import { useMemo, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { Users, Wind } from "lucide-react";
import { useObservatoryFilters } from "@/components/ObservatoryContext";
import { MapPanelSkeleton } from "@/components/Skeletons";
import type { TargetNpweiMapProps } from "@/components/TargetNpweiMap";
import type { Filters, Season } from "@/types/exposure";
import {
  SEASON_LABELS,
  getLocalCityRows,
  getLocalCountryRows,
  getLocalHealthSeasonSummary,
  getLocalWebDataYears,
  type CityNpweiRow,
  type CountryPweRow,
  type WebDataSeason
} from "@/data/webData";

const COUNTRY_IDS: Record<string, string> = {
  Benin: "ben",
  "Burkina Faso": "bfa",
  "Cote d'Ivoire": "civ",
  "Côte d'Ivoire": "civ",
  Gambia: "gmb",
  Ghana: "gha",
  Guinea: "gin",
  "Guinea-Bissau": "gnb",
  Liberia: "lbr",
  Mali: "mli",
  Mauritania: "mrt",
  Niger: "ner",
  Nigeria: "nga",
  Senegal: "sen",
  "Sierra Leone": "sle",
  Togo: "tgo"
};

type VisualLayerMode = "no2" | "population";
type BarStyle = CSSProperties & Record<"--bar-width", string>;

const MAP_BACKEND_REQUEST_YEAR = 2024;
const MAP_DEFAULT_DISPLAY_YEAR = 2025;
const TargetNpweiMap = dynamic<TargetNpweiMapProps>(
  () => import("@/components/TargetNpweiMap").then((module) => module.TargetNpweiMap),
  {
    ssr: false,
    loading: () => <MapPanelSkeleton />
  }
);

export function MapExplorer() {
  const { filters, setFilters } = useObservatoryFilters();
  const [season, setSeason] = useState<WebDataSeason>("Annual");
  const [visualLayer, setVisualLayer] = useState<VisualLayerMode>("no2");
  const [selectedCityName, setSelectedCityName] = useState("all");
  const [displayYear, setDisplayYear] = useState(MAP_DEFAULT_DISPLAY_YEAR);
  const displayYears = useMemo(() => getDisplayYears(getLocalWebDataYears()), []);
  const sliderMinYear = displayYears[0] ?? MAP_DEFAULT_DISPLAY_YEAR;
  const sliderMaxYear = displayYears[displayYears.length - 1] ?? MAP_DEFAULT_DISPLAY_YEAR;

  const countryRows = useMemo(() => {
    return getLocalCountryRows(season);
  }, [season]);
  const cityRows = useMemo(() => {
    return getLocalCityRows(season);
  }, [season]);
  const healthSummary = useMemo(() => {
    return getLocalHealthSeasonSummary(season);
  }, [season]);
  const selectedCountryName = countryRows.find((country) => getCountryId(country.country) === filters.countryId)?.country ?? "all";
  const visibleCityRows = useMemo(() => {
    return cityRows
      .filter((row) => selectedCountryName === "all" || row.country === selectedCountryName)
      .filter((row) => selectedCityName === "all" || row.name === selectedCityName);
  }, [cityRows, selectedCityName, selectedCountryName]);
  const hasActiveFilter = selectedCountryName !== "all" || selectedCityName !== "all";
  const activeCityRows = hasActiveFilter ? visibleCityRows : cityRows;
  const cityOptions = useMemo(
    () => cityRows.filter((row) => selectedCountryName === "all" || row.country === selectedCountryName),
    [cityRows, selectedCountryName]
  );
  const visibleCountryRows = useMemo(() => {
    if (selectedCountryName !== "all") return countryRows.filter((row) => row.country === selectedCountryName);
    if (selectedCityName === "all") return countryRows;

    const cityCountries = new Set(activeCityRows.map((row) => row.country));
    return countryRows.filter((row) => cityCountries.has(row.country));
  }, [activeCityRows, countryRows, selectedCityName, selectedCountryName]);
  const topCountry =
    visualLayer === "population"
      ? [...visibleCountryRows].sort((a, b) => b.urbanPopulationMillions - a.urbanPopulationMillions || b.npwei - a.npwei)[0]
      : visibleCountryRows[0];
  const tableRows = useMemo(
    () => getRankedCityRows(activeCityRows, visualLayer),
    [activeCityRows, visualLayer]
  );
  const topCity = tableRows[0];
  const weightedNpwei = getUrbanWeightedNpwei(visibleCountryRows);
  const totalUrbanPopulation = visibleCountryRows.reduce((total, row) => total + row.urbanPopulationMillions, 0);
  const years = getYearsLabel(displayYears);
  const patchFilters = (next: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  const selectCountryName = (countryName: string) => {
    const countryId = countryName === "all" ? "all" : getCountryId(countryName);
    setSelectedCityName("all");
    setFilters((current) => ({ ...current, countryId, cityId: "all" }));
  };

  const selectSeason = (nextSeason: WebDataSeason) => {
    setSeason(nextSeason);
    patchFilters({ season: webSeasonToFilterSeason(nextSeason) });
  };

  const selectCity = (cityName: string) => {
    setSelectedCityName(cityName);
    patchFilters({ cityId: cityName === "all" ? "all" : slugId(cityName) });
  };

  return (
    <div className="data-page-inner map-page target-map-page">
      <section className="target-map-control-bar" aria-label="Map filters">
        <label>
          <span>Country</span>
          <select value={selectedCountryName} onChange={(event) => selectCountryName(event.target.value)}>
            <option value="all">All West Africa</option>
            {countryRows.map((country) => (
              <option key={country.country} value={country.country}>
                {country.country}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>City</span>
          <select value={selectedCityName} onChange={(event) => selectCity(event.target.value)}>
            <option value="all">All Cities</option>
            {cityOptions.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Season</span>
          <select value={season} onChange={(event) => selectSeason(event.target.value as WebDataSeason)}>
            <option value="Annual">All seasons</option>
            <option value="DJF">DJF</option>
            <option value="JJA">JJA</option>
          </select>
        </label>

        <div className="target-map-divider" aria-hidden />

        <label className="target-map-slider">
          <span>
            Year <b>{displayYear}</b>
          </span>
          <input
            max={sliderMaxYear}
            min={sliderMinYear}
            step={1}
            type="range"
            value={displayYear}
            onChange={(event) => setDisplayYear(Number(event.target.value))}
          />
        </label>

        <div className="target-map-layer-toggle" role="group" aria-label="Map layer">
          <button className={visualLayer === "no2" ? "active" : ""} type="button" onClick={() => setVisualLayer("no2")}>
            <Wind size={13} aria-hidden />
            <span>NO{"\u2082"}</span>
          </button>
          <button className={visualLayer === "population" ? "active" : ""} type="button" onClick={() => setVisualLayer("population")}>
            <Users size={13} aria-hidden />
            <span>Pop</span>
          </button>
        </div>
      </section>

      <MapKpiStrip
        healthSummary={healthSummary}
        metricMode={visualLayer}
        season={season}
        topCity={topCity}
        topCountry={topCountry}
        totalUrbanPopulation={totalUrbanPopulation}
        weightedNpwei={weightedNpwei}
      />

      <section className="target-map-layout" aria-label="Population weighted exposure map and city ranking">
        <article className="target-map-card">
          <header className="target-map-card-header">
            <div className="target-season-tabs" role="group" aria-label="Season view">
              {(["Annual", "DJF", "JJA"] as const).map((item) => (
                <button className={season === item ? "active" : ""} key={item} type="button" onClick={() => selectSeason(item)}>
                  {item}
                </button>
              ))}
            </div>
          </header>
          <div className="target-map-surface">
            <TargetNpweiMap
              filterActive={hasActiveFilter}
              layerMode={visualLayer}
              rows={activeCityRows}
              season={season}
              year={MAP_BACKEND_REQUEST_YEAR}
            />
            <div className="target-pop-layer-note">
              {visualLayer === "population" ? "Population count" : "PWE = NO2 x Population"}
            </div>
          </div>
        </article>

        <CityExposureTable
          metricMode={visualLayer}
          rows={tableRows}
          season={season}
          years={years}
          selectedCityName={selectedCityName}
          onSelect={selectCity}
        />
      </section>
    </div>
  );
}

function MapKpiStrip({
  healthSummary,
  metricMode,
  season,
  topCity,
  topCountry,
  totalUrbanPopulation,
  weightedNpwei
}: {
  healthSummary: ReturnType<typeof getLocalHealthSeasonSummary>;
  metricMode: VisualLayerMode;
  season: WebDataSeason;
  topCity?: CityNpweiRow;
  topCountry?: CountryPweRow;
  totalUrbanPopulation: number;
  weightedNpwei: number;
}) {
  const weightedRisk = getRiskLabel(weightedNpwei);
  const isPopulation = metricMode === "population";

  return (
    <section className="target-map-kpi-strip" aria-label="Map summary">
      <article className="target-map-kpi">
        <span>{isPopulation ? "West Africa Urban Pop" : "West Africa Avg NPWEI Index"}</span>
        <strong className={isPopulation ? "blue" : "warn"}>{isPopulation ? formatPopulation(totalUrbanPopulation) : weightedNpwei}</strong>
        <small>{isPopulation ? "NASA GPW 2020" : weightedRisk}</small>
      </article>
      <article className="target-map-kpi">
        <span>{isPopulation ? "Largest Urban Country" : "Highest NO\u2082 Country"}</span>
        <strong className="red">{topCountry?.country ?? "No data"}</strong>
        <small className={isPopulation ? "blue" : "red"}>
          {topCountry ? (isPopulation ? formatPopulation(topCountry.urbanPopulationMillions) : formatScore(topCountry.npwei)) : "No data"}
        </small>
      </article>
      <article className="target-map-kpi">
        <span>{isPopulation ? "Largest Urban City" : "Highest Urban Hotspot"}</span>
        <strong className="red">{topCity ? `${topCity.name}, ${topCity.country}` : "No data"}</strong>
        <small className={isPopulation ? "blue" : "red"}>{topCity ? (isPopulation ? formatPopulation(topCity.urbanPop) : formatScore(topCity.npwei)) : "No data"}</small>
      </article>
      <article className="target-map-kpi">
        <span>Pop in High-Column Zones</span>
        <strong>{healthSummary.high_risk_population_millions.toFixed(1)}M</strong>
        <small className="blue">{healthSummary.high_risk_pct_urban.toFixed(1)}% of urban pop</small>
      </article>
      <article className="target-map-kpi">
        <span>{isPopulation ? "Population Scale" : "NPWEI Index Range"}</span>
        <strong>0-100</strong>
        <small>{SEASON_LABELS[season]}</small>
      </article>
    </section>
  );
}

function CityExposureTable({
  metricMode,
  rows,
  season,
  years,
  selectedCityName,
  onSelect
}: {
  metricMode: VisualLayerMode;
  rows: CityNpweiRow[];
  season: WebDataSeason;
  years: string;
  selectedCityName: string;
  onSelect: (cityName: string) => void;
}) {
  const maxUrbanPop = Math.max(1, ...rows.map((row) => row.urbanPop));
  const isPopulation = metricMode === "population";
  const title = isPopulation ? "Urban Population by City" : "NO\u2082 Exposure by City";
  const valueHeader = isPopulation ? "POP (M)" : "NPWEI Index";

  return (
    <aside className="target-city-panel" aria-label={title}>
      <header>
        <h2>{title}</h2>
        <p>
          {season === "Annual" ? "Annual Average" : SEASON_LABELS[season]} {"\u00b7"} {years}
        </p>
      </header>
      <div className="target-city-table" role="table">
        <div className="target-city-row target-city-head" role="row">
          <span role="columnheader">City</span>
          <span role="columnheader">Country</span>
          <span role="columnheader">{valueHeader}</span>
        </div>
        {rows.map((row) => {
          const populationScore = Math.round((row.urbanPop / maxUrbanPop) * 100);
          const style = {
            "--bar-width": `${Math.max(3, isPopulation ? populationScore : row.npwei)}%`
          } as BarStyle;
          const scoreColor = isPopulation ? getPopulationBarColor(populationScore) : row.riskColor;
          const scoreValue = isPopulation ? formatPopulation(row.urbanPop) : String(row.npwei);

          return (
            <button
              className={selectedCityName === row.name ? "target-city-row active" : "target-city-row"}
              key={`${row.country}-${row.name}`}
              role="row"
              style={style}
              type="button"
              onClick={() => onSelect(row.name)}
            >
              <span role="cell">{row.name}</span>
              <span role="cell">{row.country}</span>
              <span className={isPopulation ? "target-city-score population" : "target-city-score"} role="cell">
                <i style={{ backgroundColor: scoreColor }} />
                <b>{scoreValue}</b>
              </span>
            </button>
          );
        })}
        {rows.length === 0 ? (
          <div className="target-city-row target-city-empty" role="row">
            <span role="cell">No mapped cities</span>
            <span role="cell">Selected filter</span>
            <span role="cell">-</span>
          </div>
        ) : null}
      </div>
      <footer>NASA Gridded Population 2020 {"\u00b7"} {"\u2265"}50 ppl/km{"\u00b2"} urban pixels</footer>
    </aside>
  );
}

function getRankedCityRows(rows: CityNpweiRow[], metricMode: VisualLayerMode) {
  return [...rows].sort((a, b) => {
    if (metricMode === "population") return b.urbanPop - a.urbanPop || b.npwei - a.npwei;
    return b.npwei - a.npwei || b.urbanPop - a.urbanPop;
  });
}

function webSeasonToFilterSeason(season: WebDataSeason): Season {
  if (season === "DJF") return "dry";
  if (season === "JJA") return "wet";
  return "all";
}

function getUrbanWeightedNpwei(rows: CountryPweRow[]) {
  const population = rows.reduce((total, row) => total + row.urbanPopulationMillions, 0);
  if (population === 0) return 0;
  return Math.floor(rows.reduce((total, row) => total + row.npwei * row.urbanPopulationMillions, 0) / population);
}

function getRiskLabel(score: number) {
  if (score >= 80) return "Very High";
  if (score >= 60) return "High";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Low";
  return "Minimal";
}

function formatScore(score: number) {
  return score >= 100 ? "\u2197 100/100" : `${score}/100`;
}

function formatPopulation(populationMillions: number) {
  if (populationMillions >= 10) return `${populationMillions.toFixed(1)}M`;
  return `${populationMillions.toFixed(2)}M`;
}

function getPopulationBarColor(value: number) {
  if (value >= 82) return "#281f84";
  if (value >= 62) return "#1e4694";
  if (value >= 38) return "#1674a6";
  if (value >= 18) return "#30aeb7";
  return "#8bd5d2";
}

function getDisplayYears(years: number[]) {
  return [...new Set([...years, MAP_DEFAULT_DISPLAY_YEAR])].sort((a, b) => a - b);
}

function getCountryId(countryName: string) {
  return COUNTRY_IDS[countryName] ?? slugId(countryName);
}

function slugId(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getYearsLabel(years: number[]) {
  if (years.length === 0) return "No generated years";
  if (years.length === 1) return String(years[0]);
  return `${years[0]}-${years[years.length - 1]}`;
}

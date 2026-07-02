"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Building2, CalendarDays, Download, Globe2, Printer, Sprout } from "lucide-react";
import {
  AnnualNpweiTrendChart,
  CityHotspotsChart,
  CountryRankingChart,
  SeasonalCycleChart
} from "@/components/Charts";
import { BrandedNavbar } from "@/components/BrandedNavbar";
import {
  SEASON_LABELS,
  getCityRows,
  getCountryRows,
  getWebDataYears,
  getWebDataSummary,
  webDataSummary
} from "@/data/webData";
import type { WebDataSeason } from "@/data/webData";
import { useBackendWebData } from "@/data/useWebData";

type SeasonFilter = "all" | "dry" | "wet";

const seasonOptions: Array<{ label: string; value: SeasonFilter }> = [
  { label: "All seasons", value: "all" },
  { label: "Dry season", value: "dry" },
  { label: "Wet season", value: "wet" }
];

function seasonToWebDataSeason(season: SeasonFilter): WebDataSeason {
  if (season === "dry") return "DJF";
  if (season === "wet") return "JJA";
  return "Annual";
}

function downloadFile(filename: string, mimeType: string, contents: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
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

export function TrendsPage() {
  const { version: dataVersion } = useBackendWebData();
  const years = Array.from(
    new Set([...(getWebDataSummary().years_covered.length > 0 ? getWebDataSummary().years_covered : webDataSummary.years_covered), ...getWebDataYears()])
  ).sort((a, b) => a - b);
  const [country, setCountry] = useState("all");
  const [city, setCity] = useState("all");
  const [year, setYear] = useState(years[years.length - 1] ?? 2024);
  const [season, setSeason] = useState<SeasonFilter>("all");
  const selectedSeason = seasonToWebDataSeason(season);

  const countries = useMemo(() => {
    void dataVersion;
    return getCountryRows("Annual").map((row) => row.country);
  }, [dataVersion]);
  const allCityRows = useMemo(() => {
    void dataVersion;
    return getCityRows(selectedSeason);
  }, [dataVersion, selectedSeason]);
  const cityOptions = useMemo(
    () => allCityRows.filter((row) => country === "all" || row.country === country).map((row) => row.name),
    [allCityRows, country]
  );
  const selectedLabel = country === "all" ? "West Africa" : country;
  const cityLabel = city === "all" ? "All cities" : city;
  const selectedSeasonLabel = season === "all" ? "Annual Mean" : SEASON_LABELS[selectedSeason];

  const exportCsv = () => {
    const rows = allCityRows.filter((row) => {
      if (country !== "all" && row.country !== country) return false;
      if (city !== "all" && row.name !== city) return false;
      return true;
    });

    const csv = toCsv([
      ["City", "Country", "Year", "Season", "NPWEI", "Annual_NPWEI", "DJF_NPWEI", "JJA_NPWEI", "Urban_Pop_M"],
      ...rows.map((row) => [
        row.name,
        row.country,
        year,
        selectedSeasonLabel,
        row.npwei,
        row.annualNpwei,
        row.djfNpwei,
        row.jjaNpwei,
        row.urbanPop.toFixed(2)
      ])
    ]);

    downloadFile(`clene-trends-${selectedLabel.replace(/\s+/g, "-").toLowerCase()}-${year}.csv`, "text/csv", csv);
  };

  return (
    <main className="branded-data-page trends-page">
      <BrandedNavbar />

      <section className="data-page-shell trends-dashboard-shell" aria-labelledby="trends-title">
        <div className="data-page-inner trends-dashboard-inner">
          <header className="data-page-heading trends-hero-panel">
            <div>
              <span className="data-kicker">
                <i aria-hidden />
                Trends and Analytics
              </span>
              <h1 id="trends-title">{selectedLabel} Trend Diagnostics</h1>
              <p>Annual trends, seasonal cycle, and population-weighted exposure.</p>
            </div>

            <div className="trends-export-actions" aria-label="Export trends">
              <button type="button" title="Export CSV" onClick={exportCsv}>
                <Download size={14} aria-hidden />
                <span>CSV</span>
              </button>
              <button type="button" title="Print PDF" onClick={() => window.print()}>
                <Printer size={14} aria-hidden />
                <span>PDF</span>
              </button>
            </div>
          </header>

          <section className="trends-filter-panel" aria-label="Trend filters">
            <label>
              <span>
                <Globe2 size={13} aria-hidden />
                Country
              </span>
              <select
                value={country}
                onChange={(event) => {
                  setCountry(event.target.value);
                  setCity("all");
                }}
              >
                <option value="all">All West Africa</option>
                {countries.map((countryName) => (
                  <option key={countryName} value={countryName}>
                    {countryName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>
                <Building2 size={13} aria-hidden />
                City
              </span>
              <select value={city} onChange={(event) => setCity(event.target.value)}>
                <option value="all">All cities</option>
                {cityOptions.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>
                <CalendarDays size={13} aria-hidden />
                Year
              </span>
              <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
                {years.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>
                <Sprout size={13} aria-hidden />
                Season
              </span>
              <select value={season} onChange={(event) => setSeason(event.target.value as SeasonFilter)}>
                {seasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="trends-chart-grid" aria-label="Trend diagnostics">
            <TrendsPanel badge="West Africa Average" subtitle="Annual - DJF - JJA - 0-100" title="Yearly NPWEI Trend">
              <AnnualNpweiTrendChart />
            </TrendsPanel>

            <TrendsPanel badge={selectedSeasonLabel} subtitle={`All countries ranked by NPWEI - ${selectedSeasonLabel}`} title="Country Comparison">
              <CountryRankingChart season={selectedSeason} />
            </TrendsPanel>

            <TrendsPanel badge="Dry vs Wet" subtitle="Indicative monthly NPWEI pattern" title="Seasonal Monthly Cycle">
              <SeasonalCycleChart />
            </TrendsPanel>

            <TrendsPanel
              badge={country === "all" ? "Top 10 All Countries" : `Top 10 ${country}`}
              subtitle={`Top cities by NPWEI - ${cityLabel}`}
              title="City Rankings"
            >
              <CityHotspotsChart country={country} season={selectedSeason} />
            </TrendsPanel>
          </section>
        </div>
      </section>
    </main>
  );
}

function TrendsPanel({
  badge,
  children,
  subtitle,
  title
}: {
  badge: string;
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <article className="trends-panel">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span>{badge}</span>
      </header>
      <div className="trends-panel-visual">{children}</div>
    </article>
  );
}

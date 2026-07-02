"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Chart from "chart.js/auto";
import type { ChartConfiguration } from "chart.js";
import { AlertTriangle, ArrowDownToLine, CloudSun, FileText, Globe2, Search, SlidersHorizontal } from "lucide-react";
import { BrandedNavbar } from "@/components/BrandedNavbar";
import {
  RISK_TIER_ORDER,
  SEASON_LABELS,
  WEB_DATA_SEASONS,
  buildCitiesCsv,
  formatPwe,
  getCityRow,
  getCityRows,
  getHealthSeasonSummary,
  getWebDataYearRange,
  type CityNpweiRow,
  type RiskTierLabel,
  type WebDataSeason
} from "@/data/webData";
import { useBackendWebData } from "@/data/useWebData";

const ALL_COUNTRIES = "all";
const ALL_RISK_LEVELS = "all";
const DEFAULT_CITY = "Dakar";

type RiskFilter = typeof ALL_RISK_LEVELS | RiskTierLabel;
type SortMode = "npwei" | "population" | "city" | "djf" | "jja";

export function CitiesPage() {
  const { version: dataVersion } = useBackendWebData();
  const [season, setSeason] = useState<WebDataSeason>("Annual");
  const [country, setCountry] = useState(ALL_COUNTRIES);
  const [riskLevel, setRiskLevel] = useState<RiskFilter>(ALL_RISK_LEVELS);
  const [sortBy, setSortBy] = useState<SortMode>("npwei");
  const [searchTerm, setSearchTerm] = useState("");
  const rows = useMemo(() => {
    void dataVersion;
    return getCityRows(season);
  }, [dataVersion, season]);
  const yearRange = useMemo(() => {
    void dataVersion;
    return getWebDataYearRange();
  }, [dataVersion]);
  const [selectedCity, setSelectedCity] = useState(() => rows.find((row) => row.name === DEFAULT_CITY)?.name ?? rows[0]?.name ?? "Lagos");
  const selected = getCityRow(selectedCity, season);
  const healthSummary = getHealthSeasonSummary(season);
  const countryOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.country))).sort(), [rows]);
  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const visible = rows.filter((row) => {
      const matchesCountry = country === ALL_COUNTRIES || row.country === country;
      const matchesRisk = riskLevel === ALL_RISK_LEVELS || row.riskLabel === riskLevel;
      const matchesSearch = query.length === 0 || row.name.toLowerCase().includes(query) || row.country.toLowerCase().includes(query);
      return matchesCountry && matchesRisk && matchesSearch;
    });

    return [...visible].sort((a, b) => {
      if (sortBy === "population") return b.urbanPop - a.urbanPop || b.npwei - a.npwei;
      if (sortBy === "city") return a.name.localeCompare(b.name);
      if (sortBy === "djf") return b.djfNpwei - a.djfNpwei || b.npwei - a.npwei;
      if (sortBy === "jja") return b.jjaNpwei - a.jjaNpwei || b.npwei - a.npwei;
      return b.npwei - a.npwei || b.urbanPop - a.urbanPop;
    });
  }, [country, riskLevel, rows, searchTerm, sortBy]);
  const visibleTopCity = useMemo(
    () => [...filteredRows].sort((a, b) => b.npwei - a.npwei || b.urbanPop - a.urbanPop)[0] ?? rows[0],
    [filteredRows, rows]
  );
  const rankedChartRows = useMemo(
    () => [...filteredRows].sort((a, b) => b.npwei - a.npwei || b.urbanPop - a.urbanPop).slice(0, 15),
    [filteredRows]
  );
  const dryWetChartRows = useMemo(
    () => [...filteredRows].sort((a, b) => b.npwei - a.npwei || b.urbanPop - a.urbanPop).slice(0, 10),
    [filteredRows]
  );
  const highRiskRows = filteredRows.filter((row) => row.npwei >= 60);

  useEffect(() => {
    if (filteredRows.length > 0 && !filteredRows.some((row) => row.name === selectedCity)) {
      setSelectedCity(filteredRows[0].name);
    }
  }, [filteredRows, selectedCity]);

  const exportCsv = () => {
    const blob = new Blob([buildCitiesCsv(season)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wa_no2_cities_${season}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="branded-data-page cities-page">
      <BrandedNavbar />

      <section className="data-page-shell cities-dashboard-shell" aria-labelledby="cities-title">
        <div className="data-page-inner cities-dashboard-inner">
          <header className="cities-hero-panel">
            <div>
              <span className="data-kicker">
                <i aria-hidden />
                Cities at Risk
              </span>
              <h1 id="cities-title">Urban NO{"\u2082"} Exposure Hotspots</h1>
              <p>Population-weighted exposure across {rows.length} West African cities - {yearRange}</p>
            </div>

            <div className="cities-export-actions" aria-label="City exports">
              <button type="button" onClick={exportCsv}>
                <ArrowDownToLine size={14} aria-hidden />
                <span>CSV</span>
              </button>
              <button type="button" onClick={() => window.print()}>
                <FileText size={14} aria-hidden />
                <span>PDF</span>
              </button>
            </div>
          </header>

          <section className="cities-filter-panel" aria-label="City filters">
            <FilterControl icon={Globe2} label="Country">
              <select value={country} onChange={(event) => setCountry(event.target.value)}>
                <option value={ALL_COUNTRIES}>All Countries</option>
                {countryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </FilterControl>

            <FilterControl icon={CloudSun} label="Season">
              <select value={season} onChange={(event) => setSeason(event.target.value as WebDataSeason)}>
                {WEB_DATA_SEASONS.map((item) => (
                  <option key={item} value={item}>
                    {SEASON_LABELS[item]}
                  </option>
                ))}
              </select>
            </FilterControl>

            <FilterControl icon={AlertTriangle} label="Risk Level">
              <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value as RiskFilter)}>
                <option value={ALL_RISK_LEVELS}>All Risk Levels</option>
                {RISK_TIER_ORDER.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </FilterControl>

            <FilterControl icon={SlidersHorizontal} label="Sort By">
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortMode)}>
                <option value="npwei">NPWEI Score</option>
                <option value="population">Urban Population</option>
                <option value="city">City A-Z</option>
                <option value="djf">DJF Score</option>
                <option value="jja">JJA Score</option>
              </select>
            </FilterControl>
          </section>

          <section className="cities-kpi-grid" aria-label="City exposure summary">
            <CityKpiCard label="Cities Analysed" meta="West Africa urban centres" value={String(filteredRows.length)} />
            <CityKpiCard accent="red" label="High/Very High Risk" meta={`of ${filteredRows.length} cities shown`} value={String(highRiskRows.length)} />
            <CityKpiCard
              accent="red"
              label="Top Hotspot City"
              meta={`${visibleTopCity.npwei}/100 · ${visibleTopCity.riskLabel}`}
              value={visibleTopCity.name}
            />
            <CityKpiCard
              accent="blue"
              label="Urban Pop At High Risk"
              meta={`${healthSummary.high_risk_pct_urban.toFixed(1)}% of urban pop`}
              value={`${healthSummary.high_risk_population_millions.toFixed(1)}M`}
            />
          </section>

          <section className="cities-layout" aria-label="City rankings and detail">
            <article className="data-panel city-table-panel">
              <header className="data-panel-header">
                <div>
                  <h2>City Exposure Rankings</h2>
                  <p>{SEASON_LABELS[season]} - {yearRange}</p>
                </div>
                <label className="city-search-control">
                  <Search size={14} aria-hidden />
                  <input
                    aria-label="Search city"
                    placeholder="Search city..."
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>
              </header>

              <div className="city-table-wrap">
                <table className="city-ranking-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>City ↑</th>
                      <th>Country</th>
                      <th>NPWEI ↑</th>
                      <th>Risk</th>
                      <th>Pop (M) ↑</th>
                      <th>DJF</th>
                      <th>JJA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        className={row.name === selected.name ? "selected" : ""}
                        key={row.name}
                        onClick={() => setSelectedCity(row.name)}
                      >
                        <td className="rank-cell">{row.rank}</td>
                        <td>
                          <button type="button" onClick={() => setSelectedCity(row.name)}>
                            {row.name}
                          </button>
                        </td>
                        <td>{row.country}</td>
                        <td>
                          <div className="score-bar-cell">
                            <span className={`score-bar ${row.riskTone}`} style={{ width: `${Math.max(row.npwei, 4)}%` }} />
                            <strong style={{ color: row.riskColor }}>{row.npwei}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={`risk-pill ${row.riskTone}`}>{row.riskLabel}</span>
                        </td>
                        <td>{row.urbanPop.toFixed(2)}M</td>
                        <td>{row.djfNpwei}</td>
                        <td>{row.jjaNpwei}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <footer className="city-table-footnote">Click any row for city details · NASA Gridded Population 2020 · ≥50 ppl/km²</footer>
            </article>

            <CityDetail row={selected} />
          </section>

          <section className="cities-chart-grid" aria-label="City exposure charts">
            <article className="data-panel cities-chart-panel">
              <header className="data-panel-header">
                <div>
                  <h2>Top 15 Cities - NPWEI Ranking</h2>
                  <p>Ranked by exposure · 0–100</p>
                </div>
                <span>{SEASON_LABELS[season]}</span>
              </header>
              <CityNpweiChart rows={rankedChartRows} />
            </article>

            <article className="data-panel cities-chart-panel">
              <header className="data-panel-header">
                <div>
                  <h2>Dry vs Wet Season</h2>
                  <p>DJF (orange) vs JJA (green)</p>
                </div>
                <span>DJF vs JJA · Top 10</span>
              </header>
              <DryWetCityChart rows={dryWetChartRows} />
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}

function CityNpweiChart({ rows }: { rows: CityNpweiRow[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labels = useMemo(() => rows.map((row) => row.name), [rows]);
  const values = useMemo(() => rows.map((row) => row.npwei), [rows]);
  const colors = useMemo(() => rows.map((row) => row.riskColor), [rows]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const config: ChartConfiguration<"bar", number[], string> = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            backgroundColor: colors,
            borderRadius: 5,
            barThickness: 8,
            data: values
          }
        ]
      },
      options: {
        animation: false,
        indexAxis: "y",
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.x}/100 NPWEI`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            border: {
              color: "#d8e4f2"
            },
            grid: {
              color: "#e7eef7"
            },
            ticks: {
              color: "#526b91",
              font: {
                size: 10
              }
            }
          },
          y: {
            border: {
              display: false
            },
            grid: {
              display: false
            },
            ticks: {
              color: "#526b91",
              font: {
                size: 10,
                weight: "700"
              }
            }
          }
        }
      }
    };

    const chart = new Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, [colors, labels, values]);

  return (
    <div className="cities-chart-canvas-wrap">
      <canvas aria-label="Top city NPWEI ranking" ref={canvasRef} role="img" />
    </div>
  );
}

function DryWetCityChart({ rows }: { rows: CityNpweiRow[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labels = useMemo(() => rows.map((row) => (row.name.length > 9 ? `${row.name.slice(0, 8)}...` : row.name)), [rows]);
  const djfValues = useMemo(() => rows.map((row) => row.djfNpwei), [rows]);
  const jjaValues = useMemo(() => rows.map((row) => row.jjaNpwei), [rows]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const config: ChartConfiguration<"bar", number[], string> = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            backgroundColor: "#f97316",
            borderRadius: 4,
            barThickness: 20,
            data: djfValues,
            label: "DJF"
          },
          {
            backgroundColor: "#22c55e",
            borderRadius: 4,
            barThickness: 20,
            data: jjaValues,
            label: "JJA"
          }
        ]
      },
      options: {
        animation: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            align: "center",
            labels: {
              boxHeight: 8,
              boxWidth: 8,
              color: "#526b91",
              font: {
                size: 10,
                weight: "700"
              }
            },
            position: "bottom"
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y}/100 NPWEI`
            }
          }
        },
        scales: {
          x: {
            border: {
              display: false
            },
            grid: {
              display: false
            },
            ticks: {
              color: "#526b91",
              font: {
                size: 9
              },
              maxRotation: 0,
              minRotation: 0
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            border: {
              color: "#d8e4f2"
            },
            grid: {
              color: "#e7eef7"
            },
            ticks: {
              color: "#526b91",
              font: {
                size: 10
              }
            }
          }
        }
      }
    };

    const chart = new Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, [djfValues, jjaValues, labels]);

  return (
    <div className="cities-chart-canvas-wrap">
      <canvas aria-label="Dry versus wet season city NPWEI comparison" ref={canvasRef} role="img" />
    </div>
  );
}

function CityDetail({ row }: { row: CityNpweiRow }) {
  return (
    <article className="data-panel city-detail-panel">
      <header className="city-detail-hero">
        <div>
          <h2>{row.name}</h2>
          <p>
            {row.country} · {row.lat.toFixed(2)}°N, {row.lon.toFixed(2)}°E
          </p>
        </div>
        <span className={`risk-pill ${row.riskTone}`}>{row.riskLabel}</span>
        <div className="city-detail-score">
          <strong style={{ color: row.riskColor }}>{row.npwei}</strong>
          <span>/100 NPWEI</span>
        </div>
      </header>

      <section className="city-detail-section city-season-card-group" aria-labelledby="seasonal-comparison-title">
        <h3 id="seasonal-comparison-title">Seasonal Comparison</h3>
        <div className="city-season-cards">
          <DetailStat label="Dry (DJF)" value={String(row.djfNpwei)} meta="/100 NPWEI" tone="djf" />
          <DetailStat label="Wet (JJA)" value={String(row.jjaNpwei)} meta="/100 NPWEI" tone="jja" />
        </div>
        <p className="city-season-note">{getSeasonDifferenceText(row)}</p>
      </section>

      <section className="city-detail-section" aria-labelledby="exposure-profile-title">
        <h3 id="exposure-profile-title">Exposure Profile</h3>
        <div className="detail-season-list" aria-label={`${row.name} seasonal scores`}>
          <SeasonBar label="Annual" value={row.annualNpwei} tone="annual" />
          <SeasonBar label="DJF" value={row.djfNpwei} tone="djf" />
          <SeasonBar label="JJA" value={row.jjaNpwei} tone="jja" />
        </div>
      </section>

      <section className="city-detail-section" aria-labelledby="city-stat-title">
        <h3 id="city-stat-title">City Statistics</h3>
        <dl className="city-stat-list">
          <div>
            <dt>Urban Population</dt>
            <dd>{row.urbanPop.toFixed(2)}M</dd>
          </div>
          <div>
            <dt>Coordinates</dt>
            <dd>
              {row.lat.toFixed(2)}°, {row.lon.toFixed(2)}°
            </dd>
          </div>
          <div>
            <dt>Country</dt>
            <dd>{row.country}</dd>
          </div>
          <div>
            <dt>PWE</dt>
            <dd>{formatPwe(row.pwe)}</dd>
          </div>
        </dl>
      </section>

      <section className="city-detail-section" aria-labelledby="risk-interpretation-title">
        <h3 id="risk-interpretation-title">Risk Interpretation</h3>
        <div className="interpretation-box">
          <strong>{row.riskLabel} but manageable.</strong>
          <p>{getCityInterpretation(row)}</p>
        </div>
      </section>
    </article>
  );
}

function FilterControl({ children, icon: Icon, label }: { children: ReactNode; icon: typeof Globe2; label: string }) {
  return (
    <label>
      <span>
        <Icon size={12} aria-hidden />
        {label}
      </span>
      {children}
    </label>
  );
}

function CityKpiCard({ accent = "default", label, meta, value }: { accent?: "default" | "red" | "blue"; label: string; meta: string; value: string }) {
  return (
    <article className={`cities-kpi-card ${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </article>
  );
}

function DetailStat({
  label,
  meta,
  tone = "default",
  value
}: {
  label: string;
  meta?: string;
  tone?: "default" | "djf" | "jja";
  value: string;
}) {
  return (
    <div className={`detail-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {meta ? <small>{meta}</small> : null}
    </div>
  );
}

function SeasonBar({ label, tone, value }: { label: string; tone: "annual" | "djf" | "jja"; value: number }) {
  return (
    <div className="season-bar">
      <span>{label}</span>
      <div aria-hidden>
        <i className={tone} style={{ width: `${Math.max(value, 3)}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function getSeasonDifferenceText(row: CityNpweiRow) {
  const gap = Math.abs(row.jjaNpwei - row.djfNpwei);
  if (row.jjaNpwei > row.djfNpwei) return `JJA is ${gap} pts higher than DJF`;
  if (row.djfNpwei > row.jjaNpwei) return `DJF is ${gap} pts higher than JJA`;
  return "DJF and JJA are equal";
}

function getCityInterpretation(row: CityNpweiRow) {
  if (row.npwei >= 80) return `${row.name} sits in the highest regional exposure tier and should be prioritized for monitoring and mitigation.`;
  if (row.npwei >= 60) return `${row.name} has high relative exposure, indicating increased concern for vulnerable urban populations.`;
  if (row.npwei >= 40) return `${row.name} shows moderate relative NO2 burden compared with other West African cities.`;
  if (row.npwei >= 20) return `${row.name} is in the low regional exposure tier and below the highest exposure groups.`;
  return `${row.name} has low relative exposure in this regional comparison.`;
}
